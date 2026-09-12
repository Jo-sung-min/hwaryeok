import type { NextConfig } from "next";

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api/v1";
const s3PublicBaseUrl = normalizePublicBaseUrl(process.env.S3_PUBLIC_BASE_URL);

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

function remoteImagePattern(baseUrl: URL): URL {
  const pattern = new URL(baseUrl);
  pattern.pathname = `${pattern.pathname}/products/**`.replace(/^\/\//, "/");
  return pattern;
}

const remotePatterns = [new URL("/api/v1/media/products/**", publicApiUrl)];
if (s3PublicBaseUrl) remotePatterns.push(remoteImagePattern(s3PublicBaseUrl));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  env: {
    S3_PUBLIC_BASE_URL: s3PublicBaseUrl?.toString().replace(/\/$/, "") ?? "",
  },
  images: {
    remotePatterns,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
