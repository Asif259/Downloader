"use client";

import { useCallback, useEffect, useState } from "react";

const HISTORY_KEY = "downlink.history.v1";

function readHistoryFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistoryToStorage(items) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // ignore storage write failures
  }
}

export function useHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setItems(readHistoryFromStorage());
    setLoading(false);
  }, []);

  const clearAll = useCallback(async () => {
    writeHistoryToStorage([]);
    setItems([]);
  }, []);

  const upsertHistoryItem = useCallback((entry) => {
    if (!entry?.id) {
      return;
    }

    setItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex((item) => item.id === entry.id);
      if (idx === -1) {
        next.unshift(entry);
      } else {
        next[idx] = { ...next[idx], ...entry };
      }
      writeHistoryToStorage(next);
      return next;
    });
  }, []);

  const syncFromTasks = useCallback((tasks) => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return;
    }

    setItems((prev) => {
      let changed = false;
      const byTaskId = new Map(tasks.map((task) => [task.id, task]));
      const next = prev.map((item) => {
        if (!item.taskId) {
          return item;
        }

        const task = byTaskId.get(item.taskId);
        if (!task) {
          return item;
        }

        const merged = {
          ...item,
          status: task.status,
          filePath: task.filePath || item.filePath || null,
          error: task.error || null,
          updatedAt: task.updatedAt || new Date().toISOString(),
        };

        if (
          merged.status !== item.status ||
          merged.filePath !== item.filePath ||
          merged.error !== item.error ||
          merged.updatedAt !== item.updatedAt
        ) {
          changed = true;
        }

        return merged;
      });

      if (changed) {
        writeHistoryToStorage(next);
        return next;
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readHistoryFromStorage());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return {
    items,
    loading,
    error,
    refresh,
    clearAll,
    upsertHistoryItem,
    syncFromTasks,
  };
}
