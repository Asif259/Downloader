const TASKS_KEY = "__unidl_tasks_store__";
const CANCELERS_KEY = "__unidl_task_cancelers__";

function getTaskStore() {
  const globalScope = globalThis;
  if (!globalScope[TASKS_KEY]) {
    globalScope[TASKS_KEY] = new Map();
  }
  return globalScope[TASKS_KEY];
}

function getCancelerStore() {
  const globalScope = globalThis;
  if (!globalScope[CANCELERS_KEY]) {
    globalScope[CANCELERS_KEY] = new Map();
  }
  return globalScope[CANCELERS_KEY];
}

export async function createTask({ url, format, sessionId = null }) {
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
    sessionId,
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

export function setTaskCanceler(taskId, cancelFn) {
  const cancelers = getCancelerStore();
  cancelers.set(taskId, cancelFn);
}

export function clearTaskCanceler(taskId) {
  const cancelers = getCancelerStore();
  cancelers.delete(taskId);
}

export async function cancelTasksBySession(sessionId, reason = "Download canceled due to session reload.") {
  if (!sessionId) {
    return 0;
  }

  const tasks = getTaskStore();
  const cancelers = getCancelerStore();
  const candidates = Array.from(tasks.values()).filter(
    (task) => task.sessionId === sessionId && ["pending", "downloading"].includes(task.status),
  );

  for (const task of candidates) {
    const cancel = cancelers.get(task.id);
    if (cancel) {
      try {
        cancel();
      } catch {}
    }
    await updateTask(task.id, { status: "failed", error: reason });
    cancelers.delete(task.id);
  }

  return candidates.length;
}

export async function cancelTaskById(taskId, reason = "Download canceled by user.") {
  if (!taskId) {
    return false;
  }

  const task = await getTask(taskId);
  if (!task || !["pending", "downloading"].includes(task.status)) {
    return false;
  }

  const cancelers = getCancelerStore();
  const cancel = cancelers.get(taskId);
  if (cancel) {
    try {
      cancel();
    } catch {}
  }

  await updateTask(taskId, { status: "failed", error: reason });
  cancelers.delete(taskId);
  return true;
}
