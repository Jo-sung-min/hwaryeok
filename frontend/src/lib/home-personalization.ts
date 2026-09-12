import type { SkinProfile } from "@/lib/api";

export type HomeSkinProfileChip = { label: string; value: string };

export function homeSkinSummaryHref(hasGeneratedReport: boolean, hasSavedProfile: boolean) {
  if (hasGeneratedReport) return "/skin-check?step=result";
  return hasSavedProfile ? "/skin-check" : "/skin-check?step=review";
}

const hydrationLabels = { LOW: "수분 부족", BALANCED: "수분 균형", HIGH: "수분 높음" };
const oilinessLabels = { LOW: "유분 적음", BALANCED: "유분 균형", HIGH: "유분 많음" };
const sensitivityLabels = { LOW: "민감도 낮음", MEDIUM: "민감도 보통", HIGH: "민감도 높음" };

/** Show only saved answers; absent answers must never become assumed skin traits. */
export function homeSkinProfileChips(profile: SkinProfile | null): HomeSkinProfileChip[] {
  if (!profile?.configured) return [];

  const chips: HomeSkinProfileChip[] = [];
  if (profile.skinType?.trim()) chips.push({ label: "피부 타입", value: profile.skinType.trim() });
  if (profile.hydrationLevel && hydrationLabels[profile.hydrationLevel]) {
    chips.push({ label: "수분", value: hydrationLabels[profile.hydrationLevel] });
  }
  if (profile.oilinessLevel && oilinessLabels[profile.oilinessLevel]) {
    chips.push({ label: "유분", value: oilinessLabels[profile.oilinessLevel] });
  }
  if (profile.sensitivityLevel && sensitivityLabels[profile.sensitivityLevel]) {
    chips.push({ label: "민감도", value: sensitivityLabels[profile.sensitivityLevel] });
  }
  return chips;
}
