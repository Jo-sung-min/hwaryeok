"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, saveMyReviewerProfile } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import { normalizeReviewerUrl, parseReviewerBioBlocks } from "@/lib/reviewer-profile";

export type ReviewerProfileActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string>;
};

export async function saveReviewerProfileAction(
  _previous: ReviewerProfileActionState,
  formData: FormData,
): Promise<ReviewerProfileActionState> {
  const fieldErrors: Record<string, string> = {};
  let bioBlocks;
  let blogUrl;
  let instagramUrl;

  try { bioBlocks = parseReviewerBioBlocks(formData.get("bioBlocks")); }
  catch (error) { fieldErrors.bioBlocks = errorMessage(error); }
  try { blogUrl = normalizeReviewerUrl(formData.get("blogUrl"), "blog"); }
  catch (error) { fieldErrors.blogUrl = errorMessage(error); }
  try { instagramUrl = normalizeReviewerUrl(formData.get("instagramUrl"), "instagram"); }
  catch (error) { fieldErrors.instagramUrl = errorMessage(error); }

  if (Object.keys(fieldErrors).length || !bioBlocks) {
    return { success: false, message: "소개와 연결 주소를 다시 확인해 주세요.", fieldErrors };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return { success: false, message: "로그인이 만료되었어요. 새로고침 후 다시 로그인해 주세요.", fieldErrors: {} };
  }

  try {
    const profile = await saveMyReviewerProfile(accessToken, { bioBlocks, blogUrl: blogUrl ?? null, instagramUrl: instagramUrl ?? null });
    revalidatePath("/my");
    revalidatePath("/my/reviewer-profile");
    revalidatePath(`/reviewers/${encodeURIComponent(profile.userId)}`);
    return { success: true, message: "소개를 저장했어요. 공개 소개페이지에도 바로 반영됩니다.", fieldErrors: {} };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { success: false, message: error.message, fieldErrors: error.fieldErrors };
    }
    return { success: false, message: "소개를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", fieldErrors: {} };
  }
}

function errorMessage(error: unknown) {
  return error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "입력 내용을 다시 확인해 주세요.";
}
