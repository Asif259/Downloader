const PATTERNS = [
  { platform: "instagram", regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\//i },
  { platform: "tiktok", regex: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^/]+\/video\//i },
  { platform: "facebook", regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch|.*\/videos\/)/i },
  { platform: "youtube", regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?|youtu\.be\/)/i },
  { platform: "x", regex: /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/.+\/status\//i },
  { platform: "direct", regex: /\.(?:mp4|m4v|mov|mp3|wav|ogg|m4a|jpg|jpeg|png|gif|webm)(?:\?.*)?$/i },
];

export function normalizeUrl(raw) {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function detectPlatform(url) {
  for (const pattern of PATTERNS) {
    if (pattern.regex.test(url)) {
      return pattern.platform;
    }
  }

  return "unknown";
}
