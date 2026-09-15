"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ApiRequestError, loginUser, logoutSession } from "@/lib/api";
import { clearAuthCookies, readAuthTokens, sanitizeReturnTo, setAuthCookies } from "@/lib/auth-session";

export type LoginActionState = {
  message: string;
  fieldErrors: Record<string, string>;
  values: { email: string };
};

export async function loginAction(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnTo = sanitizeReturnTo(String(formData.get("returnTo") ?? ""));
  const fieldErrors: Record<string, string> = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    fieldErrors.email = "올바른 이메일 주소를 입력해 주세요.";
  }
  if (!password || password.length > 64) {
    fieldErrors.password = "비밀번호를 입력해 주세요.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { message: "입력한 내용을 다시 확인해 주세요.", fieldErrors, values: { email } };
  }

  let tokens;
  try {
    const requestHeaders = await headers();
    const clientAddress = normalizeClientAddress(
      requestHeaders.get("x-vercel-forwarded-for")
        ?? requestHeaders.get("x-forwarded-for")
        ?? requestHeaders.get("x-real-ip"),
    );
    tokens = await loginUser({ email, password }, clientAddress);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { message: error.message, fieldErrors: error.fieldErrors, values: { email } };
    }
    return { message: "로그인 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.", fieldErrors: {}, values: { email } };
  }

  await setAuthCookies(tokens);
  redirect(returnTo);
}

function normalizeClientAddress(rawValue: string | null): string | undefined {
  const candidate = rawValue?.split(",", 1)[0]?.trim();
  if (!candidate || candidate.length > 64 || !/^[0-9a-f:.]+$/i.test(candidate)) return undefined;
  return candidate;
}

export async function logoutAction() {
  const { refreshToken } = await readAuthTokens();
  if (refreshToken) {
    try {
      await logoutSession(refreshToken);
    } catch {
      // 서버 상태와 관계없이 이 브라우저의 로그인 쿠키는 반드시 정리합니다.
    }
  }
  await clearAuthCookies();
  redirect("/login?loggedOut=true");
}
