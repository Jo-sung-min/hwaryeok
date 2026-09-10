"use server";

import { getActionAccessToken } from "@/lib/auth-session";
import { analyzeSkinPhoto, ApiRequestError, getSkinPhotoStatus } from "@/lib/api";
import { PHOTO_CONSENT_VERSION, photoFileError, type SkinPhotoActionState } from "@/lib/skin-photo";

export async function analyzePhotoAction(data: FormData): Promise<SkinPhotoActionState> {
  const token = await getActionAccessToken();
  if (!token) return { error: "로그인 후 다시 이용해 주세요." };
  if (data.get("consent") !== PHOTO_CONSENT_VERSION) return { error: "본인 사진의 OpenAI 전송 및 참고용 분석에 동의해 주세요." };
  const photo = data.get("photo");
  if (!(photo instanceof File)) return { error: "먼저 사진을 선택해 주세요." };
  const invalid = photoFileError(photo);
  if (invalid) return { error: invalid };
  let result: SkinPhotoActionState;
  try {
    result = { report: await analyzeSkinPhoto(token, photo) };
  } catch (error) {
    result = { error: error instanceof ApiRequestError ? error.message : "연결이 지연되었어요. 잠시 후 다시 시도해 주세요." };
  }
  return { ...result, status: await getSkinPhotoStatus(token).catch(() => undefined) };
}
