#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "apps", "frontend");
const DIST_DIR = path.join(ROOT_DIR, "dist-hostinger");
const STANDALONE_DIR = path.join(FRONTEND_DIR, ".next", "standalone");
const STANDALONE_APP_DIR = path.join(STANDALONE_DIR, "apps", "frontend");

console.log("============================================================");
console.log("       📦 PACKAGING DOWNLINK FRONTEND FOR HOSTINGER         ");
console.log("============================================================");

// 1. Parse optional backend API URL
const apiUrlArg = process.argv.slice(2).find((arg) => arg.startsWith("--api-url="));
const apiUrl = apiUrlArg ? apiUrlArg.split("=")[1] : process.env.NEXT_PUBLIC_API_BASE_URL || "";

if (apiUrl) {
  console.log(`\n🔗 Inlining Backend API URL: ${apiUrl}`);
} else {
  console.log("\n⚠️ No --api-url provided. Building with relative / default API base.");
  console.log("   (You can pass --api-url=http://<VPS_IP>:10000 when packaging)");
}

// 2. Build the Next.js frontend with standalone output
console.log("\n🛠️ Building Next.js standalone bundle...");
const buildEnv = {
  ...process.env,
  NEXT_PUBLIC_API_BASE_URL: apiUrl,
  NODE_ENV: "production",
};

execSync("npm run build --workspace=downlink-frontend", {
  cwd: ROOT_DIR,
  env: buildEnv,
  stdio: "inherit",
});

// 3. Prepare fresh dist-hostinger directory
console.log("\n📁 Assembling Hostinger production bundle in dist-hostinger/...");
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// 4. Copy standalone server and node_modules
if (!fs.existsSync(STANDALONE_DIR)) {
  console.error("❌ Standalone build not found at:", STANDALONE_DIR);
  process.exit(1);
}

// Copy server.js to root
const serverJsPath = path.join(STANDALONE_APP_DIR, "server.js");
if (fs.existsSync(serverJsPath)) {
  fs.copyFileSync(serverJsPath, path.join(DIST_DIR, "server.js"));
  console.log("  ✓ Copied server.js -> dist-hostinger/server.js");
} else {
  console.error("❌ server.js not found in standalone app directory:", STANDALONE_APP_DIR);
  process.exit(1);
}

// Copy node_modules from standalone root
const standaloneNodeModules = path.join(STANDALONE_DIR, "node_modules");
if (fs.existsSync(standaloneNodeModules)) {
  fs.cpSync(standaloneNodeModules, path.join(DIST_DIR, "node_modules"), { recursive: true });
  console.log("  ✓ Copied bundled node_modules -> dist-hostinger/node_modules");
}

// Copy .next from standalone app
const standaloneNext = path.join(STANDALONE_APP_DIR, ".next");
if (fs.existsSync(standaloneNext)) {
  fs.cpSync(standaloneNext, path.join(DIST_DIR, ".next"), { recursive: true });
  console.log("  ✓ Copied standalone .next/ -> dist-hostinger/.next/");
}

// Copy static assets (.next/static must be merged into .next/static)
const staticSource = path.join(FRONTEND_DIR, ".next", "static");
const staticDest = path.join(DIST_DIR, ".next", "static");
if (fs.existsSync(staticSource)) {
  fs.cpSync(staticSource, staticDest, { recursive: true });
  console.log("  ✓ Merged static assets -> dist-hostinger/.next/static");
}

// Copy public directory
const publicSource = path.join(FRONTEND_DIR, "public");
const publicDest = path.join(DIST_DIR, "public");
if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, publicDest, { recursive: true });
  console.log("  ✓ Copied public/ -> dist-hostinger/public");
}

// Create minimal package.json for Hostinger hPanel Node.js manager
const hostingerPackageJson = {
  name: "downlink-frontend",
  version: "1.0.0",
  private: true,
  scripts: {
    start: "node server.js",
  },
  dependencies: {
    next: "16.1.6",
    react: "19.2.3",
    "react-dom": "19.2.3",
  },
};
fs.writeFileSync(path.join(DIST_DIR, "package.json"), JSON.stringify(hostingerPackageJson, null, 2));
console.log("  ✓ Created minimal package.json -> dist-hostinger/package.json");

// Create .htaccess for Hostinger Apache/LiteSpeed web servers
const htaccessContent = `# Hostinger Web Hosting .htaccess for Next.js Node.js Application
# If your plan uses CloudLinux/Passenger, Passenger will detect server.js automatically.
# If your plan proxies to an internal port, configure port below (e.g. 3000):

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>
`;
fs.writeFileSync(path.join(DIST_DIR, ".htaccess"), htaccessContent);
console.log("  ✓ Created .htaccess -> dist-hostinger/.htaccess");

// Create .env.production file
const envContent = `NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
${apiUrl ? `NEXT_PUBLIC_API_BASE_URL=${apiUrl}\n` : ""}`;
fs.writeFileSync(path.join(DIST_DIR, ".env.production"), envContent);
console.log("  ✓ Created .env.production -> dist-hostinger/.env.production");

// 5. Create zip archive
console.log("\n📦 Compressing production bundle into hostinger-frontend.zip...");
try {
  execSync("zip -rq ../hostinger-frontend.zip .", { cwd: DIST_DIR });
  const zipPath = path.join(ROOT_DIR, "hostinger-frontend.zip");
  const stats = fs.statSync(zipPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 SUCCESS! Generated hostinger-frontend.zip (${sizeMb} MB)`);
  console.log(`   Location: ${zipPath}`);
} catch {
  console.log("\nℹ️ zip command not available, dist-hostinger/ folder is ready for upload.");
}

console.log("\n============================================================");
console.log("🚀 Hostinger Frontend Package is Ready for Deployment!");
console.log("============================================================");
