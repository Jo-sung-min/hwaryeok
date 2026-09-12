"use server";

import { revalidatePath } from "next/cache";
import {
  ApiRequestError,
  completeMyReviewerProfileImageUpload,
  createMyReviewerProfileImageUploadUrl,
  deleteMyReviewerProfileImage,
  saveMyReviewerProfile,
} from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import { normalizeActivityNickname, normalizeReviewerUrl, parseReviewerBioBlocks } from "@/lib/reviewer-profile";
import { profileImageUploadMetadataError, type ProfileImageUploadMetadata, type ProductImageUploadTicket } from "@/lib/product-image-upload";

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
  let nickname;
  let blogUrl;
  let instagramUrl;

  try { nickname = normalizeActivityNickname(formData.get("nickname")); }
  catch (error) { fieldErrors.nickname = errorMessage(error); }
  try { bioBlocks = parseReviewerBioBlocks(formData.get("bioBlocks")); }
  catch (error) { fieldErrors.bioBlocks = errorMessage(error); }
  try { blogUrl = normalizeReviewerUrl(formData.get("blogUrl"), "blog"); }
  catch (error) { fieldErrors.blogUrl = errorMessage(error); }
  try { instagramUrl = normalizeReviewerUrl(formData.get("instagramUrl"), "instagram"); }
  catch (error) { fieldErrors.instagramUrl = errorMessage(error); }

  if (Object.keys(fieldErrors).length || !bioBlocks || !nickname) {
    return { success: false, message: "활동명과 소개 정보를 다시 확인해 주세요.", fieldErrors };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return { success: false, message: "로그인이 만료되었어요. 새로고침 후 다시 로그인해 주세요.", fieldErrors: {} };
  }

  try {
    const profile = await saveMyReviewerProfile(accessToken, { nickname, bioBlocks, blogUrl: blogUrl ?? null, instagramUrl: instagramUrl ?? null });
    revalidateReviewerPages(profile.userId);
    return { success: true, message: "활동명과 소개를 저장했어요. 공개 페이지에도 바로 반영됩니다.", fieldErrors: {} };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { success: false, message: error.message, fieldErrors: error.fieldErrors };
    }
    return { success: false, message: "소개를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", fieldErrors: {} };
  }
}

export type ReviewerProfileImageActionState = {
  success: boolean;
  message: string;
  upload?: ProductImageUploadTicket;
};

export async function createReviewerProfileImageUploadUrlAction(
  metadata: ProfileImageUploadMetadata,
): Promise<ReviewerProfileImageActionState> {
  const validationError = profileImageUploadMetadataError(metadata);
  if (validationError) return { success: false, message: validationError };
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { success: false, message: "로그인 후 프로필 사진을 등록해 주세요." };
  try {
    const upload = await createMyReviewerProfileImageUploadUrl(accessToken, metadata);
    return { success: true, message: "사진 전송을 준비했어요.", upload };
  } catch (error) {
    return { success: false, message: error instanceof ApiRequestError ? error.message : "사진 전송을 준비하지 못했어요." };
  }
}

export async function deleteReviewerProfileImageAction(): Promise<ReviewerProfileImageActionState> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { success: false, message: "로그인 후 프로필 사진을 삭제해 주세요." };
  try {
    const profile = await deleteMyReviewerProfileImage(accessToken);
    revalidateReviewerPages(profile.userId);
    return { success: true, message: "프로필 사진을 삭제했어요." };
  } catch (error) {
    return { success: false, message: error instanceof ApiRequestError ? error.message : "프로필 사진을 삭제하지 못했어요." };
  }
}

export async function completeReviewerProfileImageUploadAction(
  objectKey: string,
): Promise<ReviewerProfileImageActionState> {
  if (typeof objectKey !== "string" || !objectKey.trim()) return { success: false, message: "업로드한 사진 정보를 다시 확인해 주세요." };
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { success: false, message: "로그인 후 프로필 사진을 등록해 주세요." };
  try {
    const profile = await completeMyReviewerProfileImageUpload(accessToken, objectKey);
    revalidateReviewerPages(profile.userId);
    return { success: true, message: "프로필 사진을 등록했어요." };
  } catch (error) {
    return { success: false, message: error instanceof ApiRequestError ? error.message : "프로필 사진을 등록하지 못했어요." };
  }
}

function revalidateReviewerPages(userId: string) {
  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath("/my/reviewer-profile");
  revalidatePath("/reviewers");
  revalidatePath(`/reviewers/${encodeURIComponent(userId)}`);
}

function errorMessage(error: unknown) {
  return error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "입력 내용을 다시 확인해 주세요.";
}
