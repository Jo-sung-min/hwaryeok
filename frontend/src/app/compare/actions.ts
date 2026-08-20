"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, saveUserComparisonProducts } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type SaveComparisonResult = {
  success: boolean;
  requiresLogin: boolean;
  productIds: string[];
  message: string;
};

export async function saveComparisonAction(productIds: string[]): Promise<SaveComparisonResult> {
  const normalizedIds = productIds.filter((id) => /^[a-zA-Z0-9-]{1,64}$/.test(id));
  if (normalizedIds.length < 2 || normalizedIds.length > 3 || new Set(normalizedIds).size !== normalizedIds.length) {
    return {
      success: false,
      requiresLogin: false,
      productIds: [],
      message: "서로 다른 제품 2개 또는 3개를 선택해 주세요.",
    };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return {
      success: false,
      requiresLogin: true,
      productIds: [],
      message: "비교 제품을 저장하려면 로그인이 필요해요.",
    };
  }

  try {
    const result = await saveUserComparisonProducts(accessToken, normalizedIds);
    const savedIds = result.content.map((item) => item.product.id);
    revalidatePath("/compare");
    revalidatePath("/my");
    return {
      success: true,
      requiresLogin: false,
      productIds: savedIds,
      message: `비교 제품 ${savedIds.length}개를 내 계정에 저장했어요.`,
    };
  } catch (error) {
    return {
      success: false,
      requiresLogin: error instanceof ApiRequestError && error.status === 401,
      productIds: [],
      message: error instanceof ApiRequestError ? error.message : "비교 제품을 저장하지 못했어요. 다시 시도해 주세요.",
    };
  }
}
