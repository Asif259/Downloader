"use client";

function StatusBadge({ status }) {
  const getIcon = () => {
    switch (status) {
      case "pending":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
      case "downloading":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin" aria-hidden="true">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0110 10" />
          </svg>
        );
      case "completed":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        );
      case "failed":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span className={`status-badge ${status}`} role="status">
      {getIcon()}
      <span>{status}</span>
    </span>
  );
}

export default function DownloadQueue({ tasks = [], onCancel }) {
  const activeCount = tasks.filter((t) => ["pending", "downloading"].includes(t.status)).length;

  return (
    <section className="glass-panel section" aria-label="Active download tasks">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Active Downloads</span>
        {activeCount > 0 && (
          <span className="section-counter" aria-label={`${activeCount} active tasks`}>
            {activeCount}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-graphic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <p>No active downloads in progress.</p>
          <span className="empty-state-hint">Downloads automatically appear here with live speed & ETA metrics.</span>
        </div>
      ) : (
        <div className="queue-list">
          {tasks.map((task) => {
            const rawProgress = Number(task.progress) || 0;
            const progress = Math.max(0, Math.min(100, Math.round(rawProgress)));
            const isIndeterminate = task.status === "downloading" && rawProgress <= 0;

            return (
              <article className="queue-item" key={task.id} aria-label={`Task ${task.id}`}>
                <div className="queue-item-header">
                  <StatusBadge status={task.status} />
                  <span className="progress-percent">
                    {task.status === "completed" ? "100%" : `${progress}%`}
                  </span>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Download progress"
                >
                  <div
                    className={`progress-fill ${isIndeterminate ? "progress-fill-indeterminate" : ""}`}
                    style={
                      isIndeterminate
                        ? undefined
                        : {
                            transform: `scaleX(${task.status === "completed" ? 1 : progress / 100})`,
                          }
                    }
                  />
                </div>

                <p className="queue-item-url" title={task.url}>
                  {task.url}
                </p>

                <div className="queue-item-meta">
                  {task.speed && (
                    <span className="metric-pill" title="Current transfer speed">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <span>{task.speed}</span>
                    </span>
                  )}

                  {task.eta && (
                    <span className="metric-pill" title="Estimated time remaining">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>ETA: {task.eta}</span>
                    </span>
                  )}

                  {task.format && (
                    <span className="metric-pill" title="Format specification">
                      <span>Format: {task.format}</span>
                    </span>
                  )}
                </div>

                {task.error && (
                  <p style={{ color: "var(--error)", fontSize: "0.825rem", marginBottom: "0.6rem" }}>
                    ⚠️ {task.error}
                  </p>
                )}

                {["pending", "downloading"].includes(task.status) && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => onCancel?.(task.id)}
                      style={{ minHeight: "36px", padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
                      title="Cancel active task"
                      aria-label="Cancel active download"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
