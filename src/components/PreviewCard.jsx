"use client";

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) {
    return null;
  }

  const total = Math.floor(Number(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function PlatformBadge({ platform }) {
  const getIcon = () => {
    switch (platform?.toLowerCase()) {
      case "youtube":
        return "YT";
      case "tiktok":
        return "TT";
      case "instagram":
        return "IG";
      case "x":
        return "X";
      case "facebook":
        return "FB";
      case "direct":
        return "DL";
      default:
        return "?";
    }
  };

  return (
    <span className={`platform-icon ${platform?.toLowerCase() || "unknown"}`}>
      {getIcon()}
    </span>
  );
}

export default function PreviewCard({ media, loading = false }) {
  if (loading) {
    return (
      <section className="glass-panel section">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          Preview
        </div>
        <div className="skeleton-container">
          <div className="skeleton-thumb" />
          <div className="skeleton-lines">
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      </section>
    );
  }

  if (!media) {
    return (
      <section className="glass-panel section">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          Preview
        </div>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p>Paste a URL to load media preview</p>
        </div>
      </section>
    );
  }

  const duration = formatDuration(media.duration);

  return (
    <section className="glass-panel section">
      <div className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        Preview
      </div>
      <div className="preview-card">
        {media.thumbnail && (
          <div className="thumb-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.thumbnail} alt={media.title || "thumbnail"} className="thumb" />
          </div>
        )}
        <div className="preview-info">
          <h3>{media.title || "Untitled"}</h3>
          <div className="preview-meta">
            {media.platform && (
              <span className="meta-badge">
                <PlatformBadge platform={media.platform} />
                {media.platform}
              </span>
            )}
            {duration && (
              <span className="meta-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {duration}
              </span>
            )}
            {media.uploader && (
              <span className="meta-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {media.uploader}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
