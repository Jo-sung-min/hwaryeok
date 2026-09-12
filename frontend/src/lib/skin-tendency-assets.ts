export const SKIN_TENDENCY_ASSET_BOARD_SRC = "/skin/skin-tendency-board.png" as const;

export type SkinTendencyAssetKey =
  | "dry"
  | "oily"
  | "combination"
  | "dehydrated-oily"
  | "balanced"
  | "sensitive"
  | "default";

const skinTendencyAssetKeys: Readonly<Record<string, SkinTendencyAssetKey>> = {
  "건성": "dry",
  "지성": "oily",
  "복합성": "combination",
  "수부지": "dehydrated-oily",
  "중성": "balanced",
  "민감": "sensitive",
  "민감성": "sensitive",
};

export function skinTendencyAssetKey(skinType: string | null | undefined): SkinTendencyAssetKey {
  return skinTendencyAssetKeys[skinType?.trim() ?? ""] ?? "default";
}
