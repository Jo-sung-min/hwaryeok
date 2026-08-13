"use server";

import { ApiRequestError, loginUser, signupUser } from "@/lib/api";
import { setAuthCookies } from "@/lib/auth-session";

export type SignupActionState = {
  success: boolean;
  message: string;
  nickname?: string;
  fieldErrors: Record<string, string>;
  values: { nickname: string; email: string };
};

export async function signupAction(_previousState: SignupActionState, formData: FormData): Promise<SignupActionState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const termsAccepted = formData.get("termsAccepted") === "on";
  const fieldErrors: Record<string, string> = {};

  if (nickname.length < 2 || nickname.length > 20) fieldErrors.nickname = "닉네임은 2~20자로 입력해주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fieldErrors.email = "올바른 이메일 주소를 입력해주세요.";
  if (password.length < 8 || password.length > 64 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z\d]/.test(password) || !/^[\x21-\x7E]+$/.test(password)) {
    fieldErrors.password = "8~64자의 영문, 숫자, 특수문자를 함께 사용해주세요.";
  }
  if (password !== passwordConfirm) fieldErrors.passwordConfirm = "비밀번호 확인이 일치하지 않아요.";
  if (!termsAccepted) fieldErrors.termsAccepted = "서비스 이용약관과 개인정보 처리방침에 동의해주세요.";

  const values = { nickname, email };
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, message: "입력한 내용을 다시 확인해주세요.", fieldErrors, values };
  }

  try {
    const result = await signupUser({ nickname, email, password, passwordConfirm, termsAccepted });
    try {
      const tokens = await loginUser({ email: result.email, password });
      await setAuthCookies(tokens);
    } catch {
      // 계정 생성은 완료됐으므로 성공 화면을 유지하고, 필요하면 로그인 화면에서 이어갑니다.
    }
    return {
      success: true,
      message: "회원가입이 완료됐어요.",
      nickname: result.nickname,
      fieldErrors: {},
      values: { nickname: result.nickname, email: result.email },
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return {
        success: false,
        message: error.message,
        fieldErrors: error.fieldErrors,
        values,
      };
    }
    return {
      success: false,
      message: "회원가입 요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.",
      fieldErrors: {},
      values,
    };
  }
}
