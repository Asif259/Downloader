#!/usr/bin/env node

/**
 * Root Server Entry Point for Hostinger Web Apps
 * Directly boots the compiled Next.js standalone server in the current process
 * so that Hostinger's listen() watchdog detects server.listen() immediately.
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const candidatePaths = [
  path.resolve(__dirname, "apps/backend/.next/standalone/apps/backend/server.js"),
  path.resolve(__dirname, "apps/backend/.next/standalone/server.js"),
  path.resolve(__dirname, ".next/standalone/apps/backend/server.js"),
  path.resolve(__dirname, ".next/standalone/server.js"),
];

const standalonePath = candidatePaths.find((p) => fs.existsSync(p));

if (!standalonePath) {
  console.error("❌ Standalone backend not found. Searched candidate paths:");
  candidatePaths.forEach((p) => console.error(" - ", p));
  console.error("👉 Please ensure 'npm run build' has been executed.");
  process.exit(1);
}

const port = process.env.PORT || "3000";
console.log(`🚀 Booting DownLink Standalone Backend on 0.0.0.0:${port}...`);

process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = String(port);

// Change directory to standalone folder so relative paths and node_modules resolve
process.chdir(path.dirname(standalonePath));

// Directly import in the current process (no child process spawn) so Hostinger detects listen()
// Note: Do NOT use top-level await here because LiteSpeed (lsnode.js) loads this file via require()!
import("file://" + standalonePath).catch((err) => {
  console.error("❌ Failed to boot DownLink Standalone Backend:", err);
  process.exit(1);
});
