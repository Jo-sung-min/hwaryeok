"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, getCurrentUser, uploadAdminProductImage } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type ProductImageActionState = {
  success: boolean;
  message: string;
};

export async function uploadProductImageAction(
  productId: string,
  _previousState: ProductImageActionState,
  formData: FormData,
): Promise<ProductImageActionState> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { success: false, message: "관리자 로그인이 필요해요." };

  try {
    const user = await getCurrentUser(accessToken);
    if (user.role !== "ADMIN") return { success: false, message: "관리자만 이미지를 등록할 수 있어요." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { success: false, message: "이미지 파일을 선택해 주세요." };
    if (file.size > 5 * 1024 * 1024) return { success: false, message: "이미지는 5MB 이하만 등록할 수 있어요." };
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { success: false, message: "PNG, JPG, WEBP 이미지만 등록할 수 있어요." };
    }

    await uploadAdminProductImage(accessToken, productId, file);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: true, message: "제품 이미지를 등록했어요." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError ? error.message : "제품 이미지를 등록하지 못했어요.",
    };
  }
}
