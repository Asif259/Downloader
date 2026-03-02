import { createReadStream, stat } from "node:fs";
import path from "node:path";
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

export async function GET(_request, { params }) {
  const { taskId } = params;
  const task = await getTask(taskId);

  if (!task) {
    return new Response(JSON.stringify({ error: "Task not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (task.status !== "completed" || !task.filePath) {
    return new Response(JSON.stringify({ error: "File not ready." }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fileStats = await new Promise((resolve, reject) =>
    stat(task.filePath, (err, s) => (err ? reject(err) : resolve(s))),
  ).catch(() => null);

  if (!fileStats) {
    return new Response(JSON.stringify({ error: "File not found on disk." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filename = path.basename(task.filePath);
  const ext = filename.split(".").pop().toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  const nodeStream = createReadStream(task.filePath);
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  const encodedFilename = encodeURIComponent(filename).replace(/'/g, "%27");

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStats.size),
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
