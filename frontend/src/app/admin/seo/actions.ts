"use server";

import { revalidatePath, updateTag } from "next/cache";
import { ApiRequestError, getCurrentUser, SEO_PAGES_CACHE_TAG, updateAdminSeoPage } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";
import { isSeoPageKey, SEO_PAGE_FALLBACKS } from "@/lib/seo";
import type { SeoChangeFrequency, SeoPageKey, SeoPageUpdateInput } from "@/lib/types";

export type SeoActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

const changeFrequencies: SeoChangeFrequency[] = ["ALWAYS", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "NEVER"];

export async function updateSeoPageAction(
  pageKey: SeoPageKey,
  _previousState: SeoActionState,
  formData: FormData,
): Promise<SeoActionState> {
  if (!isSeoPageKey(pageKey)) return { success: false, message: "관리할 SEO 페이지를 다시 선택해 주세요." };

  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  try {
    await updateAdminSeoPage(authorization.accessToken, pageKey, seoInput(formData));
    updateTag(SEO_PAGES_CACHE_TAG);
    revalidatePath(SEO_PAGE_FALLBACKS[pageKey].path);
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/seo");
    return { success: true, message: "SEO 설정을 저장하고 사용자 페이지에 반영했어요." };
  } catch (error) {
    return actionError(error, "SEO 설정을 저장하지 못했어요.");
  }
}

function seoInput(formData: FormData): SeoPageUpdateInput {
  const changeFrequency = String(formData.get("changeFrequency") ?? "");
  if (!changeFrequencies.includes(changeFrequency as SeoChangeFrequency)) {
    throw new Error("사이트맵 변경 주기를 다시 선택해 주세요.");
  }

  const rawPriority = String(formData.get("priority") ?? "").trim();
  if (!rawPriority) throw new Error("사이트맵 우선순위를 입력해 주세요.");
  const priority = Number(rawPriority);
  if (!Number.isFinite(priority) || priority < 0 || priority > 1) {
    throw new Error("사이트맵 우선순위는 0부터 1 사이로 입력해 주세요.");
  }

  const indexable = formData.get("indexable") === "on";
  const keywords = keywordList(formData);

  return {
    title: requiredText(formData, "title", "브라우저 제목"),
    description: requiredText(formData, "description", "검색 설명"),
    keywords,
    indexable,
    followLinks: formData.get("followLinks") === "on",
    ogTitle: requiredText(formData, "ogTitle", "공유 제목"),
    ogDescription: requiredText(formData, "ogDescription", "공유 설명"),
    ogImageUrl: String(formData.get("ogImageUrl") ?? "").trim(),
    includeInSitemap: indexable && formData.get("includeInSitemap") === "on",
    changeFrequency: changeFrequency as SeoChangeFrequency,
    priority,
  };
}

function keywordList(formData: FormData) {
  const keywords: string[] = [];
  const normalized = new Set<string>();
  for (const keyword of String(formData.get("keywords") ?? "").split(/[\n,]/).map((value) => value.trim()).filter(Boolean)) {
    if (keyword.length > 60) throw new Error("검색 키워드는 각각 60자 이하로 입력해 주세요.");
    const key = keyword.toLocaleLowerCase();
    if (!normalized.has(key)) keywords.push(keyword);
    normalized.add(key);
  }
  if (keywords.length > 20) throw new Error("검색 키워드는 최대 20개까지 입력해 주세요.");
  return keywords;
}

function requiredText(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${label}을 입력해 주세요.`);
  return value;
}

async function authorizeAdmin(): Promise<{ accessToken: string } | { error: SeoActionState }> {
  const accessToken = await getActionAccessToken();
  if (!accessToken) return { error: { success: false, message: "관리자 로그인이 필요해요." } };

  try {
    const user = await getCurrentUser(accessToken);
    if (user.role !== "ADMIN") return { error: { success: false, message: "관리자만 SEO 설정을 변경할 수 있어요." } };
    return { accessToken };
  } catch {
    return { error: { success: false, message: "로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요." } };
  }
}

function actionError(error: unknown, fallbackMessage: string): SeoActionState {
  if (error instanceof ApiRequestError) {
    return { success: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  return { success: false, message: error instanceof Error ? error.message : fallbackMessage };
}
