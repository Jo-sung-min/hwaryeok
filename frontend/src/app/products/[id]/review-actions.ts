"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, createProductReview } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import type { ReviewDetail } from "@/lib/types";

const allowedSkinTypes = new Set(["건성", "지성", "복합성", "수부지", "중성", "민감", "민감성"]);
const allowedUsagePeriods = new Set<ReviewDetail["usagePeriod"]>([
  "ONE_WEEK",
  "TWO_WEEKS",
  "ONE_MONTH",
  "THREE_MONTHS",
  "OVER_SIX_MONTHS",
]);

export type ReviewActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export async function createReviewAction(
  productId: string,
  criteriaIds: string[],
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const content = String(formData.get("content") ?? "").trim();
  const skinType = String(formData.get("skinType") ?? "").trim();
  const usagePeriod = String(formData.get("usagePeriod") ?? "").trim() as ReviewDetail["usagePeriod"];
  const repurchaseValue = String(formData.get("repurchaseYn") ?? "");
  const fieldErrors: Record<string, string> = {};

  if (content.length < 10 || content.length > 2000) fieldErrors.content = "리뷰는 10자 이상 2,000자 이하로 입력해 주세요.";
  if (!allowedSkinTypes.has(skinType)) fieldErrors.skinType = "피부 타입을 선택해 주세요.";
  if (!allowedUsagePeriods.has(usagePeriod)) fieldErrors.usagePeriod = "사용 기간을 선택해 주세요.";
  if (repurchaseValue !== "true" && repurchaseValue !== "false") fieldErrors.repurchaseYn = "재구매 의향을 선택해 주세요.";

  const scores = criteriaIds.map((criteriaId) => ({
    criteriaId,
    score: Number(formData.get(`score_${criteriaId}`)),
  }));
  if (scores.some(({ score }) => !Number.isInteger(score) || score < 1 || score > 5)) {
    fieldErrors.scores = "모든 평가 항목의 점수를 선택해 주세요.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, message: "입력한 리뷰를 다시 확인해 주세요.", fieldErrors };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return { success: false, message: "로그인이 만료되었어요. 다시 로그인해 주세요." };
  }

  try {
    await createProductReview(accessToken, productId, {
      content,
      skinType,
      usagePeriod,
      repurchaseYn: repurchaseValue === "true",
      scores,
    });
    revalidatePath(`/products/${productId}`);
    return { success: true, message: "리뷰를 등록했어요. 항목별 점수와 리뷰점수에 바로 반영했어요." };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { success: false, message: error.message, fieldErrors: error.fieldErrors };
    }
    return { success: false, message: "리뷰를 등록하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
}
