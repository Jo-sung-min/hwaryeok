"use server";

import { revalidatePath } from "next/cache";
import {
  ApiRequestError,
  completeAdminProductImageUpload,
  createAdminProduct,
  createAdminProductImageUploadUrl,
  deleteAdminProductIngredientAmount,
  deleteAdminProduct,
  getCurrentUser,
  removeAdminMfdsProductMatch,
  saveAdminMfdsProductMatch,
  saveAdminMfdsProductNoMatch,
  searchAdminMfdsProductCandidates,
  updateAdminProduct,
  updateAdminProductCoupangPartnersLink,
  updateAdminProductIngredientAmount,
  updateAdminProductIngredients,
  type AdminProductInput,
} from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import { productImageUploadMetadataError, type ProductImageUploadMetadata, type ProductImageUploadTicket } from "@/lib/product-image-upload";
import type { AdminMfdsProductMatch, MfdsProductCandidate } from "@/lib/types";

export type ProductActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ProductImageActionState = {
  success: boolean;
  message: string;
  upload?: ProductImageUploadTicket;
};

export type ProductIngredientsActionState = {
  success: boolean;
  message: string;
};

export type ProductIngredientAmountActionState = {
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

export async function createProductImageUploadUrlAction(
  productId: string,
  metadata: ProductImageUploadMetadata,
): Promise<ProductImageActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };
  const validationError = productImageUploadMetadataError(metadata);
  if (validationError) return { success: false, message: validationError };

  try {
    const upload = await createAdminProductImageUploadUrl(authorization.accessToken, productId, metadata);
    return { success: true, message: "이미지 전송을 준비했어요.", upload };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError ? error.message : "이미지 전송을 준비하지 못했어요.",
    };
  }
}

export async function completeProductImageUploadAction(
  productId: string,
  objectKey: string,
): Promise<ProductImageActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };
  if (typeof objectKey !== "string" || !objectKey.trim()) return { success: false, message: "업로드한 이미지 정보를 다시 확인해 주세요." };

  try {
    await completeAdminProductImageUpload(authorization.accessToken, productId, objectKey);
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
      const isKeyIngredient = record.isKeyIngredient === true;
      if (!ingredientId) throw new Error("선택하지 않은 성분이 있어요.");
      return { ingredientId, concentrationNote: concentrationNote || undefined, isKeyIngredient };
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

export async function saveProductIngredientAmountAction(
  productId: string,
  ingredientId: string,
  _previousState: ProductIngredientAmountActionState,
  formData: FormData,
): Promise<ProductIngredientAmountActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };

  try {
    const kind = oneOf(formData, "kind", ["EXACT", "RANGE", "MINIMUM", "MAXIMUM"] as const);
    const unit = oneOf(formData, "unit", ["PERCENT", "PPM", "PPB", "MG_PER_G", "MG_PER_ML"] as const);
    const basis = oneOf(formData, "basis", ["W_W", "W_V", "V_V", "UNSPECIFIED"] as const);
    const substanceBasis = oneOf(formData, "substanceBasis", ["PURE_INGREDIENT", "RAW_MATERIAL_COMPLEX", "DERIVATIVE_EQUIVALENT"] as const);
    const sourceType = oneOf(formData, "sourceType", ["BRAND_OFFICIAL", "PACKAGE_LABEL", "MFDS_FUNCTIONAL_REPORT", "TEST_REPORT"] as const);
    const verificationStatus = oneOf(formData, "verificationStatus", ["DRAFT", "VERIFIED", "STALE"] as const);
    const amount = positiveNumber(formData, "amount", "함량 수치");
    const maxValue = String(formData.get("maxAmount") ?? "").trim();
    const rangeMaximum = maxValue ? positiveNumber(formData, "maxAmount", "범위 최댓값") : undefined;
    if (kind === "RANGE" && (rangeMaximum === undefined || rangeMaximum <= amount)) {
      throw new Error("범위 함량은 최댓값을 시작값보다 크게 입력해 주세요.");
    }
    if (kind !== "RANGE" && rangeMaximum !== undefined) {
      throw new Error("범위 함량일 때만 최댓값을 입력할 수 있어요.");
    }

    const minAmount = kind === "MAXIMUM" ? undefined : amount;
    const maxAmount = kind === "EXACT" ? amount : kind === "RANGE" ? rangeMaximum : kind === "MAXIMUM" ? amount : undefined;

    await updateAdminProductIngredientAmount(authorization.accessToken, productId, ingredientId, {
      kind,
      minAmount,
      maxAmount,
      unit,
      basis,
      substanceBasis,
      rawClaimText: requiredText(formData, "rawClaimText", "공식 원문"),
      sourceType,
      sourceUrl: requiredText(formData, "sourceUrl", "출처 URL"),
      pageTitle: requiredText(formData, "pageTitle", "출처 페이지명"),
      sourceIngredientName: requiredText(formData, "sourceIngredientName", "출처 성분명"),
      checkedAt: requiredText(formData, "checkedAt", "확인일"),
      verificationStatus,
      reviewNote: String(formData.get("reviewNote") ?? "").trim() || undefined,
    });
    revalidateProductPages(productId);
    return { success: true, message: verificationStatus === "VERIFIED" ? "검증된 함량 근거를 공개했어요." : "함량 근거를 검수 상태로 저장했어요." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiRequestError || error instanceof Error ? error.message : "함량 근거를 저장하지 못했어요.",
    };
  }
}

export async function deleteProductIngredientAmountAction(
  productId: string,
  ingredientId: string,
  _previousState: ProductIngredientAmountActionState,
  formData: FormData,
): Promise<ProductIngredientAmountActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return { success: false, message: authorization.error.message };
  if (formData.get("confirmation") !== ingredientId) return { success: false, message: "삭제할 성분 함량을 다시 확인해 주세요." };
  try {
    await deleteAdminProductIngredientAmount(authorization.accessToken, productId, ingredientId);
    revalidateProductPages(productId);
    return { success: true, message: "함량 근거를 삭제했어요. 성분 연결은 유지됩니다." };
  } catch (error) {
    return { success: false, message: error instanceof ApiRequestError || error instanceof Error ? error.message : "함량 근거를 삭제하지 못했어요." };
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
  const netContentText = String(formData.get("netContentValue") ?? "").trim();
  const netContentUnit = String(formData.get("netContentUnit") ?? "").trim();
  const netContentValue = netContentText ? Number(netContentText) : undefined;
  if ((netContentText && !["ML", "G"].includes(netContentUnit)) || (!netContentText && netContentUnit)) {
    throw new Error("본품 순용량의 수치와 단위를 함께 입력해 주세요.");
  }
  if (netContentValue !== undefined && (!Number.isFinite(netContentValue) || netContentValue <= 0)) {
    throw new Error("본품 순용량은 0보다 큰 숫자로 입력해 주세요.");
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
    netContentValue,
    netContentUnit: netContentUnit ? netContentUnit as AdminProductInput["netContentUnit"] : undefined,
    tone: tone as AdminProductInput["tone"],
    tag: String(formData.get("tag") ?? "").trim() || undefined,
    publicationStatus: String(formData.get("publicationStatus") ?? "DRAFT") as AdminProductInput["publicationStatus"],
    sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || undefined,
    sourceCheckedAt: String(formData.get("sourceCheckedAt") ?? "").trim() || undefined,
  };
}

function oneOf<const T extends readonly string[]>(formData: FormData, name: string, options: T): T[number] {
  const value = String(formData.get(name) ?? "");
  if (!options.includes(value)) throw new Error("함량 입력값을 다시 확인해 주세요.");
  return value as T[number];
}

function positiveNumber(formData: FormData, name: string, label: string) {
  const rawValue = String(formData.get(name) ?? "").trim();
  const value = Number(rawValue);
  if (!rawValue || !Number.isFinite(value) || value <= 0) throw new Error(`${label}은 0보다 큰 숫자로 입력해 주세요.`);
  return value;
}

function requiredText(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${label}을 입력해 주세요.`);
  return value;
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
