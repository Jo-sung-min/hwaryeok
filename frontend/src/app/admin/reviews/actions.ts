"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, deleteAdminReview, getCurrentUser } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type AdminReviewActionState = {
  success: boolean;
  message: string;
};

export async function deleteAdminReviewAction(
  reviewId: string,
  productId: string,
  authorId: string | null,
  sampleReview: boolean,
  _previousState: AdminReviewActionState,
  _formData: FormData,
): Promise<AdminReviewActionState> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { success: false, message: "관리자 로그인이 필요해요." };

  try {
    const user = await getCurrentUser(accessToken);
    if (user.role !== "ADMIN") return { success: false, message: "관리자만 리뷰를 삭제할 수 있어요." };

    await deleteAdminReview(accessToken, reviewId);
    revalidateReviewPages(productId, authorId);
    return { success: true, message: sampleReview ? "화면 예시 리뷰를 삭제했어요." : "사용자 리뷰를 삭제했어요." };
  } catch (error) {
    if (error instanceof ApiRequestError) return { success: false, message: error.message };
    return { success: false, message: "리뷰를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
}

function revalidateReviewPages(productId: string, authorId: string | null) {
  [
    "/",
    "/admin",
    "/admin/reviews",
    "/products",
    `/products/${encodeURIComponent(productId)}`,
    "/promotions",
    "/ranking",
    "/ranking/personal",
    "/ranking/rising",
    "/reviewers",
  ].forEach((path) => revalidatePath(path));
  if (authorId) revalidatePath(`/reviewers/${encodeURIComponent(authorId)}`);
}
