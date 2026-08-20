import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ApiRequestError, getCurrentUser, getUserComparisonProducts, getUserFavorites, getUserSkinProfile, refreshAuthTokens, type AuthTokenResult, type AuthUser, type SkinProfile } from "@/lib/api";
import type { ComparisonProductList } from "@/lib/types";

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

export const getCurrentSession = cache(async (): Promise<AuthUser | null> => {
  const { accessToken } = await readAuthTokens();
  if (!accessToken) return null;
  try {
    return await getCurrentUser(accessToken);
  } catch {
    return null;
  }
});

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

export async function getFavoriteViewState(): Promise<{ isAuthenticated: boolean; favoriteIds: string[] }> {
  const { accessToken, refreshToken } = await readAuthTokens();
  if (!accessToken) return { isAuthenticated: Boolean(refreshToken), favoriteIds: [] };
  try {
    const favorites = await getUserFavorites(accessToken);
    return {
      isAuthenticated: true,
      favoriteIds: favorites.content.map((item) => item.product.id),
    };
  } catch {
    return { isAuthenticated: Boolean(refreshToken), favoriteIds: [] };
  }
}

export async function getComparisonViewState(): Promise<{
  isAuthenticated: boolean;
  comparison: ComparisonProductList;
}> {
  const { accessToken, refreshToken } = await readAuthTokens();
  const empty = { content: [], totalElements: 0 };
  if (!accessToken) return { isAuthenticated: Boolean(refreshToken), comparison: empty };
  try {
    return { isAuthenticated: true, comparison: await getUserComparisonProducts(accessToken) };
  } catch {
    return { isAuthenticated: Boolean(refreshToken), comparison: empty };
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

export async function getActionAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = await readAuthTokens();
  if (accessToken) {
    try {
      await getCurrentUser(accessToken);
      return accessToken;
    } catch {
      // 만료된 Access Token은 아래에서 Refresh Token으로 한 번 갱신합니다.
    }
  }
  if (!refreshToken) return null;
  try {
    const tokens = await refreshAuthTokens(refreshToken);
    await setAuthCookies(tokens);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

export async function recoverAdminPageSession(error: unknown, returnTo: string): Promise<never> {
  const { refreshToken } = await readAuthTokens();
  if (refreshToken && error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo, "/admin"))}`);
  }
  throw error;
}

export function sanitizeReturnTo(value: string | null | undefined, fallback = "/profile") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
