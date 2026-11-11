"use client";

import { useMemo, useState } from "react";

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(bytes) || bytes <= 0) {
    return null;
  }
  const units = ["B", "KB", "MB", "GB"];
  let val = Number(bytes);
  let unitIndex = 0;
  while (val >= 1024 && unitIndex < units.length - 1) {
    val /= 1024;
    unitIndex += 1;
  }
  return `${val.toFixed(1)} ${units[unitIndex]}`;
}

export default function QualitySelector({
  formats = [],
  allFormats = [],
  value = "best",
  onChange,
  onDownload,
  busy = false,
  disabled = false,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Combine available formats list
  const streamList = useMemo(() => {
    if (allFormats && allFormats.length > 0) {
      return allFormats;
    }
    return formats;
  }, [allFormats, formats]);

  // Extract quick pill options
  const quickPills = useMemo(() => {
    const pills = [
      { id: "best", label: "★ Best Auto", badge: "Smart Mux" },
    ];

    if (!formats || formats.length === 0) {
      return pills;
    }

    // Add video options
    const videoFormats = formats.filter(
      (f) => f && f.vcodec !== "none" && f.formatId && f.formatId !== "best"
    );

    for (const f of videoFormats.slice(0, 4)) {
      let label = f.resolution;
      if (label && label.includes("x")) {
        label = `${label.split("x")[1]}p`;
      }
      pills.push({
        id: f.formatId,
        label: label || `${f.ext?.toUpperCase()}`,
        badge: f.ext?.toUpperCase(),
      });
    }

    // Add audio option if available
    const audioFormat = formats.find((f) => f && f.vcodec === "none" && f.acodec && f.acodec !== "none");
    if (audioFormat) {
      pills.push({
        id: audioFormat.formatId,
        label: "Audio Only",
        badge: audioFormat.ext?.toUpperCase() || "MP3",
      });
    }

    return pills;
  }, [formats]);

  return (
    <section className="glass-panel section" aria-label="Quality and format selector">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <span>Quality & Format</span>
      </div>

      <div className="quality-container">
        <div>
          <label className="label">
            Quick Quality Selection
          </label>
          <div className="quality-pill-grid" role="radiogroup" aria-label="Quick format options">
            {quickPills.map((pill) => {
              const isActive = value === pill.id;
              return (
                <button
                  key={`pill-${pill.id}`}
                  type="button"
                  className={`quality-pill-btn ${isActive ? "active" : ""}`}
                  onClick={() => onChange(pill.id)}
                  disabled={disabled || busy}
                  role="radio"
                  aria-checked={isActive}
                >
                  <span>{pill.label}</span>
                  {pill.badge && (
                    <span className="quality-pill-badge">{pill.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button
            type="button"
            className="collapsible-trigger"
            onClick={() => setShowAdvanced((prev) => !prev)}
            disabled={disabled || busy || streamList.length === 0}
            aria-expanded={showAdvanced}
          >
            <span>
              {showAdvanced ? "▾ Hide Advanced Stream Formats" : "▸ Advanced Stream Selection"}
              {streamList.length > 0 && ` (${streamList.length} streams)`}
            </span>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
              {showAdvanced ? "Collapse" : "Expand"}
            </span>
          </button>

          {showAdvanced && (
            <div className="collapsible-content">
              <label htmlFor="detailed-format" className="label" style={{ fontSize: "0.78rem" }}>
                Select Specific Stream Track:
              </label>
              <select
                id="detailed-format"
                className="format-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || busy}
              >
                <option value="best">★ Best Available (Auto Video + Audio Merge)</option>
                {streamList.map((f, idx) => {
                  const size = formatBytes(f.filesize);
                  const isAudio = f.vcodec === "none";
                  const resText = isAudio ? "Audio Track" : f.resolution || "Video";
                  const sizeText = size ? ` • ${size}` : "";
                  return (
                    <option key={`${f.formatId}-${idx}`} value={f.formatId}>
                      {resText} ({f.ext?.toUpperCase()}) [ID: {f.formatId}]{sizeText}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onDownload}
          disabled={disabled || busy}
          style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }}
        >
          {busy ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Start Download</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
