"use client";

export default function QualitySelector({ formats, value, onChange, onDownload, busy, disabled }) {
  return (
    <section className="glass-panel section">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18M3 12h18" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        Quality & Format
      </div>
      <div className="quality-grid">
        <div>
          <label htmlFor="format" className="label">
            Select Quality
          </label>
          <select
            id="format"
            className="select format-select"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled || busy}
          >
            <option value="best">Best Available</option>
            {formats.map((format) => (
              <option key={`${format.formatId}-${format.ext}`} value={format.formatId}>
                {format.resolution} • {format.ext.toUpperCase()} • {format.formatId}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-primary download-btn"
          onClick={onDownload}
          disabled={disabled || busy}
        >
          {busy ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
              </svg>
              Starting...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Now
            </>
          )}
        </button>
      </div>
    </section>
  );
}
