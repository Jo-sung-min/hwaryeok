import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/backend-url";
import { beginOAuthAttempt, sanitizeReturnTo } from "@/lib/auth-session";
import { resolvePublicSiteOrigin } from "@/lib/site-origin";

const supportedProviders = new Set(["kakao"]);

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const requestUrl = new URL(request.url);
  const siteOrigin = resolvePublicSiteOrigin(requestUrl.origin);
  if (requestUrl.origin !== siteOrigin) {
    const canonicalStartUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, siteOrigin);
    return NextResponse.redirect(canonicalStartUrl);
  }

  const callbackUrl = new URL("/oauth/callback", siteOrigin);
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));

  if (!supportedProviders.has(provider)) {
    callbackUrl.searchParams.set("status", "error");
    callbackUrl.searchParams.set("error", "invalid_provider");
    callbackUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(callbackUrl);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/oauth/providers`, { cache: "no-store" });
    if (!response.ok) throw new Error("OAuth provider status request failed");
    const providers = await response.json() as Array<{ id: string; configured: boolean }>;
    if (!providers.some((item) => item.id === provider && item.configured)) {
      callbackUrl.searchParams.set("status", "error");
      callbackUrl.searchParams.set("error", "provider_not_configured");
      callbackUrl.searchParams.set("returnTo", returnTo);
      return NextResponse.redirect(callbackUrl);
    }
  } catch {
    callbackUrl.searchParams.set("status", "error");
    callbackUrl.searchParams.set("error", "backend_unavailable");
    callbackUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(callbackUrl);
  }

  const attemptChallenge = await beginOAuthAttempt(returnTo);
  const authorizationUrl = new URL(`/oauth2/authorization/${provider}`, siteOrigin);
  authorizationUrl.searchParams.set("attempt_challenge", attemptChallenge);
  return NextResponse.redirect(authorizationUrl);
}
