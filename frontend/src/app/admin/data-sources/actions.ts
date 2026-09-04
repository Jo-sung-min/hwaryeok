"use server";

import { revalidatePath } from "next/cache";
import {
  ApiRequestError,
  getCurrentUser,
  importAdminKciaDictionary,
  removeAdminIngredientRegulationReview,
  saveAdminOfficialIngredientList,
  saveAdminIngredientRegulationReview,
  searchAdminIngredientRegulationCandidates,
  syncAdminMfdsData,
} from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import type { AdminIngredientRegulationReview, IngredientRegulationCandidate } from "@/lib/types";

export type DataSourceActionState = {
  success: boolean;
  message: string;
  details?: string[];
};

export type IngredientRegulationActionState = DataSourceActionState & {
  candidates?: IngredientRegulationCandidate[];
  review?: AdminIngredientRegulationReview;
  removedSourceRecordId?: string;
};

export async function syncMfdsAction(
  _previousState: DataSourceActionState,
  _formData: FormData,
): Promise<DataSourceActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  try {
    const result = await syncAdminMfdsData(authorization.accessToken);
    revalidatePath("/admin/data-sources");
    return {
      success: result.results.every((item) => item.status === "SUCCEEDED"),
      message: result.results.some((item) => item.status === "SUCCEEDED") ? "식약처 데이터 동기화를 마쳤어요." : "식약처 API 설정이 필요해요.",
      details: result.results.map((item) => item.message),
    };
  } catch (error) {
    return actionError(error, "식약처 데이터를 동기화하지 못했어요.");
  }
}

export async function importKciaDictionaryAction(
  _previousState: DataSourceActionState,
  formData: FormData,
): Promise<DataSourceActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  try {
    const file = formData.get("file");
    const rightsConfirmed = formData.get("rightsConfirmed") === "on";
    if (!(file instanceof File) || file.size === 0) return { success: false, message: "공식 성분사전 파일을 선택해 주세요." };
    if (file.size > 15 * 1024 * 1024) return { success: false, message: "성분사전 파일은 15MB 이하만 올릴 수 있어요." };
    const result = await importAdminKciaDictionary(authorization.accessToken, file, rightsConfirmed);
    revalidatePath("/admin/data-sources");
    revalidatePath("/admin/products");
    return { success: true, message: result.message };
  } catch (error) {
    return actionError(error, "성분사전 파일을 적재하지 못했어요.");
  }
}

export async function saveOfficialIngredientListAction(
  productId: string,
  _previousState: DataSourceActionState,
  formData: FormData,
): Promise<DataSourceActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  try {
    const result = await saveAdminOfficialIngredientList(authorization.accessToken, productId, {
      sourceUrl: String(formData.get("sourceUrl") ?? "").trim(),
      pageTitle: String(formData.get("pageTitle") ?? "").trim(),
      checkedAt: String(formData.get("checkedAt") ?? "").trim(),
      ingredientText: String(formData.get("ingredientText") ?? "").trim(),
      officialSourceConfirmed: formData.get("officialSourceConfirmed") === "on",
    });
    revalidatePath("/admin/data-sources");
    revalidatePath("/admin/products");
    revalidatePath(`/products/${productId}`);
    if (!result.published) {
      return {
        success: false,
        message: `${result.totalIngredientCount}개 중 ${result.matchedIngredientCount}개를 찾았어요. 미일치 성분을 사전에 추가한 뒤 다시 저장해 주세요.`,
        details: result.unmatchedIngredients.slice(0, 12),
      };
    }
    return { success: true, message: `브랜드 공식 전성분 ${result.totalIngredientCount}개를 검증·공개했어요.` };
  } catch (error) {
    return actionError(error, "브랜드 공식 전성분을 저장하지 못했어요.");
  }
}

export async function searchIngredientRegulationCandidatesAction(
  ingredientId: string,
  _previousState: IngredientRegulationActionState,
  formData: FormData,
): Promise<IngredientRegulationActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  const query = String(formData.get("query") ?? "").trim();
  if (query.length < 2) return { success: false, message: "두 글자 이상의 성분명을 입력해 주세요." };
  try {
    const candidates = await searchAdminIngredientRegulationCandidates(authorization.accessToken, ingredientId, query);
    return {
      success: true,
      message: candidates.length > 0
        ? `식약처 사용조건 후보 ${candidates.length}건을 찾았어요.`
        : "일치하는 식약처 사용조건 후보가 없어요.",
      candidates,
    };
  } catch (error) {
    return actionError(error, "식약처 사용조건 후보를 찾지 못했어요.");
  }
}

export async function saveIngredientRegulationReviewAction(
  ingredientId: string,
  sourceRecordId: string,
  _previousState: IngredientRegulationActionState,
  formData: FormData,
): Promise<IngredientRegulationActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== sourceRecordId) return { success: false, message: "연결할 식약처 원문을 다시 확인해 주세요." };
  try {
    const review = await saveAdminIngredientRegulationReview(
      authorization.accessToken,
      ingredientId,
      sourceRecordId,
      String(formData.get("reviewNote") ?? "").trim(),
    );
    revalidateIngredientRegulationPages(ingredientId);
    return { success: true, message: "관리자 검수를 마치고 사용자 화면에 공개했어요.", review };
  } catch (error) {
    return actionError(error, "식약처 사용조건을 연결하지 못했어요.");
  }
}

export async function removeIngredientRegulationReviewAction(
  ingredientId: string,
  sourceRecordId: string,
  _previousState: IngredientRegulationActionState,
  formData: FormData,
): Promise<IngredientRegulationActionState> {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== sourceRecordId) return { success: false, message: "해제할 연결을 다시 확인해 주세요." };
  try {
    await removeAdminIngredientRegulationReview(authorization.accessToken, ingredientId, sourceRecordId);
    revalidateIngredientRegulationPages(ingredientId);
    return { success: true, message: "검수 연결을 해제해 사용자 화면에서 내렸어요.", removedSourceRecordId: sourceRecordId };
  } catch (error) {
    return actionError(error, "식약처 사용조건 연결을 해제하지 못했어요.");
  }
}

function revalidateIngredientRegulationPages(ingredientId: string) {
  revalidatePath("/admin/data-sources");
  revalidatePath(`/ingredients/${ingredientId}`);
  revalidatePath("/products/[id]", "page");
}

async function authorizeAdmin(): Promise<{ accessToken: string } | { error: DataSourceActionState }> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { error: { success: false, message: "관리자 로그인이 필요해요." } };
  try {
    const user = await getCurrentUser(accessToken);
    if (user.role !== "ADMIN") return { error: { success: false, message: "관리자만 원천 데이터를 변경할 수 있어요." } };
    return { accessToken };
  } catch {
    return { error: { success: false, message: "로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요." } };
  }
}

function actionError(error: unknown, fallback: string): DataSourceActionState {
  if (error instanceof ApiRequestError) return { success: false, message: error.message };
  return { success: false, message: error instanceof Error ? error.message : fallback };
}
