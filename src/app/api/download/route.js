import { NextResponse } from "next/server";
import { normalizeUrl, detectPlatform } from "@/lib/detector";
import { downloadWithProgress } from "@/lib/downloader";
import { createTask, updateTask } from "@/lib/tasks";
import { createHistoryRecord, updateHistoryRecord } from "@/lib/historyStore";

export const runtime = "nodejs";

function createProgressUpdater(taskId) {
  let lastProgress = 0;
  let lastUpdateTime = 0;
  let pendingUpdate = null;
  let updateTimeout = null;

  const update = (progressData) => {
    const now = Date.now();
    const progress = progressData.progress || 0;
    const progressDelta = Math.abs(progress - lastProgress);
    const timeDelta = now - lastUpdateTime;

    const shouldUpdate = progressDelta >= 5 || timeDelta >= 500 || progress === 100;

    if (shouldUpdate) {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      updateTimeout = setTimeout(async () => {
        const dataToUpdate = pendingUpdate || progressData;
        await updateTask(taskId, { ...dataToUpdate, status: "downloading" });
        lastProgress = dataToUpdate.progress || 0;
        lastUpdateTime = Date.now();
        pendingUpdate = null;
        updateTimeout = null;
      }, 100);

      lastProgress = progress;
      lastUpdateTime = now;
      pendingUpdate = null;
    } else {
      pendingUpdate = progressData;
    }
  };

  update.cleanup = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
  };

  return update;
}

async function startDownloadTask({ taskId, historyId, url, format }) {
  let cleanup = null;
  try {
    await updateTask(taskId, { status: "downloading", progress: 0, error: null });

    await updateHistoryRecord(historyId, { status: "downloading" });

    const throttledUpdate = createProgressUpdater(taskId);
    cleanup = throttledUpdate.cleanup;

    const result = await downloadWithProgress({
      url,
      format,
      onProgress: throttledUpdate,
    });

    await updateTask(taskId, { status: "completed", progress: 100, filePath: result.filePath });

    await updateHistoryRecord(historyId, {
      status: "completed",
      format: format || "best",
      filePath: result.filePath,
      downloadDir: result.downloadDir,
    });
  } catch (error) {
    await updateTask(taskId, {
      status: "failed",
      error: error.message || "Download failed",
    });

    await updateHistoryRecord(historyId, { status: "failed", error: error.message || "Download failed" });
  } finally {
    cleanup?.();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    const task = await createTask({ url: normalizedUrl, format: body?.format || "best" });

    const historyRecord = await createHistoryRecord({
      url: normalizedUrl,
      platform: detectPlatform(normalizedUrl),
      title: body?.title || null,
      thumbnail: body?.thumbnail || null,
      format: body?.format || "best",
      quality: body?.quality || null,
      status: "pending",
    });

    startDownloadTask({
      taskId: task.id,
      historyId: historyRecord.id,
      url: normalizedUrl,
      format: body?.format || "best",
    });

    return NextResponse.json({
      taskId: task.id,
      historyId: historyRecord.id,
      status: "started",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to start download." }, { status: 500 });
  }
}
