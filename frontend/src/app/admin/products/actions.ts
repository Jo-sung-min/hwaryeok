"use server";

import { revalidatePath } from "next/cache";
import {
  ApiRequestError,
  createAdminProduct,
  deleteAdminProduct,
  getCurrentUser,
  removeAdminMfdsProductMatch,
  saveAdminMfdsProductMatch,
  saveAdminMfdsProductNoMatch,
  searchAdminMfdsProductCandidates,
  updateAdminProduct,
  updateAdminProductCoupangPartnersLink,
  updateAdminProductIngredients,
  uploadAdminProductImage,
  type AdminProductInput,
} from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import type { AdminMfdsProductMatch, MfdsProductCandidate } from "@/lib/types";

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

export type MfdsProductMatchActionState = {
  success: boolean;
  message: string;
  candidates?: MfdsProductCandidate[];
  match?: AdminMfdsProductMatch;
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

export async function saveCoupangPartnersLinkAction(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  try {
    const clear = formData.get("intent") === "clear";
    const url = clear ? undefined : String(formData.get("coupangPartnersUrl") ?? "").trim() || undefined;
    await updateAdminProductCoupangPartnersLink(authorization.accessToken, productId, url);
    revalidateProductPages(productId);
    return {
      success: true,
      message: url ? "쿠팡 파트너스 링크를 연결했어요." : "쿠팡 파트너스 링크를 해제했어요.",
    };
  } catch (error) {
    return productError(error, "쿠팡 파트너스 링크를 저장하지 못했어요.");
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

export async function searchMfdsProductCandidatesAction(
  productId: string,
  _previousState: MfdsProductMatchActionState,
  formData: FormData,
): Promise<MfdsProductMatchActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };
  const query = String(formData.get("query") ?? "").trim();
  if (query.length < 2) return { success: false, message: "두 글자 이상의 제품명을 입력해 주세요." };

  try {
    const candidates = await searchAdminMfdsProductCandidates(authorization.accessToken, productId, query, 5);
    return {
      success: true,
      message: candidates.length > 0 ? `식약처 품목 후보 ${candidates.length}건을 찾았어요.` : "일치하는 후보를 찾지 못했어요. 검색어를 줄여 다시 찾아보세요.",
      candidates,
    };
  } catch (error) {
    return mfdsMatchError(error, "식약처 품목 후보를 찾지 못했어요.");
  }
}

export async function saveMfdsProductMatchAction(
  productId: string,
  _previousState: MfdsProductMatchActionState,
  formData: FormData,
): Promise<MfdsProductMatchActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };
  const reportId = String(formData.get("reportId") ?? "").trim();
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  if (!reportId) return { success: false, message: "연결할 식약처 품목을 선택해 주세요." };
  if (reviewNote.length > 500) return { success: false, message: "검수 메모는 500자 이하로 입력해 주세요." };

  try {
    const match = await saveAdminMfdsProductMatch(authorization.accessToken, productId, reportId, reviewNote);
    revalidateProductPages(productId);
    return { success: true, message: "관리자 확인을 마치고 식약처 보고정보를 연결했어요.", match };
  } catch (error) {
    return mfdsMatchError(error, "식약처 보고정보를 연결하지 못했어요.");
  }
}

export async function removeMfdsProductMatchAction(
  productId: string,
  _previousState: MfdsProductMatchActionState,
  formData: FormData,
): Promise<MfdsProductMatchActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };
  if (formData.get("confirmation") !== productId) {
    return { success: false, message: "연결을 해제할 제품을 다시 확인해 주세요." };
  }
  try {
    await removeAdminMfdsProductMatch(authorization.accessToken, productId);
    revalidateProductPages(productId);
    return { success: true, message: "식약처 보고정보 연결을 해제했어요." };
  } catch (error) {
    return mfdsMatchError(error, "식약처 보고정보 연결을 해제하지 못했어요.");
  }
}

export async function saveMfdsProductNoMatchAction(
  productId: string,
  _previousState: MfdsProductMatchActionState,
  formData: FormData,
): Promise<MfdsProductMatchActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  if (reviewNote.length < 5) {
    return { success: false, message: "검색어 또는 확인 내용을 5자 이상 검수 메모에 입력해 주세요." };
  }
  if (reviewNote.length > 500) return { success: false, message: "검수 메모는 500자 이하로 입력해 주세요." };

  try {
    const match = await saveAdminMfdsProductNoMatch(authorization.accessToken, productId, reviewNote);
    revalidateProductPages(productId);
    return { success: true, message: "식약처 보고품목에 해당 항목이 없는 것으로 검수했어요.", match };
  } catch (error) {
    return mfdsMatchError(error, "식약처 품목 검수 상태를 저장하지 못했어요.");
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

function mfdsMatchError(error: unknown, fallback: string): MfdsProductMatchActionState {
  if (error instanceof ApiRequestError) return { success: false, message: error.message };
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

function revalidateProductPages(productId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/ranking");
  revalidatePath(`/products/${productId}`);
}
