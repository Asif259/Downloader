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
const standalonePath = path.resolve(__dirname, "apps/backend/.next/standalone/apps/backend/server.js");

if (!fs.existsSync(standalonePath)) {
  console.error("❌ Standalone backend not found at:", standalonePath);
  console.error("👉 Please ensure 'npm run build:backend' has been executed.");
  process.exit(1);
}

const port = process.env.PORT || "3000";
console.log(`🚀 Starting DownLink Backend on port ${port}...`);

const child = spawn(process.execPath, [standalonePath], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
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

