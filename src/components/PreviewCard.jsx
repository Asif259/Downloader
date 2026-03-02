"use client";

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) {
    return "n/a";
  }

  const total = Math.floor(Number(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function PreviewCard({ media }) {
  if (!media) {
    return (
      <section className="glass-panel section empty-card">
        <p>No preview yet. Detect a URL to load metadata.</p>
      </section>
    );
  }

  return (
    <section className="glass-panel section preview-card">
      {/* External thumbnails come from many hosts; <img> avoids strict allowlist config for this MVP. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {media.thumbnail ? <img src={media.thumbnail} alt={media.title || "thumbnail"} className="thumb" /> : null}
      <div>
        <h3>{media.title || "Untitled"}</h3>
        <p>Platform: {media.platform}</p>
        <p>Duration: {formatDuration(media.duration)}</p>
        {media.uploader ? <p>Uploader: {media.uploader}</p> : null}
      </div>
    </section>
  );
}
