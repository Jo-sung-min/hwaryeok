"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, saveUserPreferredIngredients } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type IngredientPreferenceActionState = {
  success: boolean;
  message: string;
};

export async function saveIngredientPreferencesAction(
  _previousState: IngredientPreferenceActionState,
  formData: FormData,
): Promise<IngredientPreferenceActionState> {
  const ingredientIds = formData.getAll("ingredientIds").map(String);
  if (ingredientIds.length < 1) return { success: false, message: "관심 성분을 한 개 이상 선택해 주세요." };
  if (ingredientIds.length > 10) return { success: false, message: "관심 성분은 최대 10개까지 선택할 수 있어요." };
  if (new Set(ingredientIds).size !== ingredientIds.length) return { success: false, message: "같은 성분을 중복 선택할 수 없어요." };

  const accessToken = await getActionAccessToken();
  if (!accessToken) return { success: false, message: "로그인이 만료됐어요. 다시 로그인해 주세요." };

  try {
    await saveUserPreferredIngredients(accessToken, ingredientIds);
    revalidatePath("/my");
    return { success: true, message: `${ingredientIds.length}개의 관심 성분을 저장했어요.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError ? error.message : "관심 성분을 저장하지 못했어요.",
    };
  }
}
