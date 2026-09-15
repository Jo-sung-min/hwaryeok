import "server-only";

const LOCAL_BACKEND_ORIGIN = "http://localhost:8081";
const VERCEL_BACKEND_ORIGIN = "http://hwaryeok-prd.ap-northeast-2.elasticbeanstalk.com";

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

const defaultBackendOrigin = process.env.VERCEL === "1"
  ? VERCEL_BACKEND_ORIGIN
  : LOCAL_BACKEND_ORIGIN;

export const BACKEND_ORIGIN = normalizeHttpUrl(
  process.env.BACKEND_ORIGIN?.trim() || defaultBackendOrigin,
  "BACKEND_ORIGIN",
  true,
);

export const API_BASE_URL = normalizeHttpUrl(
  process.env.API_URL?.trim() || `${BACKEND_ORIGIN}/api/v1`,
  "API_URL",
  false,
);
