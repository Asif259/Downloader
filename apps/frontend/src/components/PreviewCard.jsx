"use client";

import { useState } from "react";

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) {
    return null;
  }

  const total = Math.floor(Number(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function PreviewCard({ media, loading = false }) {
  const [thumbError, setThumbError] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);

  if (loading) {
    return (
      <section className="glass-panel section" aria-label="Loading media preview">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span>Media Preview</span>
        </div>
        <div className="skeleton-container" role="status" aria-label="Loading preview data">
          <div className="skeleton-thumb" />
          <div className="skeleton-lines">
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      </section>
    );
  }

  if (!media) {
    return (
      <section className="glass-panel section" aria-label="Media preview empty">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span>Media Preview</span>
        </div>
        <div className="empty-state">
          <svg className="empty-state-graphic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p>Paste any supported media link above to inspect formats and stream details.</p>
          <span className="empty-state-hint">Supports video, audio, reels, shorts & clips</span>
        </div>
      </section>
    );
  }

  const duration = formatDuration(media.duration);
  const platform = media.platform?.toLowerCase() || "unknown";

  return (
    <section className="glass-panel section" aria-label="Media preview">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span>Media Preview</span>
        {media.platform && (
          <span className={`platform-pill ${platform}`} style={{ marginLeft: "auto" }}>
            {media.platform}
          </span>
        )}
      </div>

      <div className="preview-card">
        <div className="thumb-frame">
          {media.thumbnail && !thumbError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.thumbnail}
              alt={media.title || "Video preview thumbnail"}
              className={`thumb-image ${thumbLoaded ? "loaded" : ""}`}
              onLoad={() => setThumbLoaded(true)}
              onError={() => setThumbError(true)}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                gap: "0.5rem",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: "0.8rem" }}>Thumbnail unavailable</span>
            </div>
          )}

          <div className="thumb-overlay-gradient" />

          {duration && (
            <span className="thumb-duration-pill" title={`Duration: ${duration}`}>
              {duration}
            </span>
          )}
        </div>

        <div className="preview-info">
          <h3 className="preview-title" title={media.title || "Untitled"}>
            {media.title || "Untitled Media"}
          </h3>

          <div className="preview-meta-row">
            {media.uploader && (
              <span className="meta-chip" title="Channel / Uploader">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{media.uploader}</span>
              </span>
            )}

            {duration && (
              <span className="meta-chip" title="Duration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>{duration}</span>
              </span>
            )}

            {media.extractor && (
              <span className="meta-chip" title="Extraction engine">
                <span style={{ color: "var(--accent-primary)", fontSize: "0.85em" }}>⚡</span>
                <span>{media.extractor}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
