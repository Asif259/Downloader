"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DownloadQueue from "@/components/DownloadQueue";
import HistoryTable from "@/components/HistoryTable";
import LinkInput from "@/components/LinkInput";
import PreviewCard from "@/components/PreviewCard";
import QualitySelector from "@/components/QualitySelector";
import ToastContainer, { toast } from "@/components/Toast";
import { useDownloadPolling } from "@/hooks/useDownload";
import { useHistory } from "@/hooks/useHistory";
import { apiUrl } from "@/lib/apiClient";
import { normalizeUrl } from "@/lib/detector";

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return payload;
}

function extractHeight(resolution) {
  if (!resolution || typeof resolution !== "string") {
    return 0;
  }

  const pxMatch = resolution.match(/(\d{3,4})p/i);
  if (pxMatch?.[1]) {
    return Number(pxMatch[1]);
  }

  const dimensionMatch = resolution.match(/x(\d{3,4})/i);
  if (dimensionMatch?.[1]) {
    return Number(dimensionMatch[1]);
  }

  return 0;
}

function pickBasicFormats(allFormats) {
  if (!Array.isArray(allFormats) || allFormats.length === 0) {
    return [];
  }

  const video = allFormats
    .filter((format) => format?.formatId && format.vcodec !== "none" && format.acodec !== "none")
    .map((format) => ({ ...format, height: extractHeight(format.resolution) }))
    .sort((a, b) => {
      const extScore = (ext) => (ext === "mp4" ? 2 : ext === "webm" ? 1 : 0);
      if (b.height !== a.height) return b.height - a.height;
      return extScore(b.ext) - extScore(a.ext);
    });

  const targetHeights = [1080, 720, 480, 360];
  const pickedVideo = [];
  const seenVideo = new Set();

  for (const target of targetHeights) {
    const match = video.find((format) => !seenVideo.has(format.formatId) && format.height === target);
    if (match) {
      seenVideo.add(match.formatId);
      pickedVideo.push(match);
    }
  }

  if (pickedVideo.length === 0) {
    for (const format of video) {
      if (pickedVideo.length >= 4) break;
      if (seenVideo.has(format.formatId)) continue;
      seenVideo.add(format.formatId);
      pickedVideo.push(format);
    }
  }

  const audio = allFormats
    .filter((format) => format?.formatId && format.vcodec === "none" && format.acodec && format.acodec !== "none")
    .sort((a, b) => {
      const extScore = (ext) => (ext === "m4a" ? 2 : ext === "mp3" ? 1 : 0);
      return extScore(b.ext) - extScore(a.ext);
    });

  const pickedAudio = [];
  const seenAudioExt = new Set();

  for (const format of audio) {
    if (pickedAudio.length >= 2) break;
    const key = `${format.ext}:${format.resolution || ""}`;
    if (seenAudioExt.has(key)) continue;
    seenAudioExt.add(key);
    pickedAudio.push(format);
  }

  return [...pickedVideo, ...pickedAudio];
}

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("best");
  const [pollWakeSignal, setPollWakeSignal] = useState(0);
  const autoDownloadEligibleRef = useRef(new Set());
  const triggeredRef = useRef(new Set());
  const inFlightDownloadsRef = useRef(new Set());
  const analyzeRequestRef = useRef(0);
  const sessionIdRef = useRef("");

  const { items, loading, error: historyError, refresh, clearAll, upsertHistoryItem, syncFromTasks } = useHistory();

  const handleUrlChange = useCallback((value) => {
    setUrlInput(value);
    setPreview(null);
    setPreviewLoading(false);
    setFormats([]);
    setSelectedFormat("best");
  }, []);

  const handleStatusChange = useCallback(() => {
    refresh();
  }, [refresh]);

  const tasks = useDownloadPolling(true, handleStatusChange, pollWakeSignal);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = "downlink.active_session_id";
    const previousSessionId = window.sessionStorage.getItem(key);
    const nextSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionIdRef.current = nextSessionId;
    window.sessionStorage.setItem(key, nextSessionId);

    if (previousSessionId && previousSessionId !== nextSessionId) {
      void fetch(apiUrl("/api/download/cancel-session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: previousSessionId }),
      });
    }
  }, []);

  const extractFilename = useCallback((contentDisposition, fallbackName) => {
    if (!contentDisposition) {
      return fallbackName;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1]);
      } catch {
        return fallbackName;
      }
    }

    const basicMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
    return basicMatch?.[1] || fallbackName;
  }, []);

  const downloadTaskFile = useCallback(
    async (taskId) => {
      const response = await fetch(apiUrl(`/api/file/${taskId}`), { cache: "no-store" });

      if (!response.ok) {
        let message = `Download failed (${response.status}).`;
        try {
          const payload = await response.json();
          if (payload?.error) {
            message = payload.error;
          }
        } catch { }
        throw new Error(message);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = extractFilename(contentDisposition, `${taskId}.bin`);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    },
    [extractFilename],
  );

  useEffect(() => {
    for (const task of tasks) {
      const shouldDownload =
        autoDownloadEligibleRef.current.has(task.id) &&
        task.status === "completed" &&
        !triggeredRef.current.has(task.id) &&
        !inFlightDownloadsRef.current.has(task.id);

      if (shouldDownload) {
        inFlightDownloadsRef.current.add(task.id);
        void downloadTaskFile(task.id)
          .then(() => {
            triggeredRef.current.add(task.id);
            toast({
              type: "success",
              title: "Download Complete",
              message: "File has been saved to your downloads folder.",
            });
          })
          .catch((err) => {
            toast({
              type: "error",
              title: "Download Failed",
              message: err.message || "Failed to download file.",
            });
          })
          .finally(() => {
            inFlightDownloadsRef.current.delete(task.id);
          });
      }
    }
  }, [tasks, downloadTaskFile]);

  useEffect(() => {
    syncFromTasks(tasks);
  }, [tasks, syncFromTasks]);

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => ["pending", "downloading"].includes(task.status));
  }, [tasks]);

  const analyzeUrl = useCallback(async (rawUrl) => {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) {
      return;
    }

    const reqId = Date.now() + Math.random();
    analyzeRequestRef.current = reqId;
    setBusy(true);
    setPreviewLoading(true);

    try {
      const [previewPayload, formatsPayload] = await Promise.all([
        postJSON(apiUrl("/api/detect"), { url: normalized }),
        postJSON(apiUrl("/api/formats"), { url: normalized }),
      ]);

      if (analyzeRequestRef.current !== reqId) {
        return;
      }

      const basicFormats = pickBasicFormats(formatsPayload.formats || []);
      setPreview(previewPayload);
      setFormats(basicFormats);
      setSelectedFormat("best");
      toast({
        type: "success",
        title: "Preview Loaded",
        message: `Found ${basicFormats.length} format options for download.`,
      });
    } catch (err) {
      if (analyzeRequestRef.current === reqId) {
        toast({
          type: "error",
          title: "Failed to Load Preview",
          message: err.message,
        });
      }
    } finally {
      if (analyzeRequestRef.current === reqId) {
        setBusy(false);
        setPreviewLoading(false);
      }
    }
  }, []);

  const handleCheckUrl = useCallback(() => {
    const normalized = normalizeUrl(urlInput);
    if (!normalized) {
      analyzeRequestRef.current = 0;
      setBusy(false);
      setPreviewLoading(false);
      toast({
        type: "warning",
        title: "Invalid URL",
        message: "Please enter a valid URL to check.",
      });
      return;
    }

    void analyzeUrl(normalized);
  }, [analyzeUrl, urlInput]);

  const startSingleDownload = useCallback(async () => {
    setBusy(true);

    try {
      const payload = await postJSON(apiUrl("/api/download"), {
        url: urlInput,
        format: selectedFormat,
        title: preview?.title,
        thumbnail: preview?.thumbnail,
        quality: selectedFormat,
        sessionId: sessionIdRef.current || null,
      });
      setPollWakeSignal((value) => value + 1);
      if (payload?.taskId) {
        autoDownloadEligibleRef.current.add(payload.taskId);
        upsertHistoryItem({
          id: `hist_${payload.taskId}`,
          taskId: payload.taskId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: normalizeUrl(urlInput),
          platform: payload.platform || preview?.platform || "unknown",
          title: preview?.title || null,
          thumbnail: preview?.thumbnail || null,
          format: selectedFormat,
          quality: selectedFormat,
          status: "pending",
          filePath: null,
          error: null,
        });
      }
      toast({
        type: "success",
        title: "Download Started",
        message: "Your download has been added to the queue.",
      });
      refresh();
    } catch (err) {
      toast({
        type: "error",
        title: "Download Failed",
        message: err.message,
      });
    } finally {
      setBusy(false);
    }
  }, [preview, refresh, selectedFormat, upsertHistoryItem, urlInput]);

  const cancelDownload = useCallback(async (taskId) => {
    if (!taskId) {
      return;
    }

    try {
      await postJSON(apiUrl("/api/download/cancel"), { taskId });
      autoDownloadEligibleRef.current.delete(taskId);
      inFlightDownloadsRef.current.delete(taskId);
      setPollWakeSignal((value) => value + 1);
      toast({
        type: "success",
        title: "Download Canceled",
        message: "The download has been canceled.",
      });
      refresh();
    } catch (err) {
      toast({
        type: "error",
        title: "Cancel Failed",
        message: err.message || "Failed to cancel download.",
      });
    }
  }, [refresh]);

  return (
    <main className="page-shell">
      <div className="page-grid">
        <header className="header-block">
          <h1>
            <span className="brand">DownLink</span>
          </h1>
          <p className="header-subtitle">
            Universal downloader for YouTube, TikTok, Instagram, X, and more
          </p>
          <div className="header-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Saves to <code>~/Downloads/DownLink</code>
          </div>
        </header>

        <LinkInput
          value={urlInput}
          onChange={handleUrlChange}
          onCheck={handleCheckUrl}
          busy={busy}
        />

        <div className="two-col">
          <PreviewCard media={preview} loading={previewLoading} />
          <QualitySelector
            formats={formats}
            value={selectedFormat}
            onChange={setSelectedFormat}
            onDownload={startSingleDownload}
            busy={busy}
            disabled={!urlInput.trim()}
          />
        </div>

        <DownloadQueue tasks={activeTasks} onCancel={cancelDownload} />

        <HistoryTable
          items={items}
          loading={loading}
          error={historyError}
          onRefresh={refresh}
          onClear={clearAll}
        />
      </div>

      <ToastContainer />
    </main>
  );
}
