const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function normalizeBase(base) {
  return base.replace(/\/+$/, "");
}

export function apiUrl(path) {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const base = normalizeBase(RAW_BASE);
  return base ? `${base}${safePath}` : safePath;
}
