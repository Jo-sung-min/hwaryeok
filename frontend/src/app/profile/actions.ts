"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, saveUserSkinProfile } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

const allowedSkinTypes = new Set(["건성", "지성", "복합성", "수부지", "중성", "민감"]);
const allowedConcerns = new Set(["속건조", "민감", "모공", "붉은기", "피부 장벽", "각질", "칙칙함", "탄력"]);

export type SkinProfileActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string>;
};

export async function saveSkinProfileAction(
  _previousState: SkinProfileActionState,
  formData: FormData,
): Promise<SkinProfileActionState> {
  const skinType = String(formData.get("skinType") ?? "").trim();
  const concerns = formData.getAll("concerns").map((value) => String(value).trim());
  const fieldErrors: Record<string, string> = {};

  if (!allowedSkinTypes.has(skinType)) fieldErrors.skinType = "피부 타입을 선택해 주세요.";
  if (concerns.length < 1 || concerns.length > 4 || concerns.some((concern) => !allowedConcerns.has(concern))) {
    fieldErrors.concerns = "피부 고민을 1~4개 선택해 주세요.";
  }
  if (new Set(concerns).size !== concerns.length) fieldErrors.concerns = "같은 피부 고민은 한 번만 선택할 수 있어요.";
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, message: "입력한 피부 정보를 다시 확인해 주세요.", fieldErrors };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return { success: false, message: "로그인이 만료되었어요. 새로고침 후 다시 로그인해 주세요.", fieldErrors: {} };
  }

  try {
    await saveUserSkinProfile(accessToken, { skinType, concerns });
    revalidatePath("/profile");
    revalidatePath("/ranking");
    revalidatePath("/compare");
    return { success: true, message: "피부 프로필을 저장했어요. 이제 모든 화력을 내 피부 기준으로 보여드려요.", fieldErrors: {} };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { success: false, message: error.message, fieldErrors: error.fieldErrors };
    }
    return { success: false, message: "피부 프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", fieldErrors: {} };
  }
}
