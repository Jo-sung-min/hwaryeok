"use server";

import { revalidatePath } from "next/cache";
import { addUserFavorite, ApiRequestError, removeUserFavorite } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type FavoriteActionResult = {
  success: boolean;
  favorited: boolean;
  requiresLogin: boolean;
  message: string;
};

export async function setFavoriteAction(
  productId: string,
  favorited: boolean,
): Promise<FavoriteActionResult> {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(productId)) {
    return { success: false, favorited: !favorited, requiresLogin: false, message: "제품 정보를 다시 확인해 주세요." };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return { success: false, favorited: !favorited, requiresLogin: true, message: "찜하려면 로그인이 필요해요." };
  }

  try {
    if (favorited) await addUserFavorite(accessToken, productId);
    else await removeUserFavorite(accessToken, productId);
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath("/my");
    return {
      success: true,
      favorited,
      requiresLogin: false,
      message: favorited ? "찜한 제품에 담았어요." : "찜한 제품에서 뺐어요.",
    };
  } catch (error) {
    return {
      success: false,
      favorited: !favorited,
      requiresLogin: error instanceof ApiRequestError && error.status === 401,
      message: error instanceof ApiRequestError ? error.message : "찜 상태를 저장하지 못했어요. 다시 시도해 주세요.",
    };
  }
}
