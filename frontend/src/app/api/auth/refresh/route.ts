import { NextResponse } from "next/server";
import { refreshAuthTokens } from "@/lib/api";
import { clearAuthCookies, readAuthTokens, sanitizeReturnTo, setAuthCookies } from "@/lib/auth-session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"), "/");
  const { refreshToken } = await readAuthTokens();

  if (!refreshToken) {
    return NextResponse.redirect(new URL(`/login?returnTo=${encodeURIComponent(returnTo)}`, requestUrl.origin));
  }

  try {
    const tokens = await refreshAuthTokens(refreshToken);
    await setAuthCookies(tokens);
    return NextResponse.redirect(new URL(returnTo, requestUrl.origin));
  } catch {
    await clearAuthCookies();
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "session_expired");
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl);
  }
}
