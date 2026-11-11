export function logRequest({ method, route, status, durationMs, errorCode = null }) {
  const payload = {
    ts: new Date().toISOString(),
    method,
    route,
    status,
    durationMs,
    errorCode,
  };

  // Structured logs for Render log stream and grep-friendly diagnostics.
  console.log(JSON.stringify(payload));
}
