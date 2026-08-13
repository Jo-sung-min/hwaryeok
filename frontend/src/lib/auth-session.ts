import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserSkinProfile, type AuthTokenResult, type AuthUser, type SkinProfile } from "@/lib/api";

export const ACCESS_TOKEN_COOKIE = "hwaryeok_access_token";
export const REFRESH_TOKEN_COOKIE = "hwaryeok_refresh_token";
export const OAUTH_RETURN_TO_COOKIE = "hwaryeok_oauth_return_to";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(tokens: AuthTokenResult) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.accessTokenExpiresIn,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: tokens.refreshTokenExpiresIn,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function readAuthTokens() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

export async function rememberOAuthReturnTo(returnTo: string) {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_RETURN_TO_COOKIE, sanitizeReturnTo(returnTo), {
    ...cookieOptions,
    maxAge: 600,
  });
}

export async function takeOAuthReturnTo() {
  const cookieStore = await cookies();
  const returnTo = sanitizeReturnTo(cookieStore.get(OAUTH_RETURN_TO_COOKIE)?.value);
  cookieStore.delete(OAUTH_RETURN_TO_COOKIE);
  return returnTo;
}

export async function getCurrentSession(): Promise<AuthUser | null> {
  const { accessToken } = await readAuthTokens();
  if (!accessToken) return null;
  try {
    return await getCurrentUser(accessToken);
  } catch {
    return null;
  }
}

export async function getOptionalSkinProfile(): Promise<SkinProfile | null> {
  const { accessToken } = await readAuthTokens();
  if (!accessToken) return null;
  try {
    const profile = await getUserSkinProfile(accessToken);
    return profile.configured ? profile : null;
  } catch {
    return null;
  }
}

export async function requireSession(returnTo: string): Promise<AuthUser> {
  const user = await getCurrentSession();
  if (user) return user;

  const { refreshToken } = await readAuthTokens();
  const safeReturnTo = sanitizeReturnTo(returnTo, "/");
  if (refreshToken) {
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }
  redirect(`/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
}

export function sanitizeReturnTo(value: string | null | undefined, fallback = "/profile") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
