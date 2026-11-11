"use client";

import { useMemo, useRef } from "react";
import { detectPlatform } from "@/lib/detector";

export default function LinkInput({ value, onChange, onCheck, busy }) {
  const inputRef = useRef(null);

  const detectedPlatform = useMemo(() => {
    if (!value || typeof value !== "string" || !value.trim()) {
      return null;
    }
    const platform = detectPlatform(value.trim());
    return platform !== "unknown" ? platform : null;
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!busy && value && value.trim()) {
      onCheck();
    }
  };

  const handlePaste = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      inputRef.current?.focus();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onChange(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      // Browser permission denied or user dismissed clipboard prompt
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && value) {
      handleClear();
    }
  };

  return (
    <section className="glass-panel section" aria-label="Media link extraction">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        <span>Paste Media Link</span>
        {detectedPlatform && (
          <span
            className={`platform-pill ${detectedPlatform}`}
            style={{ marginLeft: "auto" }}
            role="status"
            aria-live="polite"
          >
            <span style={{ fontSize: "0.85em" }}>●</span> {detectedPlatform}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="link-input-wrapper">
          <div className="link-input-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          <input
            ref={inputRef}
            id="source-url"
            className="link-input-field"
            type="url"
            placeholder="Paste YouTube, TikTok, Instagram, X, Facebook, or direct video URL..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            autoComplete="off"
            spellCheck="false"
            aria-label="Media URL input"
          />

          <div className="link-input-actions">
            {value && !busy && (
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={handleClear}
                title="Clear input (Esc)"
                aria-label="Clear input"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePaste}
              disabled={busy}
              title="Paste from clipboard"
              aria-label="Paste URL from clipboard"
              style={{ minHeight: "42px", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Paste</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !value?.trim()}
              style={{ minHeight: "42px", padding: "0.5rem 1.15rem", fontSize: "0.875rem" }}
            >
              {busy ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
                  </svg>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span>Extract</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {!value && (
        <div className="supported-platforms-hint">
          <span style={{ opacity: 0.7 }}>Supported:</span>
          <span className="supported-chip">YouTube</span>
          <span className="supported-chip">TikTok</span>
          <span className="supported-chip">Instagram</span>
          <span className="supported-chip">X / Twitter</span>
          <span className="supported-chip">Facebook</span>
          <span className="supported-chip">Direct MP4/MP3</span>
        </div>
      )}
    </section>
  );
}
