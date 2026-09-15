import type { NextConfig } from "next";

const LOCAL_BACKEND_ORIGIN = "http://localhost:8081";
const backendOrigin = resolveBackendOrigin();
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";
const s3PublicBaseUrl = normalizePublicBaseUrl(process.env.S3_PUBLIC_BASE_URL);

validateVercelFrontendConfiguration(publicApiUrl);

function normalizeBackendOrigin(value: string): string {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("BACKEND_ORIGIN must use http or https");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("BACKEND_ORIGIN must not include credentials, a query string, or a hash");
  }
  if (url.pathname.replace(/\/+$/, "")) {
    throw new Error("BACKEND_ORIGIN must not include a path");
  }
  return url.origin;
}

function resolveBackendOrigin(): string {
  const configuredOrigin = process.env.BACKEND_ORIGIN?.trim();
  const normalizedOrigin = configuredOrigin ? normalizeBackendOrigin(configuredOrigin) : null;

  const configuredApiUrl = process.env.API_URL?.trim();
  if (configuredApiUrl) {
    const url = new URL(configuredApiUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error("API_URL must be an http(s) URL without credentials, a query string, or a hash");
    }
    if (url.pathname.replace(/\/+$/, "") !== "/api/v1") {
      throw new Error("API_URL must end with /api/v1");
    }
    if (normalizedOrigin && url.origin !== normalizedOrigin) {
      throw new Error("BACKEND_ORIGIN and API_URL must use the same origin");
    }
    if (normalizedOrigin) return normalizedOrigin;
    return url.origin;
  }

  if (normalizedOrigin) return normalizedOrigin;
  if (process.env.VERCEL === "1") {
    throw new Error("Set BACKEND_ORIGIN or API_URL for this Vercel environment");
  }
  return LOCAL_BACKEND_ORIGIN;
}

function validateVercelFrontendConfiguration(configuredPublicApiUrl: string): void {
  if (process.env.VERCEL !== "1") return;

  if (configuredPublicApiUrl !== "/api/v1") {
    throw new Error("NEXT_PUBLIC_API_URL must be /api/v1 on Vercel");
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredSiteUrl) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL to the canonical HTTPS origin for this Vercel environment");
  }

  const url = new URL(configuredSiteUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
      || url.pathname.replace(/\/+$/, "")) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a canonical HTTPS origin on Vercel");
  }
}

function normalizePublicBaseUrl(value: string | undefined): URL | null {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return null;

  const url = new URL(trimmedValue);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("S3_PUBLIC_BASE_URL must use http or https");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("S3_PUBLIC_BASE_URL must not include credentials, a query string, or a hash");
  }

  url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
}

function remoteImagePattern(baseUrl: URL, directory: "products" | "profiles"): URL {
  const pattern = new URL(baseUrl);
  pattern.pathname = `${pattern.pathname}/${directory}/**`.replace(/^\/\//, "/");
  return pattern;
}

const remotePatterns: URL[] = [];
if (/^https?:\/\//i.test(publicApiUrl)) {
  remotePatterns.push(new URL("/api/v1/media/products/**", publicApiUrl));
}
if (s3PublicBaseUrl) {
  remotePatterns.push(remoteImagePattern(s3PublicBaseUrl, "products"));
  remotePatterns.push(remoteImagePattern(s3PublicBaseUrl, "profiles"));
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    S3_PUBLIC_BASE_URL: s3PublicBaseUrl?.toString().replace(/\/$/, "") ?? "",
  },
  images: {
    remotePatterns,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      {
        source: "/oauth2/authorization/kakao",
        destination: `${backendOrigin}/oauth2/authorization/kakao`,
      },
      {
        source: "/login/oauth2/code/kakao",
        destination: `${backendOrigin}/login/oauth2/code/kakao`,
      },
    ];
  },
  async headers() {
    const noStoreHeaders = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "x-vercel-enable-rewrite-caching", value: "0" },
    ];
    return [
      { source: "/api/v1/:path*", headers: noStoreHeaders },
      { source: "/oauth2/authorization/kakao", headers: noStoreHeaders },
      { source: "/login/oauth2/code/kakao", headers: noStoreHeaders },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
