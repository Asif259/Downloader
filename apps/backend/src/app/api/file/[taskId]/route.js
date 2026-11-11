import { createReadStream, stat } from "node:fs";
import path from "node:path";
import { applyCors, corsPreflight } from "@/lib/cors";
import { isPathWithinDownloadDir } from "@/lib/downloader";
import { classifyBackendError } from "@/lib/errors";
import { logRequest } from "@/lib/requestLog";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

const MIME = {
  mp4: "video/mp4",
  mkv: "video/x-matroska",
  webm: "video/webm",
  mov: "video/quicktime",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function toAsciiFilename(name, fallbackExt = "bin") {
  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex > 0 ? name.slice(dotIndex + 1) : fallbackExt;
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;

  const normalized = base
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/["\\]/g, "")
    .replace(/[\/:*?<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const safeBase = normalized || "download";
  return `${safeBase}.${ext}`;
}

export function OPTIONS(request) {
  return corsPreflight(request);
}

export async function GET(request, context) {
  const startedAt = Date.now();
  try {
    const { taskId } = await context.params;
    if (!taskId) {
      const response = applyCors(new Response(JSON.stringify({ error: "Task ID is required.", code: "INVALID_TASK_ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }), request);
      logRequest({ method: "GET", route: "/api/file/[taskId]", status: 400, durationMs: Date.now() - startedAt, errorCode: "INVALID_TASK_ID" });
      return response;
    }

    const task = await getTask(taskId);

    if (!task) {
      const response = applyCors(new Response(JSON.stringify({ error: "Task not found.", code: "TASK_NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }), request);
      logRequest({ method: "GET", route: "/api/file/[taskId]", status: 404, durationMs: Date.now() - startedAt, errorCode: "TASK_NOT_FOUND" });
      return response;
    }

    if (task.status !== "completed" || !task.filePath) {
      const response = applyCors(new Response(JSON.stringify({ error: "File not ready.", code: "FILE_NOT_READY" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }), request);
      logRequest({ method: "GET", route: "/api/file/[taskId]", status: 409, durationMs: Date.now() - startedAt, errorCode: "FILE_NOT_READY" });
      return response;
    }

    if (!isPathWithinDownloadDir(task.filePath)) {
      const response = applyCors(new Response(JSON.stringify({ error: "Access to the requested file path is restricted.", code: "ACCESS_DENIED" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }), request);
      logRequest({ method: "GET", route: "/api/file/[taskId]", status: 403, durationMs: Date.now() - startedAt, errorCode: "ACCESS_DENIED" });
      return response;
    }

    const fileStats = await new Promise((resolve, reject) =>
      stat(task.filePath, (err, s) => (err ? reject(err) : resolve(s))),
    ).catch(() => null);

    if (!fileStats) {
      const response = applyCors(new Response(JSON.stringify({ error: "File not found on disk.", code: "FILE_NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }), request);
      logRequest({ method: "GET", route: "/api/file/[taskId]", status: 404, durationMs: Date.now() - startedAt, errorCode: "FILE_NOT_FOUND" });
      return response;
    }

    const filename = path.basename(task.filePath);
    const ext = filename.split(".").pop().toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    const nodeStream = createReadStream(task.filePath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => {
          controller.close();
          setTimeout(() => {
            import("node:fs/promises")
              .then(({ unlink }) => unlink(task.filePath))
              .catch(() => {});
          }, 5000);
        });
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    const encodedFilename = encodeURIComponent(filename).replace(/'/g, "%27");
    const asciiFilename = toAsciiFilename(filename, ext || "bin");

    const response = applyCors(new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStats.size),
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-store",
      },
    }), request);
    logRequest({ method: "GET", route: "/api/file/[taskId]", status: 200, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const classified = classifyBackendError(error, "Failed to stream file.");
    const response = applyCors(
      new Response(
        JSON.stringify({ error: classified.message, code: classified.code, userMessage: classified.userMessage }),
        { status: classified.status, headers: { "Content-Type": "application/json" } },
      ),
      request,
    );
    logRequest({
      method: "GET",
      route: "/api/file/[taskId]",
      status: classified.status,
      durationMs: Date.now() - startedAt,
      errorCode: classified.code,
    });
    return response;
  }
}
