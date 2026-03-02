"use client";

export default function LinkInput({ value, onChange, onCheck, busy }) {
  return (
    <section className="glass-panel section">
      <label htmlFor="source-url" className="label">
        Paste link
      </label>
      <div className="input-inline">
        <input
          id="source-url"
          className="input"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button className="btn btn-primary inline-btn" onClick={onCheck} disabled={busy || !value.trim()}>
          Check
        </button>
      </div>
    </section>
  );
}
