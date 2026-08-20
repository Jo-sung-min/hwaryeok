"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, saveUserProfile } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

const allowedSkinTypes = new Set(["건성", "지성", "복합성", "수부지", "중성", "민감"]);
const allowedConcerns = new Set(["속건조", "민감", "모공", "붉은기", "피부 장벽", "각질", "칙칙함", "탄력", "속건조·당김", "유분·번들거림", "트러블·여드름", "블랙헤드·모공", "붉은기·민감", "장벽·각질", "잡티·칙칙함", "탄력·잔주름"]);
const allowedBalanceLevels = new Set(["LOW", "BALANCED", "HIGH"]);
const allowedSensitivityLevels = new Set(["LOW", "MEDIUM", "HIGH"]);
const allowedBreakoutFrequencies = new Set(["RARE", "OCCASIONAL", "FREQUENT"]);
const allowedCleansingTightness = new Set(["NONE", "SHORT", "LONG"]);
const allowedPoreLevels = new Set(["LOW", "MEDIUM", "HIGH"]);
const allowedTexturePreferences = new Set(["LIGHT", "BALANCED", "RICH"]);
const allowedRoutineComplexities = new Set(["MINIMAL", "STANDARD", "LAYERED"]);
const allowedSunscreenUsage = new Set(["RARE", "SOMETIMES", "DAILY"]);
const allowedReactionTriggers = new Set(["향료", "에탄올", "에센셜 오일", "각질 케어 성분", "레티노이드", "고함량 비타민C", "아직 모름"]);
const allowedBreakoutZones = new Set(["이마", "코", "볼", "턱·입가", "얼굴 전체"]);
const allowedEnvironments = new Set(["냉난방 건조", "마스크 장시간", "야외 활동", "미세먼지", "계절 변화", "수면 부족"]);
const allowedRoutineContexts = new Set(["면도 자주", "면도 후 붉어짐", "메이크업 자주", "메이크업 밀림", "이중 세안", "고기능성 성분 사용"]);

export type SkinProfileActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string>;
};

export async function saveSkinProfileAction(
  _previousState: SkinProfileActionState,
  formData: FormData,
): Promise<SkinProfileActionState> {
  const skinType = String(formData.get("skinType") ?? "").trim();
  const hydrationLevel = String(formData.get("hydrationLevel") ?? "").trim();
  const oilinessLevel = String(formData.get("oilinessLevel") ?? "").trim();
  const sensitivityLevel = String(formData.get("sensitivityLevel") ?? "").trim();
  const breakoutFrequency = String(formData.get("breakoutFrequency") ?? "").trim();
  const cleansingTightness = String(formData.get("cleansingTightness") ?? "").trim();
  const rednessFrequency = String(formData.get("rednessFrequency") ?? "").trim();
  const poreLevel = String(formData.get("poreLevel") ?? "").trim();
  const texturePreference = String(formData.get("texturePreference") ?? "").trim();
  const routineComplexity = String(formData.get("routineComplexity") ?? "").trim();
  const sunscreenUsage = String(formData.get("sunscreenUsage") ?? "").trim();
  const reactionTriggers = formData.getAll("reactionTriggers").map((value) => String(value).trim());
  const breakoutZones = formData.getAll("breakoutZones").map((value) => String(value).trim());
  const environments = formData.getAll("environments").map((value) => String(value).trim());
  const routineContexts = formData.getAll("routineContexts").map((value) => String(value).trim());
  const concerns = formData.getAll("concerns").map((value) => String(value).trim());
  const ingredientIds = formData.getAll("ingredientIds").map((value) => String(value).trim()).filter(Boolean);
  const fieldErrors: Record<string, string> = {};

  if (!allowedSkinTypes.has(skinType)) fieldErrors.skinType = "피부 타입을 선택해 주세요.";
  if (!allowedBalanceLevels.has(hydrationLevel)) fieldErrors.hydrationLevel = "수분 상태를 선택해 주세요.";
  if (!allowedBalanceLevels.has(oilinessLevel)) fieldErrors.oilinessLevel = "유분 상태를 선택해 주세요.";
  if (!allowedSensitivityLevels.has(sensitivityLevel)) fieldErrors.sensitivityLevel = "민감도를 선택해 주세요.";
  if (!allowedBreakoutFrequencies.has(breakoutFrequency)) fieldErrors.breakoutFrequency = "트러블 빈도를 선택해 주세요.";
  if (!allowedCleansingTightness.has(cleansingTightness)) fieldErrors.cleansingTightness = "세안 후 당김을 선택해 주세요.";
  if (!allowedBreakoutFrequencies.has(rednessFrequency)) fieldErrors.rednessFrequency = "붉어짐 빈도를 선택해 주세요.";
  if (!allowedPoreLevels.has(poreLevel)) fieldErrors.poreLevel = "모공 체감도를 선택해 주세요.";
  if (!allowedTexturePreferences.has(texturePreference)) fieldErrors.texturePreference = "선호 제형을 선택해 주세요.";
  if (!allowedRoutineComplexities.has(routineComplexity)) fieldErrors.routineComplexity = "평소 스킨케어 단계 수를 선택해 주세요.";
  if (!allowedSunscreenUsage.has(sunscreenUsage)) fieldErrors.sunscreenUsage = "자외선 차단 습관을 선택해 주세요.";
  if (reactionTriggers.length > 6 || reactionTriggers.some((value) => !allowedReactionTriggers.has(value)) || new Set(reactionTriggers).size !== reactionTriggers.length) fieldErrors.reactionTriggers = "반응 유발 요인을 다시 확인해 주세요.";
  if (breakoutZones.length > 5 || breakoutZones.some((value) => !allowedBreakoutZones.has(value)) || new Set(breakoutZones).size !== breakoutZones.length) fieldErrors.breakoutZones = "트러블 위치를 다시 확인해 주세요.";
  if (environments.length > 6 || environments.some((value) => !allowedEnvironments.has(value)) || new Set(environments).size !== environments.length) fieldErrors.environments = "생활 환경을 다시 확인해 주세요.";
  if (routineContexts.length > 6 || routineContexts.some((value) => !allowedRoutineContexts.has(value)) || new Set(routineContexts).size !== routineContexts.length) fieldErrors.routineContexts = "생활 습관을 다시 확인해 주세요.";
  if (concerns.length < 1 || concerns.length > 4 || concerns.some((concern) => !allowedConcerns.has(concern))) {
    fieldErrors.concerns = "피부 고민을 1~4개 선택해 주세요.";
  }
  if (new Set(concerns).size !== concerns.length) fieldErrors.concerns = "같은 피부 고민은 한 번만 선택할 수 있어요.";
  if (ingredientIds.length > 10) fieldErrors.ingredientIds = "잘 맞는 성분은 최대 10개까지 선택할 수 있어요.";
  if (new Set(ingredientIds).size !== ingredientIds.length) fieldErrors.ingredientIds = "같은 성분은 한 번만 선택할 수 있어요.";
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, message: "입력한 피부 정보를 다시 확인해 주세요.", fieldErrors };
  }

  const accessToken = await getActionAccessToken();
  if (!accessToken) {
    return { success: false, message: "로그인이 만료되었어요. 새로고침 후 다시 로그인해 주세요.", fieldErrors: {} };
  }

  try {
    await saveUserProfile(accessToken, {
        skinType,
        hydrationLevel: hydrationLevel as "LOW" | "BALANCED" | "HIGH",
        oilinessLevel: oilinessLevel as "LOW" | "BALANCED" | "HIGH",
        sensitivityLevel: sensitivityLevel as "LOW" | "MEDIUM" | "HIGH",
        breakoutFrequency: breakoutFrequency as "RARE" | "OCCASIONAL" | "FREQUENT",
        cleansingTightness: cleansingTightness as "NONE" | "SHORT" | "LONG",
        rednessFrequency: rednessFrequency as "RARE" | "OCCASIONAL" | "FREQUENT",
        poreLevel: poreLevel as "LOW" | "MEDIUM" | "HIGH",
        texturePreference: texturePreference as "LIGHT" | "BALANCED" | "RICH",
        routineComplexity: routineComplexity as "MINIMAL" | "STANDARD" | "LAYERED",
        sunscreenUsage: sunscreenUsage as "RARE" | "SOMETIMES" | "DAILY",
        reactionTriggers,
        breakoutZones,
        environments,
        routineContexts,
        concerns,
      }, ingredientIds);
    revalidatePath("/profile");
    revalidatePath("/my");
    revalidatePath("/ranking");
    revalidatePath("/compare");
    revalidatePath("/products");
    return { success: true, message: "피부 프로필을 저장했어요. 이제 모든 화력을 내 피부 기준으로 보여드려요.", fieldErrors: {} };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { success: false, message: error.message, fieldErrors: error.fieldErrors };
    }
    return { success: false, message: "피부 프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", fieldErrors: {} };
  }
}
