"use client";

export default function QualitySelector({ formats, value, onChange, onDownload, busy, disabled }) {
  return (
    <section className="glass-panel section">
      <label htmlFor="format" className="label">
        Quality / format
      </label>
      <select
        id="format"
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || busy}
      >
        <option value="best">Best available</option>
        {formats.map((format) => (
          <option key={`${format.formatId}-${format.ext}`} value={format.formatId}>
            {format.formatId} | {format.ext} | {format.resolution}
          </option>
        ))}
      </select>
      <button className="btn btn-primary" onClick={onDownload} disabled={disabled || busy}>
        Download now
      </button>
    </section>
  );
}
