import type { IngredientRankingCategory } from "@/lib/types";

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
