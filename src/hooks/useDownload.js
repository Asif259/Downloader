"use client";

import { useEffect, useRef, useState } from "react";

export function useDownloadPolling(active = true, onStatusChange, wakeSignal = 0) {
  const [tasks, setTasks] = useState([]);
  const prevStatusRef = useRef({});

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let timeoutId;
    let cancelled = false;

    const poll = async () => {
      let shouldContinue = false;

      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        const payload = await response.json();
        if (!cancelled) {
          const incoming = payload.tasks || [];
          setTasks(incoming);

          const prev = prevStatusRef.current;
          for (const task of incoming) {
            const wasTerminal = prev[task.id] === "completed" || prev[task.id] === "failed";
            const isTerminal = task.status === "completed" || task.status === "failed";
            if (isTerminal && !wasTerminal) {
              onStatusChange?.();
            }
          }

          const next = {};
          for (const task of incoming) next[task.id] = task.status;
          prevStatusRef.current = next;

          shouldContinue = incoming.some((task) => ["pending", "downloading"].includes(task.status));
        }
      } catch {
        if (!cancelled) {
          setTasks([]);
          shouldContinue = true;
        }
      }

      if (!cancelled && shouldContinue) {
        timeoutId = window.setTimeout(poll, 600);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [active, onStatusChange, wakeSignal]);

  return tasks;
}
