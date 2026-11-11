"use client";

function TableStatus({ status }) {
  return <span className={`table-status ${status}`}>{status}</span>;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HistoryTable({ items, loading, error: historyError, onRefresh, onClear }) {
  return (
    <section className="glass-panel section">
      <div className="history-header">
        <div className="section-title" style={{ margin: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Download History
        </div>
        <div className="history-actions">
          <button className="btn btn-secondary" onClick={onRefresh}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
          <button className="btn btn-danger" onClick={onClear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>Loading history...</p>}
      {historyError && <p style={{ color: "var(--error)", padding: "1rem 0" }}>{historyError}</p>}

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>No download history yet</span>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="table-title" title={item.title || item.url}>
                    {item.title || item.url}
                  </td>
                  <td>{item.platform}</td>
                  <td>
                    <TableStatus status={item.status} />
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
