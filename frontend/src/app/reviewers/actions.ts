"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, rateReviewFirepower } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import type { ReviewCommunityRating } from "@/lib/types";

export type ReviewRatingState = { message?: string; success?: boolean; rating?: ReviewCommunityRating };

export async function rateReviewAction(
  reviewId: string,
  productId: string,
  authorId: string,
  _previous: ReviewRatingState,
  form: FormData,
): Promise<ReviewRatingState> {
  const intent = form.get("intent");
  const score = intent === "remove" ? null : Number(form.get("score"));
  if (intent !== "remove" && intent !== "rate") return { message: "평가 방법을 다시 선택해 주세요." };
  if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) {
    return { message: "도움이 된 정도를 1~5점으로 선택해 주세요." };
  }
  const token = await getActionAccessToken();
  if (!token) return { message: "로그인 후 리뷰 화력을 평가할 수 있어요." };
  try {
    const rating = await rateReviewFirepower(token, reviewId, score);
    revalidatePath(`/products/${encodeURIComponent(productId)}`);
    revalidatePath(`/reviewers/${encodeURIComponent(authorId)}`);
    revalidatePath("/reviewers");
    return { success: true, rating, message: score === null ? "내 평가를 취소했어요." : "리뷰 화력 평가를 반영했어요." };
  } catch (error) {
    return { message: error instanceof ApiRequestError ? error.message : "평가를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
}
