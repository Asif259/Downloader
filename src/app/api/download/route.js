import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { normalizeUrl, detectPlatform } from "@/lib/detector";
import { downloadWithProgress } from "@/lib/downloader";
import { clearTaskCanceler, createTask, setTaskCanceler, updateTask } from "@/lib/tasks";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
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

    const result = await downloadWithProgress({
      url,
      format,
      onProgress: throttledUpdate,
      signal: abortController.signal,
    });

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
  try {
    const body = await request.json();
    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      return applyCors(NextResponse.json({ error: "A valid URL is required." }, { status: 400 }));
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

    return applyCors(NextResponse.json({
      taskId: task.id,
      platform: detectPlatform(normalizedUrl),
      status: "started",
    }));
  } catch (error) {
    return applyCors(NextResponse.json({ error: error.message || "Failed to start download." }, { status: 500 }));
  }
}
