const TASKS_KEY = "__unidl_tasks_store__";

function getTaskStore() {
  const globalScope = globalThis;
  if (!globalScope[TASKS_KEY]) {
    globalScope[TASKS_KEY] = new Map();
  }
  return globalScope[TASKS_KEY];
}

export async function createTask({ url, format }) {
  const tasks = getTaskStore();
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

  tasks.set(task.id, task);
  return task;
}

export async function updateTask(taskId, patch) {
  const tasks = getTaskStore();
  const existing = tasks.get(taskId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  tasks.set(taskId, updated);
  return updated;
}

export async function getTask(taskId) {
  const tasks = getTaskStore();
  return tasks.get(taskId) || null;
}

export async function listTasks() {
  const tasks = getTaskStore();
  const items = Array.from(tasks.values());
  return items.sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
