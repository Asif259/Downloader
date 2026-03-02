const taskStore = globalThis.__downloadTaskStore || new Map();
const listenerStore = globalThis.__downloadTaskListeners || new Map();

if (!globalThis.__downloadTaskStore) {
  globalThis.__downloadTaskStore = taskStore;
}

if (!globalThis.__downloadTaskListeners) {
  globalThis.__downloadTaskListeners = listenerStore;
}

function emit(taskId) {
  const listeners = listenerStore.get(taskId) || [];
  const task = taskStore.get(taskId);
  for (const listener of listeners) {
    listener(task);
  }
}

export function createTask({ url, format }) {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const task = {
    id: taskId,
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

  taskStore.set(taskId, task);
  emit(taskId);

  return task;
}

export function updateTask(taskId, patch) {
  const task = taskStore.get(taskId);
  if (!task) {
    return null;
  }

  const updated = {
    ...task,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  taskStore.set(taskId, updated);
  emit(taskId);

  return updated;
}

export function getTask(taskId) {
  return taskStore.get(taskId) || null;
}

export function listTasks() {
  return [...taskStore.values()].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function subscribeTask(taskId, callback) {
  const current = listenerStore.get(taskId) || [];
  current.push(callback);
  listenerStore.set(taskId, current);

  return () => {
    const active = listenerStore.get(taskId) || [];
    const filtered = active.filter((listener) => listener !== callback);
    listenerStore.set(taskId, filtered);
  };
}
