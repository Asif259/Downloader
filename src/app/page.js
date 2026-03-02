"use client";

import { useMemo, useState } from "react";
import BatchPanel from "@/components/BatchPanel";
import DownloadQueue from "@/components/DownloadQueue";
import HistoryTable from "@/components/HistoryTable";
import LinkInput from "@/components/LinkInput";
import PreviewCard from "@/components/PreviewCard";
import QualitySelector from "@/components/QualitySelector";
import { useDownloadPolling } from "@/hooks/useDownload";
import { useHistory } from "@/hooks/useHistory";
import { splitUrls } from "@/lib/detector";

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

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("best");

  const tasks = useDownloadPolling(true);
  const { items, loading, error: historyError, refresh, clearAll } = useHistory();

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => ["pending", "downloading"].includes(task.status));
  }, [tasks]);

  const detect = async () => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = await postJSON("/api/detect", { url: urlInput });
      setPreview(payload);
      setMessage(`Detected ${payload.platform} content.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const loadFormats = async () => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = await postJSON("/api/formats", { url: urlInput });
      setFormats(payload.formats || []);
      setSelectedFormat("best");
      setMessage(`Loaded ${payload.formats?.length || 0} format options.`);

      if (!preview) {
        await detect();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startSingleDownload = async () => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await postJSON("/api/download", {
        url: urlInput,
        format: selectedFormat,
        title: preview?.title,
        thumbnail: preview?.thumbnail,
        quality: selectedFormat,
      });
      setMessage("Download started.");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startBatchDownload = async () => {
    const urls = splitUrls(batchInput);
    if (urls.length === 0) {
      setError("Add at least one valid URL in batch mode.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await Promise.all(
        urls.map((url) =>
          postJSON("/api/download", {
            url,
            format: "best",
            quality: "best",
          }),
        ),
      );
      setMessage(`Queued ${urls.length} downloads.`);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="page-grid">
        <header className="header-block">
          <h1>
            <span className="text-gradient">UniDL</span> Universal Link Downloader
          </h1>
          <p>
            Option A implementation: Next.js full-stack app with yt-dlp API routes, format selection, queue tracking,
            and Prisma/SQLite history.
          </p>
        </header>

        <LinkInput
          value={urlInput}
          onChange={setUrlInput}
          onDetect={detect}
          onLoadFormats={loadFormats}
          busy={busy}
        />

        <div className="two-col">
          <PreviewCard media={preview} />
          <QualitySelector
            formats={formats}
            value={selectedFormat}
            onChange={setSelectedFormat}
            onDownload={startSingleDownload}
            busy={busy}
            disabled={!urlInput.trim()}
          />
        </div>

        <BatchPanel value={batchInput} onChange={setBatchInput} onStart={startBatchDownload} busy={busy} />

        <DownloadQueue tasks={activeTasks} />

        <HistoryTable
          items={items}
          loading={loading}
          error={historyError}
          onRefresh={refresh}
          onClear={clearAll}
        />

        {message ? <p className="message">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </main>
  );
}
