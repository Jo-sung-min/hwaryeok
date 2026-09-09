import type { IngredientRankingCategory } from "@/lib/types";
import type { Product, WeeklyRanking } from "@/lib/types";
import type { HomeBannerSlide } from "@/components/home-banner";

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

export function homeCatalogHref(category = "", anchor = "") {
  const query = category ? `?${new URLSearchParams({ category })}` : "";
  return `/${query}${anchor ? `#${anchor}` : ""}`;
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
    }));
}
