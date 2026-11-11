#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");
const BIN_DIR = path.join(BACKEND_ROOT, "bin");
const BINARY_NAME = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const TARGET_PATH = path.join(BIN_DIR, BINARY_NAME);

function checkSystemBinary() {
  try {
    const cmd = process.platform === "win32" ? "where yt-dlp" : "which yt-dlp";
    execSync(cmd, { stdio: "ignore" });
    // Verify system binary actually runs and is compatible with current Python version
    execSync("yt-dlp --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getDownloadUrl() {
  if (process.platform === "win32") {
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
  }
  if (process.platform === "darwin") {
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";
  }
  // Linux (Hostinger Web Apps runs on Linux x86_64) - use standalone PyInstaller ELF with bundled Python 3.11+
  return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";
}

function downloadBinary(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirects (GitHub releases redirect to AWS S3)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadBinary(response.headers.location, destination).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download binary: HTTP ${response.statusCode}`));
      }

      const fileStream = fs.createWriteStream(destination);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        if (process.platform !== "win32") {
          fs.chmodSync(destination, 0o755);
        }
        resolve();
      });

      fileStream.on("error", (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
    }).on("error", reject);
  });
}

async function main() {
  // 1. If yt-dlp is already in system PATH, we are good to go
  if (checkSystemBinary()) {
    console.log("✓ yt-dlp is available in system PATH.");
    return;
  }

  const syncToStandalone = () => {
    const standaloneBin = path.join(BACKEND_ROOT, ".next", "standalone", "apps", "backend", "bin");
    try {
      fs.mkdirSync(standaloneBin, { recursive: true });
      fs.copyFileSync(TARGET_PATH, path.join(standaloneBin, BINARY_NAME));
      if (process.platform !== "win32") {
        fs.chmodSync(path.join(standaloneBin, BINARY_NAME), 0o755);
      }
      console.log(`✓ Synced yt-dlp binary with 0755 permissions to: ${standaloneBin}`);
    } catch {}
  };

  // 2. If local standalone binary is already downloaded and executable
  if (fs.existsSync(TARGET_PATH)) {
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(TARGET_PATH, 0o755);
      } catch {}
    }
    syncToStandalone();
    try {
      execSync(`"${TARGET_PATH}" --version`, { stdio: "ignore" });
      console.log(`✓ Local standalone yt-dlp binary is verified at: ${TARGET_PATH}`);
      return;
    } catch {
      console.log("Local binary found but failed verification (e.g. incompatible Python version). Re-downloading...");
      try {
        fs.unlinkSync(TARGET_PATH);
      } catch {}
    }
  }

  // 3. Download standalone self-contained binary
  console.log(`⬇️ System yt-dlp not found. Downloading standalone binary for ${process.platform}...`);
  fs.mkdirSync(BIN_DIR, { recursive: true });

  const url = getDownloadUrl();
  console.log(`   Fetching: ${url}`);

  try {
    await downloadBinary(url, TARGET_PATH);
    console.log(`✓ Successfully installed standalone yt-dlp to: ${TARGET_PATH}`);
    syncToStandalone();
  } catch (err) {
    console.warn(`⚠️ Could not auto-download yt-dlp: ${err.message}`);
    console.warn("   You can place the yt-dlp binary manually into apps/backend/bin/yt-dlp");
  }
}

main().catch((err) => {
  console.warn("ensure-ytdlp warning:", err.message);
});

