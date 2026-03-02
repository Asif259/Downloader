"use client";

export default function BatchPanel({ value, onChange, onStart, busy }) {
  return (
    <section className="glass-panel section">
      <label htmlFor="batch-urls" className="label">
        Batch mode (one URL per line)
      </label>
      <textarea
        id="batch-urls"
        className="textarea"
        rows={5}
        placeholder={"https://youtu.be/...\nhttps://www.tiktok.com/@user/video/..."}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button className="btn btn-primary" onClick={onStart} disabled={busy || !value.trim()}>
        Start batch download
      </button>
    </section>
  );
}
