"use client";

function StatusBadge({ status }) {
  const getIcon = () => {
    switch (status) {
      case "pending":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
      case "downloading":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0110 10" />
          </svg>
        );
      case "completed":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case "failed":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span className={`status-badge ${status}`}>
      {getIcon()}
      {status}
    </span>
  );
}

export default function DownloadQueue({ tasks, onCancel }) {
  return (
    <section className="glass-panel section">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Active Downloads
      </div>
      {tasks.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <p>No active downloads</p>
        </div>
      ) : (
        <div className="queue-list">
          {tasks.map((task) => (
            <article className="queue-item" key={task.id}>
              <div className="queue-item-header">
                <StatusBadge status={task.status} />
                <span className="progress-percent">{Math.round(Number(task.progress) || 0)}%</span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Number(task.progress) || 0)}
              >
                <span
                  className={`progress-fill ${
                    task.status === "downloading" && (Number(task.progress) || 0) <= 0
                      ? "progress-fill-indeterminate"
                      : ""
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, Number(task.progress) || 0))}%` }}
                />
              </div>
              <p className="queue-item-url">{task.url}</p>
              <div className="queue-item-meta">
                {task.speed && <span>Speed: {task.speed}</span>}
                {task.eta && <span>ETA: {task.eta}</span>}
              </div>
              {task.error && (
                <p style={{ color: "var(--error)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  {task.error}
                </p>
              )}
              <div className="queue-item-actions">
                <button className="btn btn-danger" onClick={() => onCancel?.(task.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                  Cancel
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
