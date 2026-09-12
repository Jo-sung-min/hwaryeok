import { NextResponse } from "next/server";
import { exchangeOAuthCode } from "@/lib/api";
import { setAuthCookies, takeOAuthAttempt } from "@/lib/auth-session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const callbackError = requestUrl.searchParams.get("error");
  const resultUrl = new URL("/oauth/callback", requestUrl.origin);
  const { returnTo, verifier } = await takeOAuthAttempt();

  if (callbackError || !code || !verifier) {
    resultUrl.searchParams.set("status", "error");
    resultUrl.searchParams.set("error", callbackError ?? "oauth_failed");
    resultUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(resultUrl);
  }

  try {
    const tokens = await exchangeOAuthCode(code, verifier);
    await setAuthCookies(tokens);
    resultUrl.searchParams.set("status", "success");
    resultUrl.searchParams.set("provider", tokens.user.authMethod === "kakao" ? "kakao" : "");
    resultUrl.searchParams.set("returnTo", returnTo);
  } catch {
    resultUrl.searchParams.set("status", "error");
    resultUrl.searchParams.set("error", "oauth_failed");
    resultUrl.searchParams.set("returnTo", returnTo);
  }
  return NextResponse.redirect(resultUrl);
}
