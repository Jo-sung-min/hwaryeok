export function resolvePublicSiteOrigin(
  requestOrigin: string,
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const fallbackOrigin = new URL(requestOrigin).origin;
  const configuredValue = configuredSiteUrl?.trim();
  if (!configuredValue) return fallbackOrigin;

  const url = new URL(configuredValue);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https");
  }
  if (url.username || url.password || url.search || url.hash || url.pathname.replace(/\/+$/, "")) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an origin without credentials, a path, query, or hash");
  }
  return url.origin;
}
