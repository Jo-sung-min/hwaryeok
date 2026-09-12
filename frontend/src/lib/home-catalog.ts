import type { IngredientRankingCategory } from "@/lib/types";
import type { Product, WeeklyRanking } from "@/lib/types";
import type { HomeBannerSlide } from "@/components/home-banner";

export const HOME_REVIEW_SCORE_OPTIONS = [70, 80, 90] as const;
export const HOME_FIREPOWER_SCORE_OPTIONS = [50, 65, 80, 90] as const;

export type HomeCatalogFilters = {
  category: string;
  ingredientId: string;
  minReviewScore: number | null;
  minFirepowerScore: number | null;
};

export type HomeCatalogSearchValues = {
  category?: string | string[];
  ingredientId?: string | string[];
  minReviewScore?: string | string[];
  minFirepowerScore?: string | string[];
};

export type HomeCatalogPath = "/" | "/indextest";

export const EMPTY_HOME_CATALOG_FILTERS: HomeCatalogFilters = {
  category: "",
  ingredientId: "",
  minReviewScore: null,
  minFirepowerScore: null,
};

const categoryOrder = ["앰플", "세럼", "크림", "토너", "에센스", "로션", "선케어", "클렌저", "마스크팩", "젤"];
const categorySlugs: Record<string, string> = {
  앰플: "ampoule", 세럼: "serum", 크림: "cream", 토너: "toner", 에센스: "essence",
  로션: "lotion", 선케어: "suncare", 클렌저: "cleanser", 마스크팩: "mask", 젤: "gel",
};

export function homeCategoryId(name: string) {
  return `home-category-${categorySlugs[name] ?? name.replace(/\s+/g, "-")}`;
}

export function orderHomeCategories(categories: IngredientRankingCategory[]) {
  const position = (name: string) => {
    const index = categoryOrder.indexOf(name);
    return index < 0 ? categoryOrder.length : index;
  };
  return [...categories].sort((left, right) => position(left.name) - position(right.name) || left.name.localeCompare(right.name, "ko"));
}

export function homeDisplayMode(authenticated: boolean, hasProfile: boolean) {
  return authenticated ? hasProfile ? "personalized" : "needs-profile" : "guest";
}

export function readHomeCatalogFilters(params: HomeCatalogSearchValues): HomeCatalogFilters {
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const allowedScore = (value: string, allowed: readonly number[]) => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && allowed.includes(parsed) ? parsed : null;
  };
  return {
    category: first(params.category).slice(0, 60),
    ingredientId: first(params.ingredientId).slice(0, 64),
    minReviewScore: allowedScore(first(params.minReviewScore), HOME_REVIEW_SCORE_OPTIONS),
    minFirepowerScore: allowedScore(first(params.minFirepowerScore), HOME_FIREPOWER_SCORE_OPTIONS),
  };
}

export function homeCatalogHref(
  filters: Partial<HomeCatalogFilters> = {},
  anchor = "",
  basePath: HomeCatalogPath = "/",
) {
  const search = new URLSearchParams();
  if (filters.category) search.set("category", filters.category);
  if (filters.ingredientId) search.set("ingredientId", filters.ingredientId);
  if (filters.minReviewScore != null) search.set("minReviewScore", String(filters.minReviewScore));
  if (filters.minFirepowerScore != null) search.set("minFirepowerScore", String(filters.minFirepowerScore));
  return `${basePath}${search.size ? `?${search}` : ""}${anchor ? `#${anchor}` : ""}`;
}

export function homeProductListHref(filters: HomeCatalogFilters, personalized: boolean) {
  const search = new URLSearchParams();
  if (filters.category) search.set("category", filters.category);
  if (filters.ingredientId) search.set("ingredientId", filters.ingredientId);
  if (filters.minReviewScore != null) search.set("minReviewScore", String(filters.minReviewScore));
  if (filters.minFirepowerScore != null) search.set("minFirepowerScore", String(filters.minFirepowerScore));
  if (!personalized) search.set("order", "name-asc");
  return `/products${search.size ? `?${search}` : ""}`;
}

export function buildWeeklyRankingSlides(ranking: WeeklyRanking | null, fallbackProducts: Product[]): HomeBannerSlide[] {
  if (ranking?.content.length) {
    return ranking.content
      .filter((item) => item.product.imageUrl && item.product.publicationStatus === "PUBLISHED")
      .slice(0, 10)
      .map((item) => ({
        id: `${ranking.weekStart}-${item.product.id}`,
        label: `이주의 화력 랭킹 · 평가 ${item.reviewCount.toLocaleString("ko-KR")}개`,
        title: item.product.name,
        description: item.reviewScore === null
          ? `${item.product.brand} · 첫 평가를 기다리고 있어요`
          : `${item.product.brand} · 평가점수 ${item.reviewScore.toFixed(1)} / 100`,
        href: `/products/${encodeURIComponent(item.product.id)}`,
        product: item.product,
        reviewScore: item.reviewScore,
      }));
  }

  return fallbackProducts
    .filter((product) => product.imageUrl && product.publicationStatus === "PUBLISHED")
    .slice(0, 10)
    .map((product) => ({
      id: `weekly-fallback-${product.id}`,
      label: "이주의 화력 랭킹 · 집계 준비 중",
      title: product.name,
      description: `${product.brand} · 평가 데이터가 준비되면 순위가 반영돼요`,
      href: `/products/${encodeURIComponent(product.id)}`,
      product,
      reviewScore: null,
    }));
}
