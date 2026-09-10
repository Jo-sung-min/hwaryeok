export const PHOTO_CONSENT_VERSION = "photo-v1";
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export type SkinPhotoStatus = { enabled: boolean; dailyLimit: number; remaining: number };
export type SkinPhotoReport = {
  quality: "USABLE" | "RETAKE" | "NOT_SKIN";
  summary: string;
  observations: { area: string; appearance: string; caveat: string }[];
  careTips: string[];
  limitations: string;
  analyzedAt: string;
};
export type SkinPhotoActionState = { report?: SkinPhotoReport; error?: string; status?: SkinPhotoStatus };

export function photoFileError(file: { size: number; type: string }) {
  if (!file.size || file.size > PHOTO_MAX_BYTES) return "5MB 이하의 사진을 선택해 주세요.";
  if (!["image/jpeg", "image/png"].includes(file.type)) return "JPEG·PNG 사진만 지원해요. HEIC 사진은 JPEG로 변환해 주세요.";
  return null;
}
