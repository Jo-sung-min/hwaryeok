import type { IngredientRankingCategory } from "@/lib/types";
import type { Product } from "@/lib/types";
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

export function buildHomeBannerSlides(guides: HomeBannerSlide[], products: Product[]): HomeBannerSlide[] {
  const slides: HomeBannerSlide[] = [];
  const usedProducts = new Set<string>();
  const append = (slide: HomeBannerSlide) => {
    if (slides.length >= 10 || usedProducts.has(slide.product.id) || !slide.product.imageUrl || slide.product.publicationStatus !== "PUBLISHED") return;
    usedProducts.add(slide.product.id);
    slides.push(slide);
  };
  guides.forEach(append);
  const categories = new Set<string>();
  const valid = products.filter((product) => product.imageUrl && product.publicationStatus === "PUBLISHED");
  const varied = valid.filter((product) => {
    if (categories.has(product.category)) return false;
    categories.add(product.category);
    return true;
  });
  [...varied, ...valid].forEach((product) => append({
    id: `product-${product.id}`, label: `${product.category} 둘러보기`, title: product.name,
    description: `${product.brand} · 성분과 사용 리뷰를 함께 살펴보세요`,
    href: `/products/${encodeURIComponent(product.id)}`, product,
  }));
  return slides;
}
