const PATTERNS = [
  { platform: "instagram", regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\//i },
  { platform: "tiktok", regex: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^/]+\/video\//i },
  { platform: "facebook", regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch|.*\/videos\/)/i },
  { platform: "youtube", regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?|youtu\.be\/)/i },
  { platform: "x", regex: /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/.+\/status\//i },
  { platform: "direct", regex: /\.(?:mp4|m4v|mov|mp3|wav|ogg|m4a|jpg|jpeg|png|gif|webm)(?:\?.*)?$/i },
];

export function isPrivateIp(ip) {
  if (!ip || typeof ip !== "string") return true;
  const trimmed = ip.trim().toLowerCase();

  // IPv4 check
  const ipv4Match = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, s0, s1, s2, s3] = ipv4Match.map(Number);
    if ([s0, s1, s2, s3].some((n) => n < 0 || n > 255)) return true;
    if (s0 === 0) return true; // 0.0.0.0/8 (current network)
    if (s0 === 10) return true; // 10.0.0.0/8 (RFC 1918)
    if (s0 === 100 && s1 >= 64 && s1 <= 127) return true; // 100.64.0.0/10 (CGNAT)
    if (s0 === 127) return true; // 127.0.0.0/8 (loopback)
    if (s0 === 169 && s1 === 254) return true; // 169.254.0.0/16 (link-local, cloud metadata)
    if (s0 === 172 && s1 >= 16 && s1 <= 31) return true; // 172.16.0.0/12 (RFC 1918)
    if (s0 === 192 && s1 === 168) return true; // 192.168.0.0/16 (RFC 1918)
    if (s0 === 192 && s1 === 0 && (s2 === 0 || s2 === 2)) return true; // 192.0.0.0/24, 192.0.2.0/24
    if (s0 === 198 && (s1 === 18 || s1 === 19)) return true; // 198.18.0.0/15
    if (s0 === 198 && s1 === 51 && s2 === 100) return true; // 198.51.100.0/24
    if (s0 === 203 && s1 === 0 && s2 === 113) return true; // 203.0.113.0/24
    if (s0 >= 224) return true; // 224.0.0.0/4 (multicast) + 240.0.0.0/4 (reserved) + broadcast
    return false;
  }

  // IPv6 IPv4-mapped check (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (trimmed.startsWith("::ffff:") || trimmed.startsWith("0:0:0:0:0:ffff:")) {
    const rest = trimmed.replace(/^(::ffff:|0:0:0:0:0:ffff:)/, "");
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rest)) {
      return isPrivateIp(rest);
    }
    const parts = rest.split(":");
    if (parts.length === 2) {
      const p1 = parseInt(parts[0], 16);
      const p2 = parseInt(parts[1], 16);
      if (!Number.isNaN(p1) && !Number.isNaN(p2)) {
        const o1 = (p1 >> 8) & 0xff;
        const o2 = p1 & 0xff;
        const o3 = (p2 >> 8) & 0xff;
        const o4 = p2 & 0xff;
        return isPrivateIp(`${o1}.${o2}.${o3}.${o4}`);
      }
    }
  }

  // IPv6 loopback / unspecified
  if (
    trimmed === "::" ||
    trimmed === "::1" ||
    trimmed === "0:0:0:0:0:0:0:0" ||
    trimmed === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  // Unique Local Address (fc00::/7 -> fc.. or fd..)
  if (/^f[cd][0-9a-f]{2}:/i.test(trimmed)) {
    return true;
  }

  // Link-local (fe80::/10 -> fe8.. to feb..)
  if (/^fe[89ab][0-9a-f]:/i.test(trimmed)) {
    return true;
  }

  // Multicast (ff00::/8)
  if (/^ff[0-9a-f]{2}:/i.test(trimmed)) {
    return true;
  }

  return false;
}

export function isPrivateOrBlockedHost(hostname) {
  if (!hostname || typeof hostname !== "string") {
    return true;
  }
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
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

  // Direct IP literal evaluation
  if (isPrivateIp(host)) {
    return true;
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
