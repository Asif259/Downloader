const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";

function setCorsHeaders(headers) {
  headers.set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
}

export function applyCors(response) {
  setCorsHeaders(response.headers);
  return response;
}

export function corsPreflight() {
  const response = new Response(null, { status: 204 });
  return applyCors(response);
}
