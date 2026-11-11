#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "apps", "backend");
const DIST_DIR = path.join(ROOT_DIR, "dist-hostinger-backend");
const STANDALONE_DIR = path.join(BACKEND_DIR, ".next", "standalone");
const STANDALONE_APP_DIR = path.join(STANDALONE_DIR, "apps", "backend");

console.log("============================================================");
console.log("       📦 PACKAGING DOWNLINK BACKEND FOR HOSTINGER          ");
console.log("============================================================");

// 1. Build the Next.js standalone bundle
console.log("\n🛠️ Building Next.js backend standalone bundle...");
execSync("npm run build:backend", {
  cwd: ROOT_DIR,
  stdio: "inherit",
});

// 2. Prepare clean output folder
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// 3. Copy server.js
const serverJsPath = path.join(STANDALONE_APP_DIR, "server.js");
if (fs.existsSync(serverJsPath)) {
  fs.copyFileSync(serverJsPath, path.join(DIST_DIR, "server.js"));
  console.log("  ✓ Copied server.js -> dist-hostinger-backend/server.js");
}

// 4. Copy node_modules from standalone root
const standaloneNodeModules = path.join(STANDALONE_DIR, "node_modules");
if (fs.existsSync(standaloneNodeModules)) {
  fs.cpSync(standaloneNodeModules, path.join(DIST_DIR, "node_modules"), { recursive: true });
  console.log("  ✓ Copied bundled node_modules -> dist-hostinger-backend/node_modules");
}

// 5. Copy .next
const standaloneNext = path.join(STANDALONE_APP_DIR, ".next");
if (fs.existsSync(standaloneNext)) {
  fs.cpSync(standaloneNext, path.join(DIST_DIR, ".next"), { recursive: true });
  console.log("  ✓ Copied standalone .next/ -> dist-hostinger-backend/.next/");
}

// 6. Ensure standalone Linux yt-dlp binary is included for Hostinger
const distBinDir = path.join(DIST_DIR, "bin");
fs.mkdirSync(distBinDir, { recursive: true });
const targetYtDlp = path.join(distBinDir, "yt-dlp");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        fs.chmodSync(dest, 0o755);
        resolve();
      });
      stream.on("error", reject);
    }).on("error", reject);
  });
}

console.log("\n📦 Bundling standalone Linux yt-dlp binary for Hostinger...");
const LINUX_YTDLP_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

try {
  await downloadFile(LINUX_YTDLP_URL, targetYtDlp);
  console.log("  ✓ Downloaded and bundled standalone Linux yt-dlp into bin/yt-dlp (chmod 755)");
} catch (e) {
  console.warn("  ⚠️ Could not download Linux yt-dlp binary automatically:", e.message);
}

// 7. Create package.json & environment
const hostingerPkg = {
  name: "downlink-backend",
  version: "1.0.0",
  type: "module",
  private: true,
  scripts: { start: "node server.js" },
  dependencies: { next: "16.1.6", react: "19.2.3", "react-dom": "19.2.3" },
};
fs.writeFileSync(path.join(DIST_DIR, "package.json"), JSON.stringify(hostingerPkg, null, 2));

const envContent = `NODE_ENV=production
PORT=10000
DOWNLOAD_DIR=/tmp/unidl
CORS_ALLOW_ORIGIN=*
`;
fs.writeFileSync(path.join(DIST_DIR, ".env.production"), envContent);

const htaccessContent = `# Hostinger Web Hosting .htaccess for Node.js Application
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://127.0.0.1:10000/$1 [P,L]
</IfModule>
`;
fs.writeFileSync(path.join(DIST_DIR, ".htaccess"), htaccessContent);

// 8. Compress into hostinger-backend.zip
try {
  execSync("zip -rq ../hostinger-backend.zip .", { cwd: DIST_DIR });
  const zipPath = path.join(ROOT_DIR, "hostinger-backend.zip");
  const stats = fs.statSync(zipPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 SUCCESS! Generated hostinger-backend.zip (${sizeMb} MB)`);
  console.log(`   Location: ${zipPath}`);
} catch {
  console.log("\nℹ️ dist-hostinger-backend/ folder is ready.");
}

console.log("\n============================================================");
console.log("🚀 Hostinger Backend Package is Ready for Deployment!");
console.log("============================================================");
