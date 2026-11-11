#!/usr/bin/env node

/**
 * Root Server Entry Point for Hostinger Web Apps
 * Spawns the compiled Next.js standalone backend with the environment PORT.
 */

import { spawn } from "node:child_process";
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
console.log(`🚀 Starting DownLink Backend from ${standalonePath} on 0.0.0.0:${port}...`);

const child = spawn(process.execPath, [standalonePath], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "0.0.0.0",
    PORT: port,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

