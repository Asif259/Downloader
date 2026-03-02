import { spawn } from "node:child_process";
import { access, mkdir, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(os.homedir(), "Downloads", "UniDL");

function isLikelyMediaFile(line) {
  return /\.(mp4|mkv|webm|mov|m4a|mp3|wav|ogg|flac|jpg|jpeg|png|gif)$/i.test(line);
}

function normalizePathCandidate(line) {
  const stripped = line.replace(/^['"]|['"]$/g, "").trim();
  if (!stripped || stripped.startsWith("[")) {
    return null;
  }

  if (path.isAbsolute(stripped)) {
    return isLikelyMediaFile(stripped) ? stripped : null;
  }

  if (stripped.startsWith("./") || stripped.startsWith("../")) {
    const resolved = path.resolve(process.cwd(), stripped);
    return isLikelyMediaFile(resolved) ? resolved : null;
  }

  if (isLikelyMediaFile(stripped)) {
    return path.join(DOWNLOAD_DIR, stripped);
  }

  return null;
}

async function resolveFinalPath(candidate) {
  if (candidate) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // fall through to directory scan
    }
  }

  const files = await listFilesInDownloadDir();

  return pickNewest(files);
}

async function listFilesInDownloadDir() {
  try {
    const entries = await readdir(DOWNLOAD_DIR, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => path.join(DOWNLOAD_DIR, entry.name));
  } catch {
    return [];
  }
}

async function pickNewest(files) {
  if (files.length === 0) {
    return null;
  }
  const stats = await Promise.all(
    files.map(async (filePath) => {
      const file = await stat(filePath);
      return { filePath, mtime: file.mtimeMs };
    }),
  );

  stats.sort((a, b) => b.mtime - a.mtime);
  return stats[0]?.filePath || null;
}

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
  const cleaned = line.replace(/\x1B\[[0-9;]*m/g, "");
  const progressMatch = cleaned.match(/\[download\]\s+(\d{1,3}(?:\.\d+)?)%/i);
  if (!progressMatch) {
    return null;
  }

  const speedMatch = cleaned.match(/at\s+(.+?)\s+ETA/i) || cleaned.match(/at\s+(.+)$/i);
  const etaMatch = cleaned.match(/ETA\s+([^\s]+)/i);

  return {
    progress: Number(progressMatch[1]),
    speed: speedMatch?.[1]?.trim() || null,
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
  const filesBefore = new Set(await listFilesInDownloadDir());

  return new Promise((resolve, reject) => {
    const args = [
      "--newline",
      "--no-playlist",
      "--no-write-info-json",
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
      const lines = text.split(/\r|\n/).map((line) => line.trim()).filter(Boolean);

      for (const line of lines) {
        const progressUpdate = parseProgressLine(line);
        if (progressUpdate) {
          onProgress?.(progressUpdate);
        }

        const maybePath = normalizePathCandidate(line);
        if (maybePath) {
          finalPath = maybePath;
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

      resolveFinalPath(finalPath)
        .then((verifiedPath) => {
          if (verifiedPath) {
            resolve({ filePath: verifiedPath, downloadDir: DOWNLOAD_DIR });
            return;
          }

          listFilesInDownloadDir()
            .then((afterFiles) => afterFiles.filter((file) => !filesBefore.has(file)))
            .then((newFiles) => pickNewest(newFiles))
            .then((newestNewFile) => {
              if (!newestNewFile) {
                reject(new Error("Download finished but file was not found on disk."));
                return;
              }
              resolve({ filePath: newestNewFile, downloadDir: DOWNLOAD_DIR });
            })
            .catch((error) => {
              reject(new Error(error.message || "Failed to verify downloaded file."));
            });
        })
        .catch((error) => {
          reject(new Error(error.message || "Failed to verify downloaded file."));
        });
    });
  });
}
