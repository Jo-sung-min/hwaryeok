export const QUICK_PROFILE_STORAGE_KEY = "hwaryeok-quick-profile-v1";

export type QuickSkinProfile = {
  skinType: string;
  hydrationLevel: "LOW" | "BALANCED" | "HIGH";
  oilinessLevel: "LOW" | "BALANCED" | "HIGH";
  cheekOiliness: "LOW" | "BALANCED" | "HIGH";
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
  breakoutZones: string[];
  environments: string[];
  routineContexts: string[];
};

export function isQuickSkinProfile(value: unknown): value is QuickSkinProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  const enums: Record<string, string[]> = {
    skinType: ["건성", "지성", "복합성", "수부지", "중성", "민감"],
    hydrationLevel: ["LOW", "BALANCED", "HIGH"], oilinessLevel: ["LOW", "BALANCED", "HIGH"],
    cheekOiliness: ["LOW", "BALANCED", "HIGH"],
    sensitivityLevel: ["LOW", "MEDIUM", "HIGH"], poreLevel: ["LOW", "MEDIUM", "HIGH"],
    breakoutFrequency: ["RARE", "OCCASIONAL", "FREQUENT"], rednessFrequency: ["RARE", "OCCASIONAL", "FREQUENT"],
    cleansingTightness: ["NONE", "SHORT", "LONG"], texturePreference: ["LIGHT", "BALANCED", "RICH"],
    routineComplexity: ["MINIMAL", "STANDARD", "LAYERED"], sunscreenUsage: ["RARE", "SOMETIMES", "DAILY"],
  };
  if (!Object.entries(enums).every(([key, allowed]) => typeof profile[key] === "string" && allowed.includes(profile[key] as string))) return false;
  for (const key of ["concerns", "reactionTriggers", "breakoutZones", "environments", "routineContexts"]) {
    const items = profile[key];
    const max = key === "concerns" ? 4 : key === "breakoutZones" ? 5 : 10;
    if (!Array.isArray(items) || items.length > max || !items.every(item => typeof item === "string" && item.length > 0 && item.length <= 80) || new Set(items).size !== items.length) return false;
  }
  return (profile.concerns as string[]).length > 0;
}
