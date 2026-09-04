"use server";

import { revalidatePath } from "next/cache";
import {
  ApiRequestError,
  createAdminPromotion,
  deleteAdminPromotion,
  getCurrentUser,
  updateAdminPromotion,
  type PromotionInput,
} from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type PromotionActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export async function createPromotionAction(
  _previousState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  try {
    const input = promotionInput(formData);
    await createAdminPromotion(authorization.accessToken, input);
    revalidatePromotionPages();
    return { success: true, message: "화력 추천 광고를 등록했어요." };
  } catch (error) {
    return actionError(error, "광고를 등록하지 못했어요.");
  }
}

export async function updatePromotionAction(
  promotionId: string,
  _previousState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  try {
    await updateAdminPromotion(authorization.accessToken, promotionId, promotionInput(formData));
    revalidatePromotionPages();
    return { success: true, message: "광고 정보를 저장했어요." };
  } catch (error) {
    return actionError(error, "광고를 저장하지 못했어요.");
  }
}

export async function deletePromotionAction(
  promotionId: string,
  _previousState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  if (formData.get("confirmation") !== promotionId) {
    return { success: false, message: "삭제할 광고 ID를 정확히 입력해 주세요." };
  }
  try {
    await deleteAdminPromotion(authorization.accessToken, promotionId);
    revalidatePromotionPages();
    return { success: true, message: "광고를 삭제했어요." };
  } catch (error) {
    return actionError(error, "광고를 삭제하지 못했어요.");
  }
}

function promotionInput(formData: FormData): PromotionInput {
  const status = String(formData.get("status") ?? "DRAFT");
  if (!["DRAFT", "ACTIVE", "PAUSED"].includes(status)) throw new Error("광고 상태를 다시 선택해 주세요.");
  const recommendationScore = Number(formData.get("recommendationScore"));
  if (!Number.isInteger(recommendationScore) || recommendationScore < 0 || recommendationScore > 100) {
    throw new Error("관리자 추천점수는 0~100 사이 정수로 입력해 주세요.");
  }
  return {
    productId: String(formData.get("productId") ?? "").trim(),
    recommendationScore,
    headline: String(formData.get("headline") ?? "").trim(),
    recommendationReason: String(formData.get("recommendationReason") ?? "").trim(),
    destinationUrl: String(formData.get("destinationUrl") ?? "").trim(),
    emergingBrand: formData.get("emergingBrand") === "on",
    status: status as PromotionInput["status"],
    startsOn: String(formData.get("startsOn") ?? "").trim() || undefined,
    endsOn: String(formData.get("endsOn") ?? "").trim() || undefined,
  };
}

async function authorizeAdmin(): Promise<{ accessToken: string } | { error: PromotionActionState }> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { error: { success: false, message: "관리자 로그인이 필요해요." } };
  try {
    const user = await getCurrentUser(accessToken);
    if (user.role !== "ADMIN") return { error: { success: false, message: "관리자만 광고를 관리할 수 있어요." } };
    return { accessToken };
  } catch {
    return { error: { success: false, message: "로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요." } };
  }
}

function actionError(error: unknown, fallback: string): PromotionActionState {
  if (error instanceof ApiRequestError) {
    return { success: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

function revalidatePromotionPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/promotions");
  revalidatePath("/promotions");
  revalidatePath("/");
}
