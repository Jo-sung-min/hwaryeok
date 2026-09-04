import type { NextConfig } from "next";

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [new URL("/api/v1/media/products/**", publicApiUrl)],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
