"use client";

export default function LinkInput({ value, onChange, onDetect, onLoadFormats, busy }) {
  return (
    <section className="glass-panel section">
      <label htmlFor="source-url" className="label">
        Paste link
      </label>
      <input
        id="source-url"
        className="input"
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="actions">
        <button className="btn btn-secondary" onClick={onDetect} disabled={busy || !value.trim()}>
          Auto-detect
        </button>
        <button className="btn btn-primary" onClick={onLoadFormats} disabled={busy || !value.trim()}>
          Load formats
        </button>
      </div>
    </section>
  );
}
