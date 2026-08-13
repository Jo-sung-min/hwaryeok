import { NextResponse } from "next/server";
import { exchangeOAuthCode } from "@/lib/api";
import { setAuthCookies, takeOAuthReturnTo } from "@/lib/auth-session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const provider = requestUrl.searchParams.get("provider") ?? "";
  const newUser = requestUrl.searchParams.get("newUser") === "true";
  const resultUrl = new URL("/oauth/callback", requestUrl.origin);
  const returnTo = await takeOAuthReturnTo();

  if (!code) {
    resultUrl.searchParams.set("status", "error");
    resultUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(resultUrl);
  }

  try {
    const tokens = await exchangeOAuthCode(code);
    await setAuthCookies(tokens);
    resultUrl.searchParams.set("status", "success");
    resultUrl.searchParams.set("provider", provider);
    resultUrl.searchParams.set("newUser", String(newUser));
    resultUrl.searchParams.set("returnTo", returnTo);
  } catch {
    resultUrl.searchParams.set("status", "error");
    resultUrl.searchParams.set("error", "oauth_failed");
  }
  return NextResponse.redirect(resultUrl);
}
