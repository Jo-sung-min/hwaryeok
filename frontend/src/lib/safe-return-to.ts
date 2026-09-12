const RETURN_TO_ORIGIN = "https://hwaryeok-return.local";

function sameOriginPath(value: string | null | undefined): string | null {
  if (!value?.startsWith("/")) return null;

  try {
    const parsed = new URL(value, RETURN_TO_ORIGIN);
    if (parsed.origin !== RETURN_TO_ORIGIN) return null;
    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const verified = new URL(normalized, RETURN_TO_ORIGIN);
    if (verified.origin !== RETURN_TO_ORIGIN || normalized.startsWith("//")) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function sanitizeReturnTo(value: string | null | undefined, fallback = "/skin-check") {
  return sameOriginPath(value) ?? sameOriginPath(fallback) ?? "/";
}
