"use client";

export default function DownloadQueue({ tasks }) {
  return (
    <section className="glass-panel section">
      <h2>Active downloads</h2>
      {tasks.length === 0 ? <p className="muted">No active tasks.</p> : null}
      <div className="queue-list">
        {tasks.map((task) => (
          <article className="queue-item" key={task.id}>
            <header>
              <strong>{task.status.toUpperCase()}</strong>
              <span>{Math.round(Number(task.progress) || 0)}%</span>
            </header>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Number(task.progress) || 0)}>
              <span
                className={`progress-fill ${
                  task.status === "downloading" && (Number(task.progress) || 0) <= 0 ? "progress-fill-indeterminate" : ""
                }`}
                style={{ width: `${Math.max(0, Math.min(100, Number(task.progress) || 0))}%` }}
              />
            </div>
            <p className="mono">{task.url}</p>
            <p className="muted">
              {task.speed ? `Speed: ${task.speed}` : ""} {task.eta ? ` ETA: ${task.eta}` : ""}
            </p>
            {task.error ? <p className="error">{task.error}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
