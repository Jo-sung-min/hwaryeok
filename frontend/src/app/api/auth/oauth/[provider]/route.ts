import { NextResponse } from "next/server";
import { rememberOAuthReturnTo, sanitizeReturnTo } from "@/lib/auth-session";

const supportedProviders = new Set(["google", "kakao", "naver"]);
const apiUrl = process.env.API_URL ?? "http://localhost:8080/api/v1";
const backendUrl = process.env.OAUTH_BACKEND_URL ?? new URL(apiUrl).origin;

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const requestUrl = new URL(request.url);
  const callbackUrl = new URL("/oauth/callback", requestUrl.origin);
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));

  if (!supportedProviders.has(provider)) {
    callbackUrl.searchParams.set("status", "error");
    callbackUrl.searchParams.set("error", "invalid_provider");
    return NextResponse.redirect(callbackUrl);
  }

  try {
    const response = await fetch(`${apiUrl}/auth/oauth/providers`, { cache: "no-store" });
    if (!response.ok) throw new Error("OAuth provider status request failed");
    const providers = await response.json() as Array<{ id: string; configured: boolean }>;
    if (!providers.some((item) => item.id === provider && item.configured)) {
      callbackUrl.searchParams.set("status", "error");
      callbackUrl.searchParams.set("error", "provider_not_configured");
      return NextResponse.redirect(callbackUrl);
    }
  } catch {
    callbackUrl.searchParams.set("status", "error");
    callbackUrl.searchParams.set("error", "backend_unavailable");
    return NextResponse.redirect(callbackUrl);
  }

  await rememberOAuthReturnTo(returnTo);
  return NextResponse.redirect(new URL(`/oauth2/authorization/${provider}`, backendUrl));
}
