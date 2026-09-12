"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, getIngredientRecommendations, getRanking, saveUserProfile, saveUserSkinProfile } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import { isQuickSkinProfile, type QuickSkinProfile } from "@/lib/quick-profile";
import type { IngredientRecommendation, Product } from "@/lib/types";

export type QuickRecommendationResult = {
  success: boolean;
  message: string;
  products: Product[];
  ingredients: IngredientRecommendation[];
};

export type SkinCheckSaveResult = {
  success: boolean;
  message: string;
  profileUpdatedAt?: string | null;
  preferredIngredientIds?: string[] | null;
};

function validIngredientIds(values: string[]) {
  return values.length <= 10
    && new Set(values).size === values.length
    && values.every((value) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(value));
}

export async function getQuickRecommendations(profile: QuickSkinProfile, preferredIngredientIds: string[] = []): Promise<QuickRecommendationResult> {
  if (!isQuickSkinProfile(profile)) {
    return { success: false, message: "피부 타입과 가장 중요한 고민을 다시 확인해 주세요.", products: [], ingredients: [] };
  }
  if (!validIngredientIds(preferredIngredientIds)) {
    return { success: false, message: "잘 맞았던 성분 선택을 다시 확인해 주세요.", products: [], ingredients: [] };
  }
  const [productResult, ingredientResult] = await Promise.allSettled([
    getRanking(profile, 3),
    getIngredientRecommendations(profile, preferredIngredientIds, 4),
  ]);
  const products = productResult.status === "fulfilled" ? productResult.value : [];
  const ingredients = ingredientResult.status === "fulfilled" ? ingredientResult.value : [];
  if (productResult.status === "rejected" && ingredientResult.status === "rejected") {
    const error = productResult.reason;
    return {
      success: false,
      message: error instanceof ApiRequestError ? error.message : "추천을 계산하지 못했어요. 잠시 후 다시 시도해 주세요.",
      products: [],
      ingredients: [],
    };
  }
  return {
    success: productResult.status === "fulfilled",
    message: productResult.status === "rejected"
      ? "추천 성분은 찾았지만 제품 목록은 잠시 불러오지 못했어요."
      : products.length ? "저장된 성분 경험과 지금 답한 피부 신호를 함께 계산했어요." : "조건에 맞는 제품 자료를 준비하고 있어요.",
    products,
    ingredients,
  };
}

export async function saveSkinCheckProfile(profile: QuickSkinProfile, preferredIngredientIds: string[] | null): Promise<SkinCheckSaveResult> {
  if (!isQuickSkinProfile(profile) || (preferredIngredientIds !== null && !validIngredientIds(preferredIngredientIds))) {
    return { success: false, message: "피부 답변과 성분 선택을 다시 확인해 주세요." };
  }
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { success: false, message: "로그인 후 결과를 저장할 수 있어요." };

  try {
    const saved = preferredIngredientIds === null
      ? { skinProfile: await saveUserSkinProfile(accessToken, profile), preferredIngredientIds: null }
      : await saveUserProfile(accessToken, profile, preferredIngredientIds).then((response) => ({
          skinProfile: response.skinProfile,
          preferredIngredientIds: response.preferredIngredients.content.map(({ ingredient }) => ingredient.id),
        }));
    for (const path of ["/skin-check", "/my", "/ranking", "/ranking/personal", "/compare", "/products"]) revalidatePath(path);
    return {
      success: true,
      message: preferredIngredientIds === null
        ? "피부 답변을 저장했어요. 기존 성분 선택은 그대로 유지했어요."
        : "피부타입과 추천에 쓰는 성분 기준을 함께 저장했어요.",
      profileUpdatedAt: saved.skinProfile.updatedAt ?? null,
      preferredIngredientIds: saved.preferredIngredientIds,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError ? error.message : "결과를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
