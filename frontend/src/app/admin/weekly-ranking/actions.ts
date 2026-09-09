"use server";

import { revalidatePath } from "next/cache";
import {
  ApiRequestError,
  getCurrentUser,
  resetAdminWeeklyRanking,
  updateAdminWeeklyRanking,
} from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type WeeklyRankingActionState = {
  success: boolean;
  message: string;
};

export async function updateWeeklyRankingAction(
  _previousState: WeeklyRankingActionState,
  formData: FormData,
): Promise<WeeklyRankingActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  const productIds = formData.getAll("productId")
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (productIds.length < 1 || productIds.length > 10) {
    return { success: false, message: "배너 상품은 1개 이상 10개 이하로 선택해 주세요." };
  }
  if (new Set(productIds).size !== productIds.length) {
    return { success: false, message: "같은 상품을 두 순위에 중복으로 넣을 수 없어요." };
  }

  try {
    await updateAdminWeeklyRanking(authorization.accessToken, productIds);
    revalidateWeeklyRankingPages();
    return { success: true, message: "이번 주 배너의 상품과 순서를 저장했어요." };
  } catch (error) {
    return actionError(error, "주간 랭킹을 저장하지 못했어요.");
  }
}

export async function resetWeeklyRankingAction(
  _previousState: WeeklyRankingActionState,
  _formData: FormData,
): Promise<WeeklyRankingActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  try {
    await resetAdminWeeklyRanking(authorization.accessToken);
    revalidateWeeklyRankingPages();
    return { success: true, message: "평가 개수와 평가점수로 계산한 자동 순위로 되돌렸어요." };
  } catch (error) {
    return actionError(error, "자동 순위로 되돌리지 못했어요.");
  }
}

async function authorizeAdmin(): Promise<{ accessToken: string } | { error: WeeklyRankingActionState }> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { error: { success: false, message: "관리자 로그인이 필요해요." } };
  try {
    const user = await getCurrentUser(accessToken);
    if (user.role !== "ADMIN") return { error: { success: false, message: "관리자만 주간 랭킹을 관리할 수 있어요." } };
    return { accessToken };
  } catch {
    return { error: { success: false, message: "로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요." } };
  }
}

function actionError(error: unknown, fallback: string): WeeklyRankingActionState {
  return {
    success: false,
    message: error instanceof ApiRequestError ? error.message : error instanceof Error ? error.message : fallback,
  };
}

function revalidateWeeklyRankingPages() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/weekly-ranking");
}
