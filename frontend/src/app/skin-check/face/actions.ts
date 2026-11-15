"use server";

import { ApiRequestError, getIngredientRecommendations, getProductPage } from "@/lib/api";
import { getOptionalSkinProfile } from "@/lib/auth-session";
import { buildFaceConcernProfile } from "@/lib/face-concern-profile";
import { findFaceSymptom } from "@/lib/face-concerns";
import type { IngredientRecommendation, Product } from "@/lib/types";

const PRODUCT_LIMIT = 6;
const CATEGORY_PRODUCT_LIMIT = 8;
const INGREDIENT_LIMIT = 4;

export type FaceConcernResult = {
  success: boolean;
  message: string;
  symptomId: string | null;
  /** 화력 고민으로 매칭했는지, 고민 코드가 없어 제품 종류로 보여 주는지 */
  basis: "concern" | "category";
  /** 저장된 피부 기준을 반영했는지 여부 */
  personalized: boolean;
  products: Product[];
  totalProducts: number;
  ingredients: IngredientRecommendation[];
};

function failure(symptomId: string | null, message: string): FaceConcernResult {
  return { success: false, message, symptomId, basis: "concern", personalized: false, products: [], totalProducts: 0, ingredients: [] };
}

/** 두피처럼 화력 고민 코드가 없는 증상은 맞춤 매칭 대신 해당 종류의 제품을 성분 화력 순으로 보여 준다. */
async function categoryRecommendations(symptomId: string, category: string): Promise<FaceConcernResult> {
  try {
    const page = await getProductPage({ category, size: CATEGORY_PRODUCT_LIMIT, sort: "score", direction: "desc" });
    return {
      success: true,
      message: page.content.length
        ? "두피 맞춤 추천은 준비 중이에요."
        : `${category} 제품을 준비 중이에요.`,
      symptomId,
      basis: "category",
      personalized: false,
      products: page.content,
      totalProducts: page.totalElements,
      ingredients: [],
    };
  } catch (error) {
    return failure(symptomId, error instanceof ApiRequestError ? error.message : "제품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

/** 저장된 피부 기준이 없으면 계산용 기본 피부 타입이 추천 근거로 보이지 않게 지운다. */
function withoutAssumedSkinType(item: IngredientRecommendation): IngredientRecommendation {
  const matchedBy = item.matchedBy.filter((label) => !label.startsWith("피부 타입 · "));
  if (matchedBy.length === item.matchedBy.length) return item;
  return { ...item, matchedBy, reason: item.ingredient.description };
}

/** 얼굴에서 고른 증상에 맞는 화장품과 성분을 기존 추천 API로 계산한다. */
export async function getFaceConcernRecommendations(symptomId: string): Promise<FaceConcernResult> {
  const symptom = findFaceSymptom(symptomId);
  if (!symptom) return failure(null, "증상을 다시 골라 주세요.");
  if (!symptom.concerns.length) {
    return symptom.productCategory
      ? categoryRecommendations(symptom.id, symptom.productCategory)
      : failure(symptom.id, "이 증상에 연결된 추천이 아직 없어요.");
  }

  const { profile, personalized } = buildFaceConcernProfile(symptom, await getOptionalSkinProfile());
  const [productResult, ingredientResult] = await Promise.allSettled([
    getProductPage({
      concern: symptom.concerns[0],
      // 피부 기준이 없으면 피부 타입을 비워 제품 점수가 특정 타입으로 치우치지 않게 한다.
      profile: personalized ? profile : { ...profile, skinType: null },
      size: PRODUCT_LIMIT,
      sort: "score",
      direction: "desc",
    }),
    getIngredientRecommendations(profile, [], INGREDIENT_LIMIT),
  ]);

  if (productResult.status === "rejected" && ingredientResult.status === "rejected") {
    const error = productResult.reason;
    return failure(symptom.id, error instanceof ApiRequestError ? error.message : "추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  const products = productResult.status === "fulfilled" ? productResult.value.content : [];
  const recommended = ingredientResult.status === "fulfilled" ? ingredientResult.value : [];
  return {
    success: true,
    message: productResult.status === "rejected"
      ? "성분은 찾았지만 화장품 목록은 잠시 불러오지 못했어요."
      : ingredientResult.status === "rejected"
        ? "화장품은 찾았지만 성분 추천은 잠시 불러오지 못했어요."
        : products.length ? "" : "맞는 화장품을 준비 중이에요.",
    symptomId: symptom.id,
    basis: "concern",
    personalized,
    products,
    totalProducts: productResult.status === "fulfilled" ? productResult.value.totalElements : 0,
    ingredients: personalized ? recommended : recommended.map(withoutAssumedSkinType),
  };
}
