import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_FILE = path.join(process.cwd(), "downloads", "history.json");

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

async function writeStore(items) {
  await ensureStore();
  await writeFile(STORE_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function createHistoryRecord(data) {
  const items = await readStore();
  const record = {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...data,
  };

  items.unshift(record);
  await writeStore(items);

  return record;
}

export async function updateHistoryRecord(id, patch) {
  const items = await readStore();
  const next = items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      ...item,
      ...patch,
    };
  });

  await writeStore(next);
}

export async function listHistoryRecords(limit = 100) {
  const items = await readStore();
  return items.slice(0, limit);
}

export async function deleteHistoryRecord(id) {
  const items = await readStore();
  await writeStore(items.filter((item) => item.id !== id));
}

export async function clearHistoryRecords() {
  await writeStore([]);
}
