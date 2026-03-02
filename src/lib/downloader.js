import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to run yt-dlp: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || "yt-dlp failed"));
        return;
      }

      resolve(stdout);
    });
  });
}

function parseProgressLine(line) {
  const progressMatch = line.match(/\[download\]\s+(\d{1,3}(?:\.\d+)?)%/i);
  if (!progressMatch) {
    return null;
  }

  const speedMatch = line.match(/at\s+([^\s]+(?:\s*\/s)?)/i);
  const etaMatch = line.match(/ETA\s+([^\s]+)/i);

  return {
    progress: Number(progressMatch[1]),
    speed: speedMatch?.[1] || null,
    eta: etaMatch?.[1] || null,
  };
}

export async function fetchMetadata(url) {
  const raw = await runYtDlp(["--dump-single-json", "--no-warnings", "--skip-download", url]);
  return JSON.parse(raw);
}

export async function fetchFormats(url) {
  const metadata = await fetchMetadata(url);
  const formats = (metadata.formats || []).map((item) => ({
    formatId: item.format_id,
    ext: item.ext,
    resolution: item.resolution || item.format_note || "unknown",
    fps: item.fps || null,
    vcodec: item.vcodec,
    acodec: item.acodec,
    filesize: item.filesize || item.filesize_approx || null,
    note: item.format_note || null,
  }));

  return {
    title: metadata.title,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration,
    formats,
  };
}

export async function downloadWithProgress({ url, format, onProgress }) {
  await mkdir(DOWNLOAD_DIR, { recursive: true });

  return new Promise((resolve, reject) => {
    const args = [
      "--newline",
      "--no-playlist",
      "-P",
      DOWNLOAD_DIR,
      "-o",
      "%(title).120s-%(id)s.%(ext)s",
      "--print",
      "after_move:filepath",
    ];

    if (format) {
      args.push("-f", format);
    }

    args.push(url);

    const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });

    let finalPath = null;
    let stderr = "";

    const inspectChunk = (chunk) => {
      const text = chunk.toString();
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

      for (const line of lines) {
        const progressUpdate = parseProgressLine(line);
        if (progressUpdate) {
          onProgress?.(progressUpdate);
        }

        if (line.startsWith("/") || line.startsWith("./") || line.startsWith(DOWNLOAD_DIR)) {
          finalPath = line;
        }
      }
    };

    child.stdout.on("data", inspectChunk);
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      inspectChunk(chunk);
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to run yt-dlp: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || "Download failed"));
        return;
      }

      resolve({ filePath: finalPath });
    });
  });
}
