import dns from "node:dns/promises";
import { isPrivateIp, isPrivateOrBlockedHost } from "./detector.js";

export const DNS_LOOKUP_TIMEOUT_MS = 3000;

export async function validateHostDns(hostname, { timeoutMs = DNS_LOOKUP_TIMEOUT_MS } = {}) {
  if (!hostname || typeof hostname !== "string") {
    return { safe: false, reason: "INVALID_HOSTNAME" };
  }

  const cleanHost = hostname.trim().toLowerCase();

  // 1. Syntactic & literal checks
  if (isPrivateOrBlockedHost(cleanHost) || isPrivateIp(cleanHost)) {
    return { safe: false, reason: "BLOCKED_HOST", host: cleanHost };
  }

  // 2. DNS resolution with fail-closed timeout
  try {
    const addresses = await dns.lookup(cleanHost, {
      all: true,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!addresses || addresses.length === 0) {
      return { safe: false, reason: "NO_DNS_RECORDS" };
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return { safe: false, reason: "PRIVATE_IP_RESOLVED", ip: record.address };
      }
    }

    return {
      safe: true,
      addresses: addresses.map((a) => a.address),
    };
  } catch (error) {
    const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    return {
      safe: false,
      reason: isTimeout ? "DNS_TIMEOUT" : "DNS_LOOKUP_FAILED",
      error: error?.message || String(error),
    };
  }
}

export async function validateUrlDns(urlStr, options = {}) {
  if (typeof urlStr !== "string" || !urlStr.trim()) {
    return { safe: false, reason: "INVALID_URL" };
  }

  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { safe: false, reason: "INVALID_URL" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { safe: false, reason: "INVALID_PROTOCOL" };
  }

  return validateHostDns(parsed.hostname, options);
}
