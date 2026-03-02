import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_FILE = path.join(process.cwd(), "downloads", "tasks.json");
let writeQueue = Promise.resolve();

async function ensureStore() {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    await writeFile(STORE_FILE, "[]", "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(STORE_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function queueWrite(mutator) {
  writeQueue = writeQueue.then(async () => {
    const items = await readStore();
    const nextItems = await mutator(items);
    await writeFile(STORE_FILE, JSON.stringify(nextItems, null, 2), "utf8");
  });

  return writeQueue;
}

export async function createTask({ url, format }) {
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    format: format || "best",
    status: "pending",
    progress: 0,
    speed: null,
    eta: null,
    filePath: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await queueWrite(async (items) => [task, ...items]);
  return task;
}

export async function updateTask(taskId, patch) {
  let updated = null;

  await queueWrite(async (items) => {
    const next = items.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      updated = {
        ...task,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      return updated;
    });

    return next;
  });

  return updated;
}

export async function getTask(taskId) {
  const items = await readStore();
  return items.find((task) => task.id === taskId) || null;
}

export async function listTasks() {
  const items = await readStore();
  return items.sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
