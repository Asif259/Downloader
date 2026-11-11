import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { normalizeUrl, detectPlatform } from "@/lib/detector";
import { validateUrlDns } from "@/lib/dnsValidator";
import { downloadWithProgress } from "@/lib/downloader";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";
import { clearTaskCanceler, createTask, setTaskCanceler, updateTask } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS(request) {
  return corsPreflight(request);
}

function createProgressUpdater(taskId) {
  let lastWrittenProgress = 0;
  let cooldownActive = false;
  let latestPending = null;
  let cooldownTimer = null;
  const COOLDOWN_MS = 300;

  const flush = async (data) => {
    await updateTask(taskId, { ...data, status: "downloading" });
    lastWrittenProgress = data.progress || 0;
  };

  const update = (progressData) => {
    const progress = progressData.progress || 0;
    const delta = Math.abs(progress - lastWrittenProgress);

    if (delta < 2 && progress !== 100) {
      latestPending = progressData;
      return;
    }

    if (cooldownActive) {
      latestPending = progressData;
      return;
    }

    void flush(progressData);
    latestPending = null;
    cooldownActive = true;

    cooldownTimer = setTimeout(() => {
      cooldownActive = false;
      if (latestPending) {
        const data = latestPending;
        latestPending = null;
        update(data);
      }
    }, COOLDOWN_MS);
  };

  update.cleanup = () => {
    if (cooldownTimer) {
      clearTimeout(cooldownTimer);
      cooldownTimer = null;
    }
    if (latestPending) {
      void flush(latestPending);
      latestPending = null;
    }
  };

  return update;
}

async function startDownloadTask({ taskId, url, format }) {
  let cleanup = null;
  const abortController = new AbortController();
  try {
    await updateTask(taskId, { status: "downloading", progress: 0, error: null });
    setTaskCanceler(taskId, () => abortController.abort());

    const throttledUpdate = createProgressUpdater(taskId);
    cleanup = throttledUpdate.cleanup;

    let result;
    try {
      result = await downloadWithProgress({
        url,
        format,
        onProgress: throttledUpdate,
        signal: abortController.signal,
      });
    } catch (error) {
      const message = String(error?.message || "");
      const canRetryWithBest =
        !!format &&
        format !== "best" &&
        (message.includes("Requested format is not available") ||
          message.includes("requested format") ||
          message.includes("not available"));

      if (!canRetryWithBest) {
        throw error;
      }

      // Source can change between format listing and download start.
      result = await downloadWithProgress({
        url,
        format: "best",
        onProgress: throttledUpdate,
        signal: abortController.signal,
      });
    }

    await updateTask(taskId, { status: "completed", progress: 100, filePath: result.filePath });
  } catch (error) {
    const canceled = (error?.message || "").toLowerCase().includes("canceled");
    await updateTask(taskId, {
      status: "failed",
      error: canceled ? "Download canceled due to page reload." : error.message || "Download failed",
    });
  } finally {
    cleanup?.();
    clearTaskCanceler(taskId);
  }
}

export async function POST(request) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      const response = applyCors(
        NextResponse.json({ error: "Invalid JSON body.", code: "INVALID_JSON" }, { status: 400 }),
        request,
      );
      logRequest({
        method: "POST",
        route: "/api/download",
        status: 400,
        durationMs: Date.now() - startedAt,
        errorCode: "INVALID_JSON",
      });
      return response;
    }

    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      const response = applyCors(
        NextResponse.json({ error: "A valid URL is required.", code: "INVALID_URL" }, { status: 400 }),
        request,
      );
      logRequest({ method: "POST", route: "/api/download", status: 400, durationMs: Date.now() - startedAt, errorCode: "INVALID_URL" });
      return response;
    }

    const dnsCheck = await validateUrlDns(normalizedUrl);
    if (!dnsCheck.safe) {
      const response = applyCors(
        NextResponse.json(
          { error: "The provided URL resolves to a private or inaccessible network address.", code: "SSRF_BLOCKED" },
          { status: 400 },
        ),
        request,
      );
      logRequest({ method: "POST", route: "/api/download", status: 400, durationMs: Date.now() - startedAt, errorCode: "SSRF_BLOCKED" });
      return response;
    }

    const task = await createTask({
      url: normalizedUrl,
      format: body?.format || "best",
      sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
    });

    startDownloadTask({
      taskId: task.id,
      url: normalizedUrl,
      format: body?.format || "best",
    });

    const response = applyCors(
      NextResponse.json({
        taskId: task.id,
        platform: detectPlatform(normalizedUrl),
        status: "started",
      }),
      request,
    );
    logRequest({ method: "POST", route: "/api/download", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to start download.");
    const response = applyCors(
      NextResponse.json(
        { error: classified.message, code: classified.code, userMessage: classified.userMessage },
        { status: classified.status },
      ),
      request,
    );
    logRequest({
      method: "POST",
      route: "/api/download",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
