"use client";

export default function LinkInput({ value, onChange }) {
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
    </section>
  );
}
