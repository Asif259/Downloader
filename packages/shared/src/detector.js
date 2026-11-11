const PATTERNS = [
  { platform: "instagram", regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\//i },
  { platform: "tiktok", regex: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^/]+\/video\//i },
  { platform: "facebook", regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch|.*\/videos\/)/i },
  { platform: "youtube", regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?|youtu\.be\/)/i },
  { platform: "x", regex: /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/.+\/status\//i },
  { platform: "direct", regex: /\.(?:mp4|m4v|mov|mp3|wav|ogg|m4a|jpg|jpeg|png|gif|webm)(?:\?.*)?$/i },
];

export function isPrivateOrBlockedHost(hostname) {
  if (!hostname || typeof hostname !== "string") {
    return true;
  }
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "169.254.169.254" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
  ) {
    return true;
  }

  // IPv4 private ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x, 127.x.x.x, 169.254.x.x)
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }

  return false;
}

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
    if (isPrivateOrBlockedHost(parsed.hostname)) {
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
