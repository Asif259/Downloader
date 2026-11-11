const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const IS_PROD = process.env.NODE_ENV === "production";

function normalizeBase(base) {
  return base.replace(/\/+$/, "");
}

export function hasConfiguredApiBase() {
  return Boolean(normalizeBase(RAW_BASE));
}

export function getApiBaseConfigError() {
  if (IS_PROD && !hasConfiguredApiBase()) {
    return "NEXT_PUBLIC_API_BASE_URL is missing. Set it to your backend URL and redeploy frontend.";
  }
  return null;
}

export function apiUrl(path) {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const base = normalizeBase(RAW_BASE);
  return base ? `${base}${safePath}` : safePath;
}
