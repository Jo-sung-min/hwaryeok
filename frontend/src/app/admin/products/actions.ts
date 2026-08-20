"use server";

import { revalidatePath } from "next/cache";
import {
  ApiRequestError,
  createAdminProduct,
  deleteAdminProduct,
  getCurrentUser,
  updateAdminProduct,
  updateAdminProductIngredients,
  uploadAdminProductImage,
  type AdminProductInput,
} from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type ProductActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ProductImageActionState = {
  success: boolean;
  message: string;
};

export type ProductIngredientsActionState = {
  success: boolean;
  message: string;
};

export async function createProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  try {
    const input = productInput(formData);
    await createAdminProduct(authorization.accessToken, input);
    revalidateProductPages(input.id);
    return { success: true, message: `${input.name} 제품을 등록했어요.` };
  } catch (error) {
    return productError(error, "제품을 등록하지 못했어요.");
  }
}

export async function updateProductAction(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  try {
    const input = productInput(formData);
    await updateAdminProduct(authorization.accessToken, productId, input);
    revalidateProductPages(productId);
    return { success: true, message: "제품 정보를 저장했어요." };
  } catch (error) {
    return productError(error, "제품 정보를 저장하지 못했어요.");
  }
}

export async function deleteProductAction(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  if (formData.get("confirmation") !== productId) {
    return { success: false, message: "삭제할 제품을 다시 확인해 주세요." };
  }

  try {
    await deleteAdminProduct(authorization.accessToken, productId);
    revalidateProductPages(productId);
    return { success: true, message: "제품을 삭제했어요." };
  } catch (error) {
    return productError(error, "제품을 삭제하지 못했어요.");
  }
}

export async function uploadProductImageAction(
  productId: string,
  _previousState: ProductImageActionState,
  formData: FormData,
): Promise<ProductImageActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };

  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { success: false, message: "이미지 파일을 선택해 주세요." };
    if (file.size > 5 * 1024 * 1024) return { success: false, message: "이미지는 5MB 이하만 등록할 수 있어요." };
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { success: false, message: "PNG, JPG, WEBP 이미지만 등록할 수 있어요." };
    }

    await uploadAdminProductImage(authorization.accessToken, productId, file);
    revalidateProductPages(productId);
    return { success: true, message: "제품 이미지를 등록했어요." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError ? error.message : "제품 이미지를 등록하지 못했어요.",
    };
  }
}

export async function saveProductIngredientsAction(
  productId: string,
  _previousState: ProductIngredientsActionState,
  formData: FormData,
): Promise<ProductIngredientsActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };

  try {
    const parsed = JSON.parse(String(formData.get("ingredients") ?? "[]")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("성분 목록을 다시 확인해 주세요.");
    const ingredients = parsed.map((item) => {
      if (!item || typeof item !== "object") throw new Error("성분 목록을 다시 확인해 주세요.");
      const record = item as Record<string, unknown>;
      const ingredientId = String(record.ingredientId ?? "").trim();
      const concentrationNote = String(record.concentrationNote ?? "").trim();
      if (!ingredientId) throw new Error("선택하지 않은 성분이 있어요.");
      return { ingredientId, concentrationNote: concentrationNote || undefined };
    });
    await updateAdminProductIngredients(authorization.accessToken, productId, ingredients);
    revalidateProductPages(productId);
    return { success: true, message: `성분 ${ingredients.length}개를 저장했어요.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError || error instanceof Error ? error.message : "성분을 저장하지 못했어요.",
    };
  }
}

function productInput(formData: FormData): AdminProductInput {
  const tone = String(formData.get("tone") ?? "");
  if (!["peach", "sage", "sand", "rose", "blue"].includes(tone)) {
    throw new Error("대표 색상을 다시 선택해 주세요.");
  }
  return {
    id: String(formData.get("id") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    baseScore: Number(formData.get("baseScore")),
    benefit: String(formData.get("benefit") ?? "").trim(),
    subBenefit: String(formData.get("subBenefit") ?? "").trim(),
    price: Number(formData.get("price")),
    tone: tone as AdminProductInput["tone"],
    tag: String(formData.get("tag") ?? "").trim() || undefined,
    publicationStatus: String(formData.get("publicationStatus") ?? "DRAFT") as AdminProductInput["publicationStatus"],
    sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || undefined,
    sourceCheckedAt: String(formData.get("sourceCheckedAt") ?? "").trim() || undefined,
  };
}

async function authorizeAdmin(): Promise<{ accessToken: string } | { error: ProductActionState }> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { error: { success: false, message: "관리자 로그인이 필요해요." } };
  try {
    const user = await getCurrentUser(accessToken);
    if (user.role !== "ADMIN") {
      return { error: { success: false, message: "관리자만 상품 정보를 변경할 수 있어요." } };
    }
    return { accessToken };
  } catch {
    return { error: { success: false, message: "로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요." } };
  }
}

function productError(error: unknown, fallback: string): ProductActionState {
  if (error instanceof ApiRequestError) {
    return { success: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

function revalidateProductPages(productId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/ranking");
  revalidatePath(`/products/${productId}`);
}
