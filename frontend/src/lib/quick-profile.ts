export const QUICK_PROFILE_STORAGE_KEY = "hwaryeok-quick-profile-v1";

export type QuickSkinProfile = {
  skinType: string;
  hydrationLevel: "LOW" | "BALANCED" | "HIGH";
  oilinessLevel: "LOW" | "BALANCED" | "HIGH";
  sensitivityLevel: "LOW" | "MEDIUM" | "HIGH";
  breakoutFrequency: "RARE" | "OCCASIONAL" | "FREQUENT";
  cleansingTightness: "NONE" | "SHORT" | "LONG";
  rednessFrequency: "RARE" | "OCCASIONAL" | "FREQUENT";
  poreLevel: "LOW" | "MEDIUM" | "HIGH";
  texturePreference: "LIGHT" | "BALANCED" | "RICH";
  routineComplexity: "MINIMAL" | "STANDARD" | "LAYERED";
  sunscreenUsage: "RARE" | "SOMETIMES" | "DAILY";
  concerns: string[];
  reactionTriggers: string[];
  environments: string[];
  routineContexts: string[];
};

export function isQuickSkinProfile(value: unknown): value is QuickSkinProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<QuickSkinProfile>;
  return typeof profile.skinType === "string"
    && Array.isArray(profile.concerns)
    && typeof profile.hydrationLevel === "string"
    && typeof profile.oilinessLevel === "string";
}
