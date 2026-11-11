const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

export function getAllowedOrigins() {
  const envOrigins = process.env.CORS_ALLOW_ORIGIN;
  if (!envOrigins) {
    return DEFAULT_ORIGINS;
  }
  if (envOrigins.trim() === "*") {
    return ["*"];
  }
  return envOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin, allowedOrigins = getAllowedOrigins()) {
  if (!origin) return false;
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
}

function resolveOrigin(incomingOrigin) {
  const allowed = getAllowedOrigins();
  if (allowed.includes("*")) {
    return "*";
  }
  if (incomingOrigin && isOriginAllowed(incomingOrigin, allowed)) {
    return incomingOrigin;
  }
  return allowed[0] || "http://localhost:3000";
}

function setCorsHeaders(headers, request) {
  const incomingOrigin = request?.headers?.get?.("origin") || null;
  const allowOrigin = resolveOrigin(incomingOrigin);

  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  if (allowOrigin !== "*") {
    headers.set("Vary", "Origin");
  }
}

export function applyCors(response, request) {
  setCorsHeaders(response.headers, request);
  return response;
}

export function corsPreflight(request) {
  const response = new Response(null, { status: 204 });
  return applyCors(response, request);
}
