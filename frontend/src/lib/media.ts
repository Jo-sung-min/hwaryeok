const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api/v1";
const s3PublicBaseUrl = normalizePublicBaseUrl(process.env.S3_PUBLIC_BASE_URL);

function normalizePublicBaseUrl(value: string | undefined): URL | null {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return null;

  try {
    const url = new URL(trimmedValue);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

export function resolveProductImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/products/") && s3PublicBaseUrl) {
    const resolvedUrl = new URL(imageUrl.slice(1), s3PublicBaseUrl);
    const productPathPrefix = `${s3PublicBaseUrl.pathname}products/`;
    if (resolvedUrl.origin !== s3PublicBaseUrl.origin || !resolvedUrl.pathname.startsWith(productPathPrefix)) return null;
    return resolvedUrl.toString();
  }
  if (imageUrl.startsWith("/") && !imageUrl.startsWith("/api/")) return imageUrl;
  try {
    return new URL(imageUrl, new URL(publicApiUrl).origin).toString();
  } catch {
    return null;
  }
}
