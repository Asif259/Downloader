"use client";

import { useEffect, useState } from "react";

export function useDownloadPolling(active = true) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let timeoutId;
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        const payload = await response.json();
        if (!cancelled) {
          setTasks(payload.tasks || []);
        }
      } catch {
        if (!cancelled) {
          setTasks([]);
        }
      }

      timeoutId = window.setTimeout(poll, 1200);
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [active]);

  return tasks;
}
