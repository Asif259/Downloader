"use client";

import { useState } from "react";

function TableStatus({ status }) {
  const getLabel = () => {
    switch (status) {
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "downloading":
        return "Downloading";
      case "pending":
        return "Pending";
      default:
        return status || "Unknown";
    }
  };

  return (
    <span className={`table-status ${status}`} role="status">
      <span style={{ fontSize: "0.8em" }}>●</span> {getLabel()}
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 45) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HistoryTable({
  items = [],
  loading = false,
  error: historyError = null,
  onRefresh,
  onClear,
  onRedownload,
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    } else {
      setConfirmClear(false);
      onClear?.();
    }
  };

  return (
    <section className="glass-panel section" aria-label="Download history">
      <div className="history-header">
        <div className="section-title" style={{ margin: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Download History</span>
          {items.length > 0 && (
            <span className="section-counter" aria-label={`${items.length} items recorded`}>
              {items.length}
            </span>
          )}
        </div>

        <div className="history-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Refresh local history"
            aria-label="Refresh download history"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            <span>Refresh</span>
          </button>

          {items.length > 0 && (
            <button
              type="button"
              className={`btn ${confirmClear ? "btn-danger" : "btn-ghost"}`}
              onClick={handleClearClick}
              title={confirmClear ? "Click again to permanently clear all history" : "Clear all history"}
              aria-label="Clear download history"
              style={{
                borderColor: confirmClear ? "var(--error-border)" : "var(--border-subtle)",
                transition: "all 0.2s var(--ease-spring)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              <span>{confirmClear ? "Confirm Clear?" : "Clear"}</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1.25rem 0", color: "var(--text-secondary)" }}>
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "0.85rem" }}>Syncing history records...</span>
        </div>
      )}

      {historyError && (
        <p style={{ color: "var(--error)", padding: "0.5rem 0", fontSize: "0.85rem" }}>
          ⚠️ {historyError}
        </p>
      )}

      <div className="history-table-wrapper">
        <table className="history-table" aria-label="Downloaded items history table">
          <colgroup>
            <col style={{ width: "42%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Media Title</th>
              <th scope="col">Platform</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                  <div className="empty-state" style={{ padding: 0 }}>
                    <svg className="empty-state-graphic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <p>No downloads recorded yet.</p>
                    <span className="empty-state-hint">Completed and queued downloads persist in your browser for easy re-extraction.</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const platformKey = item.platform?.toLowerCase() || "unknown";
                const displayTitle = item.title || item.url || "Untitled";

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="table-title" title={displayTitle}>
                        {displayTitle}
                      </div>
                    </td>
                    <td>
                      <span className={`platform-pill ${platformKey}`} style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem" }}>
                        {item.platform || "direct"}
                      </span>
                    </td>
                    <td>
                      <TableStatus status={item.status} />
                    </td>
                    <td>
                      <span className="table-mono">
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          minHeight: "32px",
                          padding: "0.25rem 0.7rem",
                          fontSize: "0.78rem",
                          gap: "0.35rem",
                          marginLeft: "auto",
                        }}
                        onClick={() => onRedownload?.(item.url)}
                        title="Load URL and re-download"
                        aria-label={`Re-download ${displayTitle}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Re-download</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
