import "server-only";

const LOCAL_BACKEND_ORIGIN = "http://localhost:8081";

function normalizeHttpUrl(value: string, variableName: string, originOnly: boolean): string {
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${variableName} must use http or https`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${variableName} must not include credentials, a query string, or a hash`);
  }
  if (originOnly && url.pathname.replace(/\/+$/, "")) {
    throw new Error(`${variableName} must not include a path`);
  }

  url.pathname = url.pathname.replace(/\/+$/, "");
  return originOnly ? url.origin : url.toString().replace(/\/$/, "");
}

function normalizeApiBaseUrl(value: string): string {
  const normalized = normalizeHttpUrl(value, "API_URL", false);
  const url = new URL(normalized);
  if (url.pathname.replace(/\/+$/, "") !== "/api/v1") {
    throw new Error("API_URL must end with /api/v1");
  }
  return `${url.origin}/api/v1`;
}

function resolveBackendOrigin(): string {
  const configuredOrigin = process.env.BACKEND_ORIGIN?.trim();
  const normalizedOrigin = configuredOrigin
    ? normalizeHttpUrl(configuredOrigin, "BACKEND_ORIGIN", true)
    : null;

  const configuredApiUrl = process.env.API_URL?.trim();
  if (configuredApiUrl) {
    const apiOrigin = new URL(normalizeApiBaseUrl(configuredApiUrl)).origin;
    if (normalizedOrigin && apiOrigin !== normalizedOrigin) {
      throw new Error("BACKEND_ORIGIN and API_URL must use the same origin");
    }
    return normalizedOrigin ?? apiOrigin;
  }

  if (normalizedOrigin) return normalizedOrigin;
  if (process.env.VERCEL === "1") {
    throw new Error("Set BACKEND_ORIGIN or API_URL for this Vercel environment");
  }
  return LOCAL_BACKEND_ORIGIN;
}

export const BACKEND_ORIGIN = resolveBackendOrigin();

export const API_BASE_URL = process.env.API_URL?.trim()
  ? normalizeApiBaseUrl(process.env.API_URL)
  : `${BACKEND_ORIGIN}/api/v1`;
