import "server-only";

import type { Metadata } from "next";
import { getSeoPage, getSeoPages } from "@/lib/api";
import type { SeoChangeFrequency, SeoPageKey, SeoPageSetting } from "@/lib/types";

const DEFAULT_SHARE_IMAGE = "/hero-watercolor.png";
const DEFAULT_KEYWORDS = ["화장품 랭킹", "성분 랭킹", "히알루론산", "세라마이드", "화장품 리뷰", "화장품 비교"];

export const SEO_PAGE_KEYS: SeoPageKey[] = [
  "HOME",
  "PRODUCTS",
  "PROMOTIONS",
  "RANKING",
  "COMPARE",
  "INGREDIENTS",
  "EXPERTS",
  "EXPERT_RANKING",
  "QUESTIONS",
  "REVIEWERS",
  "PRINCIPLES",
  "SKIN_CHECK",
  "RISING_RANKING",
];

export const SEO_PAGE_FALLBACKS: Record<SeoPageKey, SeoPageSetting> = {
  HOME: fallback({
    pageKey: "HOME",
    path: "/",
    displayName: "홈",
    title: "화력 | 화장품의 기준을, 내 피부로",
    description: "내 피부 설정에 따라 달라지는 화장품 랭킹. 나에게 맞는 성분을 찾고, 맞춤 화력과 추천 이유를 비교하세요.",
    changeFrequency: "DAILY",
    priority: 1,
  }),
  PRODUCTS: fallback({
    pageKey: "PRODUCTS",
    path: "/products",
    displayName: "화장품 탐색",
    title: "화장품 탐색 | 화력",
    description: "제품명과 브랜드뿐 아니라 주름, 모공, 트러블 같은 피부 고민으로 성분 근거가 연결된 화장품을 찾아보세요.",
  }),
  PROMOTIONS: fallback({
    pageKey: "PROMOTIONS",
    path: "/promotions",
    displayName: "화력 추천",
    title: "화력 추천 | 화력",
    description: "화력 관리자가 평가한 신생 화장품 광고와 추천 이유를 투명하게 확인하세요.",
  }),
  RANKING: fallback({
    pageKey: "RANKING",
    path: "/ranking",
    displayName: "성분별 제품 랭킹",
    title: "성분별 제품 랭킹 | 화력",
    description: "히알루론산, 판테놀, 나이아신아마이드 등 관심 성분별로 앰플·세럼·크림을 비교하고 성분 화력순과 사용자 리뷰점수순으로 확인하세요.",
  }),
  COMPARE: fallback({
    pageKey: "COMPARE",
    path: "/compare",
    displayName: "제품 비교",
    title: "제품 비교 | 화력",
    description: "화장품 2~3개를 같은 피부 조건과 세부 화력 기준으로 나란히 비교하세요.",
  }),
  INGREDIENTS: fallback({
    pageKey: "INGREDIENTS",
    path: "/ingredients",
    displayName: "성분 사전",
    title: "성분 사전 | 화력",
    description: "화장품 성분의 역할과 피부별 특징을 알아보고, 성분별 제품 랭킹으로 이어서 탐색하세요.",
  }),
  EXPERTS: fallback({
    pageKey: "EXPERTS",
    path: "/experts",
    displayName: "전문가 활동",
    title: "전문가 활동 | 화력",
    description: "인증 정보를 분리해 공개하는 의료진의 화장품·성분 답변과 플랫폼 활동을 확인하세요.",
  }),
  EXPERT_RANKING: fallback({
    pageKey: "EXPERT_RANKING",
    path: "/experts/ranking",
    displayName: "전문가 활동 랭킹",
    title: "전문가 활동 랭킹 | 화력",
    description: "화력 안에서 질문에 답하고 유용한 정보를 나눈 인증 전문가의 활동을 기간과 주제별로 확인하세요.",
  }),
  QUESTIONS: fallback({
    pageKey: "QUESTIONS",
    path: "/questions",
    displayName: "화장품 고민 상담소",
    title: "화장품 고민 상담소 | 화력",
    description: "화장품과 성분에 관한 사용자 질문과 인증 전문가의 공개 답변을 살펴보세요.",
  }),
  REVIEWERS: fallback({
    pageKey: "REVIEWERS",
    path: "/reviewers",
    displayName: "리뷰어 랭킹",
    title: "리뷰어 랭킹 · 리뷰 화력 | 화력",
    description: "사용자들이 평가한 리뷰 화력순으로 리뷰어를 만나보세요. 피부타입과 실제 작성 리뷰를 함께 확인할 수 있어요.",
    includeInSitemap: false,
    priority: 0.6,
  }),
  PRINCIPLES: fallback({
    pageKey: "PRINCIPLES",
    path: "/principles",
    displayName: "성분 랭킹의 기준",
    title: "성분 랭킹의 기준 | 화력",
    description: "성분과 제품 종류를 고르고, 성분 화력순과 사용자 리뷰순으로 화장품 랭킹을 읽는 방법을 알아보세요.",
  }),
  SKIN_CHECK: fallback({
    pageKey: "SKIN_CHECK",
    path: "/skin-check",
    displayName: "나의 성분찾기",
    title: "나의 성분찾기 | 화력",
    description: "피부 상태와 생활 습관, 잘 맞았던 성분을 함께 살펴보고 나의 피부 경향과 맞춤 성분을 확인하세요.",
    includeInSitemap: false,
    changeFrequency: "MONTHLY",
    priority: 0.5,
  }),
  RISING_RANKING: fallback({
    pageKey: "RISING_RANKING",
    path: "/ranking/rising",
    displayName: "급상승 제품 랭킹",
    title: "급상승 제품 랭킹 | 화력",
    description: "최근 7일 동안 사용자 리뷰가 더 많이 모인 화장품을 카테고리별로 확인하세요. 직전 7일 대비 리뷰 증가 수로 집계해요.",
    includeInSitemap: false,
  }),
};

type FallbackInput = Pick<SeoPageSetting, "pageKey" | "path" | "displayName" | "title" | "description"> &
  Partial<Pick<SeoPageSetting, "includeInSitemap" | "changeFrequency" | "priority">>;

type DetailSeoMetadataInput = {
  title: string;
  description: string;
  canonical: string;
  imageUrl?: string | null;
  imageAlt?: string;
  ogTitle?: string;
  ogDescription?: string;
  indexable?: boolean;
  followLinks?: boolean;
};

function fallback(input: FallbackInput): SeoPageSetting {
  return {
    ...input,
    keywords: [...DEFAULT_KEYWORDS],
    indexable: true,
    followLinks: true,
    ogTitle: input.title,
    ogDescription: input.description,
    ogImageUrl: DEFAULT_SHARE_IMAGE,
    includeInSitemap: input.includeInSitemap ?? true,
    changeFrequency: input.changeFrequency ?? "WEEKLY",
    priority: input.priority ?? 0.7,
    updatedAt: null,
  };
}

export function isSeoPageKey(value: string): value is SeoPageKey {
  return SEO_PAGE_KEYS.includes(value as SeoPageKey);
}

export function seoPageFallback(pageKey: SeoPageKey): SeoPageSetting {
  const value = SEO_PAGE_FALLBACKS[pageKey];
  return { ...value, keywords: [...value.keywords] };
}

export async function resolveSeoPage(pageKey: SeoPageKey): Promise<SeoPageSetting> {
  const fallbackValue = SEO_PAGE_FALLBACKS[pageKey];
  try {
    return normalizeSeoPage(await getSeoPage(pageKey), fallbackValue);
  } catch {
    return seoPageFallback(pageKey);
  }
}

export async function resolveSeoPages(): Promise<SeoPageSetting[]> {
  try {
    const pages = await getSeoPages();
    const pageByKey = new Map(pages.map((page) => [page.pageKey, page]));
    return SEO_PAGE_KEYS.map((pageKey) => normalizeSeoPage(pageByKey.get(pageKey), SEO_PAGE_FALLBACKS[pageKey]));
  } catch {
    return SEO_PAGE_KEYS.map(seoPageFallback);
  }
}

export async function buildManagedSeoMetadata(pageKey: SeoPageKey): Promise<Metadata> {
  const page = await resolveSeoPage(pageKey);
  const imageUrl = page.ogImageUrl ?? DEFAULT_SHARE_IMAGE;

  return {
    title: { absolute: page.title },
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: page.path },
    robots: {
      index: page.indexable,
      follow: page.followLinks,
      googleBot: {
        index: page.indexable,
        follow: page.followLinks,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: "화력 HWA:RYEOK",
      title: page.ogTitle,
      description: page.ogDescription,
      url: page.path,
      images: [{ url: imageUrl, alt: `${page.displayName} - 화력` }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.ogTitle,
      description: page.ogDescription,
      images: [imageUrl],
    },
  };
}

export function buildDetailSeoMetadata({
  title,
  description,
  canonical,
  imageUrl,
  imageAlt,
  ogTitle = title,
  ogDescription = description,
  indexable = true,
  followLinks = true,
}: DetailSeoMetadataInput): Metadata {
  const shareImageUrl = normalizeImageUrl(imageUrl) ?? DEFAULT_SHARE_IMAGE;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: {
      index: indexable,
      follow: followLinks,
      googleBot: {
        index: indexable,
        follow: followLinks,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: "화력 HWA:RYEOK",
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      images: [{ url: shareImageUrl, alt: imageAlt ?? ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [shareImageUrl],
    },
  };
}

function normalizeSeoPage(page: SeoPageSetting | undefined, fallbackValue: SeoPageSetting): SeoPageSetting {
  if (!page || page.pageKey !== fallbackValue.pageKey) return seoPageFallback(fallbackValue.pageKey);

  return {
    pageKey: fallbackValue.pageKey,
    path: fallbackValue.path,
    displayName: fallbackValue.displayName,
    title: nonBlank(page.title) ?? fallbackValue.title,
    description: nonBlank(page.description) ?? fallbackValue.description,
    keywords: normalizeKeywords(page.keywords, fallbackValue.keywords),
    indexable: typeof page.indexable === "boolean" ? page.indexable : fallbackValue.indexable,
    followLinks: typeof page.followLinks === "boolean" ? page.followLinks : fallbackValue.followLinks,
    ogTitle: nonBlank(page.ogTitle) ?? fallbackValue.ogTitle,
    ogDescription: nonBlank(page.ogDescription) ?? fallbackValue.ogDescription,
    ogImageUrl: normalizeImageUrl(page.ogImageUrl),
    includeInSitemap: typeof page.includeInSitemap === "boolean" ? page.includeInSitemap : fallbackValue.includeInSitemap,
    changeFrequency: normalizeChangeFrequency(page.changeFrequency, fallbackValue.changeFrequency),
    priority: normalizePriority(page.priority, fallbackValue.priority),
    updatedAt: normalizeDateTime(page.updatedAt),
  };
}

function nonBlank(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeKeywords(value: unknown, fallbackKeywords: string[]): string[] {
  if (!Array.isArray(value)) return [...fallbackKeywords];
  return [...new Set(value.filter((keyword): keyword is string => typeof keyword === "string").map((keyword) => keyword.trim()).filter(Boolean))];
}

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = value.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
}

function normalizeChangeFrequency(value: unknown, fallbackValue: SeoChangeFrequency): SeoChangeFrequency {
  return typeof value === "string" && ["ALWAYS", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "NEVER"].includes(value)
    ? value as SeoChangeFrequency
    : fallbackValue;
}

function normalizePriority(value: unknown, fallbackValue: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallbackValue;
}

function normalizeDateTime(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}
