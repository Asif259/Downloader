import { spawn } from "node:child_process";
import { access, mkdir, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(os.homedir(), "Downloads", "DownLink");

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
  const markerIndex = cleaned.indexOf("__PROGRESS__\t");
  if (markerIndex >= 0) {
    const payload = cleaned.slice(markerIndex);
    const [, downloadedRaw, totalRaw, estimatedRaw, percentRaw, speedRaw, etaRaw] = payload.split("\t");
    const downloaded = Number(downloadedRaw);
    const total = Number(totalRaw);
    const estimated = Number(estimatedRaw);
    const knownTotal = Number.isFinite(total) && total > 0 ? total : Number.isFinite(estimated) ? estimated : 0;

    let progress = null;
    if (knownTotal > 0 && Number.isFinite(downloaded)) {
      progress = (downloaded / knownTotal) * 100;
    } else {
      const percentMatch = (percentRaw || "").match(/(\d{1,3}(?:\.\d+)?)/);
      if (percentMatch) {
        progress = Number(percentMatch[1]);
      }
    }

    if (progress === null || Number.isNaN(progress)) {
      return null;
    }

    return {
      progress: Math.max(0, Math.min(100, progress)),
      speed: speedRaw && speedRaw !== "NA" ? speedRaw.trim() : null,
      eta: etaRaw && etaRaw !== "NA" ? etaRaw.trim() : null,
    };
  }

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

export async function downloadWithProgress({ url, format, onProgress, signal }) {
  await mkdir(DOWNLOAD_DIR, { recursive: true });
  const filesBefore = new Set(await listFilesInDownloadDir());

  return new Promise((resolve, reject) => {
    const args = [
      "--newline",
      "--progress",
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
    let wasAborted = false;
    let abortTimeout = null;

    let finalPath = null;
    let stderr = "";
    let stdoutBuffer = "";
    let stderrBuffer = "";

    const inspectLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      const progressUpdate = parseProgressLine(trimmed);
      if (progressUpdate) {
        onProgress?.(progressUpdate);
      }

      const maybePath = normalizePathCandidate(trimmed);
      if (maybePath) {
        finalPath = maybePath;
      }
    };

    const consumeBuffered = (buffer) => {
      const normalized = buffer.replace(/\r/g, "\n");
      const lines = normalized.split("\n");
      const remainder = lines.pop() || "";
      for (const line of lines) {
        inspectLine(line);
      }
      return remainder;
    };

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      stdoutBuffer = consumeBuffered(stdoutBuffer);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      stderrBuffer += text;
      stderrBuffer = consumeBuffered(stderrBuffer);
    });

    const abortDownload = () => {
      if (wasAborted) {
        return;
      }

      wasAborted = true;
      child.kill("SIGTERM");
      abortTimeout = setTimeout(() => {
        child.kill("SIGKILL");
      }, 2500);
    };

    if (signal) {
      if (signal.aborted) {
        abortDownload();
      } else {
        signal.addEventListener("abort", abortDownload, { once: true });
      }
    }

    child.on("error", (error) => {
      reject(new Error(`Failed to run yt-dlp: ${error.message}`));
    });

    child.on("close", (code) => {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
      if (signal) {
        signal.removeEventListener("abort", abortDownload);
      }

      if (stdoutBuffer) {
        inspectLine(stdoutBuffer);
      }
      if (stderrBuffer) {
        inspectLine(stderrBuffer);
      }

      if (wasAborted) {
        reject(new Error("Download canceled due to page reload."));
        return;
      }

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
