"use server";

import { ApiRequestError, getRanking } from "@/lib/api";
import type { QuickSkinProfile } from "@/lib/quick-profile";
import type { Product } from "@/lib/types";

export type QuickRecommendationResult = {
  success: boolean;
  message: string;
  products: Product[];
};

const allowedSkinTypes = new Set(["건성", "지성", "복합성", "수부지", "중성", "민감"]);

export async function getQuickRecommendations(profile: QuickSkinProfile): Promise<QuickRecommendationResult> {
  if (!allowedSkinTypes.has(profile.skinType) || profile.concerns.length < 1 || profile.concerns.length > 3) {
    return { success: false, message: "피부 타입과 가장 중요한 고민을 다시 확인해 주세요.", products: [] };
  }
  try {
    const products = await getRanking(profile, 3);
    return {
      success: true,
      message: products.length ? "성분과 내 피부 신호를 함께 계산했어요." : "조건에 맞는 제품 자료를 준비하고 있어요.",
      products,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError ? error.message : "추천을 계산하지 못했어요. 잠시 후 다시 시도해 주세요.",
      products: [],
    };
  }
}
