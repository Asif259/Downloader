"use client";

import { useMemo } from "react";
import { detectPlatform } from "@/lib/detector";

export default function LinkInput({ value, onChange, onCheck, busy }) {
  const detectedPlatform = useMemo(() => {
    if (!value || typeof value !== "string" || !value.trim()) {
      return null;
    }
    const platform = detectPlatform(value.trim());
    return platform !== "unknown" ? platform : null;
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!busy && value.trim()) {
      onCheck();
    }
  };

  const handlePaste = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onChange(text.trim());
      }
    } catch {
      // Permission denied or clipboard empty
    }
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <section className="glass-panel section">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        Paste Link
        {detectedPlatform && (
          <span
            className={`platform-icon ${detectedPlatform}`}
            style={{ marginLeft: "auto", fontSize: "0.75rem", textTransform: "capitalize", padding: "0.2rem 0.6rem", width: "auto" }}
          >
            {detectedPlatform}
          </span>
        )}
      </div>
      <form onSubmit={handleSubmit} className="input-group">
        <input
          id="source-url"
          className="input"
          type="url"
          placeholder="https://youtube.com/watch?v=... or any media URL"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={busy}
          autoComplete="off"
          spellCheck="false"
        />

        {value && !busy && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClear}
            style={{ padding: "0 0.8rem", height: "auto" }}
            title="Clear input"
            aria-label="Clear input"
          >
            ✕
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePaste}
          disabled={busy}
          title="Paste from clipboard"
          aria-label="Paste from clipboard"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Paste
        </button>

        <button type="submit" className="btn btn-primary" disabled={busy || !value.trim()}>
          {busy ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Extract
            </>
          )}
        </button>
      </form>
    </section>
  );
}
