"use server";

import { ApiRequestError, changePassword } from "@/lib/api";
import { getActionAccessToken, setAuthCookies } from "@/lib/auth-session";

export type PasswordChangeActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  resetKey: number;
};

export async function changePasswordAction(
  previousState: PasswordChangeActionState,
  formData: FormData,
): Promise<PasswordChangeActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const newPasswordConfirm = String(formData.get("newPasswordConfirm") ?? "");
  const fieldErrors: Record<string, string> = {};

  if (!currentPassword || currentPassword.length > 64) {
    fieldErrors.currentPassword = "현재 비밀번호를 입력해 주세요.";
  }
  if (
    newPassword.length < 8
    || newPassword.length > 64
    || !/[A-Za-z]/.test(newPassword)
    || !/\d/.test(newPassword)
    || !/[^A-Za-z\d]/.test(newPassword)
    || !/^[\x21-\x7E]+$/.test(newPassword)
  ) {
    fieldErrors.newPassword = "8~64자의 영문, 숫자, 특수문자를 함께 사용해 주세요.";
  }
  if (!newPasswordConfirm) {
    fieldErrors.newPasswordConfirm = "새 비밀번호 확인을 입력해 주세요.";
  } else if (newPassword !== newPasswordConfirm) {
    fieldErrors.newPasswordConfirm = "새 비밀번호 확인이 일치하지 않아요.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "입력한 비밀번호를 다시 확인해 주세요.",
      fieldErrors,
      resetKey: previousState.resetKey,
    };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return {
      success: false,
      message: "로그인이 만료되었어요. 다시 로그인해 주세요.",
      fieldErrors: {},
      resetKey: previousState.resetKey,
    };
  }

  try {
    const tokens = await changePassword(accessToken, {
      currentPassword,
      newPassword,
      newPasswordConfirm,
    });
    await setAuthCookies(tokens);
    return {
      success: true,
      message: "비밀번호를 변경했어요.",
      fieldErrors: {},
      resetKey: previousState.resetKey + 1,
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return {
        success: false,
        message: error.message,
        fieldErrors: error.fieldErrors,
        resetKey: previousState.resetKey,
      };
    }
    return {
      success: false,
      message: "비밀번호를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.",
      fieldErrors: {},
      resetKey: previousState.resetKey,
    };
  }
}
