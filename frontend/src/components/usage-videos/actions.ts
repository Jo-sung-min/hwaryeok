"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, getCurrentUser } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import { createUsageVideo, deleteMyUsageVideo, moderateUsageVideo, updateMyUsageVideo } from "@/lib/usage-video-api";
import type { UsageVideoInput, UsageVideoModerationInput } from "@/lib/usage-video-types";

export type UsageVideoActionState = { success: boolean; message: string; fieldErrors?: Record<string, string>; values?: UsageVideoInput };

function readInput(formData: FormData): UsageVideoInput {
  if (formData.get("permission") !== "on") throw new Error("본인의 채널 또는 공유 권한이 있는 영상인지 확인해 주세요.");
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  return { title: value("title"), videoUrl: value("videoUrl"), channelName: value("channelName"), channelUrl: value("channelUrl"), description: value("description") };
}

function actionError(error: unknown): UsageVideoActionState {
  if (error instanceof ApiRequestError) return { success: false, message: error.message, fieldErrors: error.fieldErrors };
  if (error instanceof TypeError) return { success: false, message: "서버에 연결하지 못했어요. 입력 내용을 확인하고 잠시 후 다시 시도해 주세요." };
  return { success: false, message: error instanceof Error ? error.message : "요청을 처리하지 못했어요. 다시 시도해 주세요." };
}

function submittedValues(formData: FormData): UsageVideoInput {
  const value = (name: string) => String(formData.get(name) ?? "");
  return { title: value("title"), videoUrl: value("videoUrl"), channelName: value("channelName"), channelUrl: value("channelUrl"), description: value("description") };
}

function revalidateVideoPages(productId?: string) {
  revalidatePath("/my/usage-videos");
  revalidatePath("/admin/usage-videos");
  if (productId) {
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/products/${productId}/usage-videos`);
  } else {
    revalidatePath("/products/[id]", "page");
    revalidatePath("/products/[id]/usage-videos", "page");
  }
}

export async function submitUsageVideoAction(productId: string, _previous: UsageVideoActionState, formData: FormData): Promise<UsageVideoActionState> {
  const token = await getActionAccessToken();
  if (!token) return { success: false, message: "로그인 후 사용법 영상을 등록할 수 있어요.", values: submittedValues(formData) };
  try {
    const video = await createUsageVideo(token, productId, readInput(formData));
    revalidateVideoPages(video.productId);
    return { success: true, message: "영상을 접수했어요. 관리자 승인 후 제품 페이지에 노출돼요. 내 영상 관리에서 진행 상태를 확인하세요." };
  } catch (error) { return { ...actionError(error), values: submittedValues(formData) }; }
}

export async function editUsageVideoAction(id: string, _previous: UsageVideoActionState, formData: FormData): Promise<UsageVideoActionState> {
  const token = await getActionAccessToken();
  if (!token) return { success: false, message: "다시 로그인해 주세요.", values: submittedValues(formData) };
  try {
    const video = await updateMyUsageVideo(token, id, readInput(formData));
    revalidateVideoPages(video.productId);
    return { success: true, message: "수정했어요. 기존 노출은 중단되며 다시 검토 후 승인되어야 노출돼요." };
  } catch (error) { return { ...actionError(error), values: submittedValues(formData) }; }
}

export async function deleteUsageVideoAction(id: string, _previous: UsageVideoActionState, formData: FormData): Promise<UsageVideoActionState> {
  const token = await getActionAccessToken();
  if (!token) return { success: false, message: "다시 로그인해 주세요." };
  if (formData.get("confirmDelete") !== "on") return { success: false, message: "등록 삭제 확인을 선택해 주세요." };
  try {
    await deleteMyUsageVideo(token, id);
    revalidateVideoPages();
    return { success: true, message: "화력에 등록한 영상 링크를 삭제했어요. 유튜브 원본 영상은 삭제되지 않아요." };
  } catch (error) { return actionError(error); }
}

export async function moderateUsageVideoAction(id: string, _previous: UsageVideoActionState, formData: FormData): Promise<UsageVideoActionState> {
  const token = await getActionAccessToken();
  if (!token) return { success: false, message: "관리자 로그인이 필요해요." };
  try {
    const user = await getCurrentUser(token);
    if (user.role !== "ADMIN") return { success: false, message: "관리자만 영상 노출을 변경할 수 있어요." };
    const status = String(formData.get("status") ?? "");
    if (!["APPROVED", "REJECTED", "HIDDEN"].includes(status)) throw new Error("노출 상태를 선택해 주세요.");
    const displayOrder = Number(formData.get("displayOrder"));
    if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 100000) throw new Error("노출 순서는 0~100000 사이 정수로 입력해 주세요.");
    const video = await moderateUsageVideo(token, id, {
      status: status as UsageVideoModerationInput["status"],
      featured: formData.get("featured") === "on",
      displayOrder,
      moderationNote: String(formData.get("moderationNote") ?? "").trim(),
    });
    revalidateVideoPages(video.productId);
    return { success: true, message: status === "APPROVED" ? "노출을 승인했어요. 공개 제품의 사용법에 표시돼요." : "노출을 중단하고 검토 결과를 저장했어요." };
  } catch (error) { return actionError(error); }
}
