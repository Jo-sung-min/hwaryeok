const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function resolveProductImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  try {
    return new URL(imageUrl, new URL(publicApiUrl).origin).toString();
  } catch {
    return null;
  }
}
