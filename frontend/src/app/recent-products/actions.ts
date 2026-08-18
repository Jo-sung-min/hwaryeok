"use server";

import { recordUserRecentProduct } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export async function recordRecentProductAction(productId: string): Promise<void> {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(productId)) return;

  const accessToken = await getActionAccessToken();
  if (!accessToken) return;

  try {
    await recordUserRecentProduct(accessToken, productId);
  } catch {
    // 최근 본 기록은 제품 상세 이용을 막지 않는 보조 기능입니다.
  }
}
