"use client";

export default function LinkInput({ value, onChange, onCheck, busy }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!busy && value.trim()) {
      onCheck();
    }
  };

  return (
    <section className="glass-panel section">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        Paste Link
      </div>
      <form onSubmit={handleSubmit} className="input-group">
        <input
          id="source-url"
          className="input"
          type="url"
          placeholder="https://youtube.com/watch?v=... or any media URL"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={busy}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !value.trim()}>
          {busy ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Check
            </>
          )}
        </button>
      </form>
    </section>
  );
}
