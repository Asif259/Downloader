"use client";

export default function HistoryTable({ items, loading, error, onRefresh, onClear }) {
  return (
    <section className="glass-panel section">
      <div className="history-header">
        <h2>History</h2>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onRefresh}>
            Refresh
          </button>
          <button className="btn btn-secondary" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>
      {loading ? <p className="muted">Loading history...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="history-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title || item.url}</td>
                <td>{item.platform}</td>
                <td>{item.status}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No download history yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
