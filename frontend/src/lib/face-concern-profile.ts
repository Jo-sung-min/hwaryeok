import type { SkinProfile } from "./api";
import type { FaceSymptom } from "./face-concerns";
import type { QuickSkinProfile } from "./quick-profile";

// 피부 기준을 저장하지 않은 사용자에게 쓰는 치우치지 않은 기준.
// 선케어를 DAILY로 두어 증상과 무관한 "선케어 습관" 신호가 추천에 끼어들지 않게 한다.
const NEUTRAL_PROFILE: QuickSkinProfile = {
  skinType: "중성",
  hydrationLevel: "BALANCED",
  oilinessLevel: "BALANCED",
  cheekOiliness: "BALANCED",
  sensitivityLevel: "LOW",
  breakoutFrequency: "RARE",
  cleansingTightness: "NONE",
  rednessFrequency: "RARE",
  poreLevel: "LOW",
  texturePreference: "BALANCED",
  routineComplexity: "STANDARD",
  sunscreenUsage: "DAILY",
  concerns: [],
  reactionTriggers: [],
  breakoutZones: [],
  environments: [],
  routineContexts: [],
};

const SKIN_TYPES = ["건성", "지성", "복합성", "수부지", "중성", "민감"];

export type FaceConcernProfile = {
  profile: QuickSkinProfile;
  /** 저장된 피부 기준을 바탕으로 계산했는지 여부 */
  personalized: boolean;
};

/**
 * 고른 증상을 추천 API가 받는 피부 기준으로 바꾼다.
 * 저장된 피부 기준이 있으면 피부 타입·반응 성분·생활 환경은 그대로 두고,
 * 고민은 지금 고른 증상으로 바꾼 뒤 증상이 알려 주는 신호를 덮어쓴다.
 */
export function buildFaceConcernProfile(symptom: FaceSymptom, saved: SkinProfile | null): FaceConcernProfile {
  const personalized = Boolean(saved?.configured && saved.skinType && SKIN_TYPES.includes(saved.skinType));
  const base: QuickSkinProfile = personalized && saved
    ? {
        skinType: saved.skinType!,
        hydrationLevel: saved.hydrationLevel ?? NEUTRAL_PROFILE.hydrationLevel,
        oilinessLevel: saved.oilinessLevel ?? NEUTRAL_PROFILE.oilinessLevel,
        cheekOiliness: saved.cheekOiliness ?? NEUTRAL_PROFILE.cheekOiliness,
        sensitivityLevel: saved.sensitivityLevel ?? NEUTRAL_PROFILE.sensitivityLevel,
        breakoutFrequency: saved.breakoutFrequency ?? NEUTRAL_PROFILE.breakoutFrequency,
        cleansingTightness: saved.cleansingTightness ?? NEUTRAL_PROFILE.cleansingTightness,
        rednessFrequency: saved.rednessFrequency ?? NEUTRAL_PROFILE.rednessFrequency,
        poreLevel: saved.poreLevel ?? NEUTRAL_PROFILE.poreLevel,
        texturePreference: saved.texturePreference ?? NEUTRAL_PROFILE.texturePreference,
        routineComplexity: saved.routineComplexity ?? NEUTRAL_PROFILE.routineComplexity,
        sunscreenUsage: saved.sunscreenUsage ?? NEUTRAL_PROFILE.sunscreenUsage,
        concerns: [],
        reactionTriggers: [...new Set(saved.reactionTriggers)].slice(0, 6),
        breakoutZones: [...new Set(saved.breakoutZones)].slice(0, 5),
        environments: [...new Set(saved.environments)].slice(0, 6),
        routineContexts: [...new Set(saved.routineContexts)].slice(0, 6),
      }
    : { ...NEUTRAL_PROFILE };

  const { breakoutZones: signalZones = [], ...scalarSignals } = symptom.signals;
  return {
    personalized,
    profile: {
      ...base,
      ...scalarSignals,
      concerns: [...new Set(symptom.concerns)].slice(0, 4),
      breakoutZones: [...new Set([...signalZones, ...base.breakoutZones])].slice(0, 5),
    },
  };
}
