import type { Product } from "@/lib/types";

export const PRODUCT_CATEGORIES = ["전체", "토너", "세럼", "앰플", "에센스", "크림", "로션", "선케어", "마스크팩", "젤", "클렌저"] as const;
export const PRODUCT_CONCERNS = ["전체 고민", "속건조·당김", "유분·번들거림", "트러블·여드름", "블랙헤드·모공", "붉은기·민감", "장벽·각질", "잡티·칙칙함"] as const;
export const PRODUCT_PAGE_SIZE = 9;

export const PRODUCT_ORDERS = {
  "score-desc": { sort: "score", direction: "desc" },
  "ingredient-desc": { sort: "ingredient", direction: "desc" },
  "price-asc": { sort: "price", direction: "asc" },
  "price-desc": { sort: "price", direction: "desc" },
  "name-asc": { sort: "name", direction: "asc" },
} as const;

export type ProductSortOrder = keyof typeof PRODUCT_ORDERS;

export type ProductFilterValues = {
  query: string;
  category: string;
  grade: string;
  ingredientId: string;
  minReviewScore: string;
  minFirepowerScore: string;
  concern: string;
  maxPrice: string;
  confidence: string;
  order: ProductSortOrder;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function includes(options: readonly string[], value: string) {
  return options.includes(value);
}

export function readProductCatalogState(params: RawSearchParams, validIngredientIds?: ReadonlySet<string>) {
  const gradeValue = first(params.grade);
  const parsedGrade = /^[1-5]$/.test(gradeValue) ? Number(gradeValue) : undefined;
  const rawOrder = first(params.order);
  const order: ProductSortOrder = Object.hasOwn(PRODUCT_ORDERS, rawOrder) ? rawOrder as ProductSortOrder : "score-desc";
  const rawPage = Number(first(params.page));
  const rawMaxPrice = first(params.maxPrice);
  const maxPrice = ["20000", "30000", "40000"].includes(rawMaxPrice) ? rawMaxPrice : "";
  const rawConfidence = first(params.confidence).toUpperCase();
  const confidence = ["HIGH", "MEDIUM", "LOW"].includes(rawConfidence) ? rawConfidence : "전체 근거";
  const rawReviewScore = first(params.minReviewScore);
  const minReviewScore = ["70", "80", "90"].includes(rawReviewScore) ? rawReviewScore : "";
  const rawFirepowerScore = first(params.minFirepowerScore);
  const minFirepowerScore = ["50", "65", "80", "90"].includes(rawFirepowerScore) ? rawFirepowerScore : "";
  const rawCategory = first(params.category);
  const rawConcern = first(params.concern);
  const requestedIngredientId = first(params.ingredientId).trim().slice(0, 64);
  const ingredientId = validIngredientIds && !validIngredientIds.has(requestedIngredientId) ? "" : requestedIngredientId;

  return {
    requestedIngredientId,
    requestedPage: Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 1_001 ? rawPage - 1 : 0,
    filters: {
      query: first(params.query).trim().slice(0, 100),
      category: includes(PRODUCT_CATEGORIES, rawCategory) ? rawCategory : "전체",
      grade: parsedGrade ? `${parsedGrade}등급` : "전체 등급",
      ingredientId,
      minReviewScore,
      minFirepowerScore,
      concern: includes(PRODUCT_CONCERNS, rawConcern) ? rawConcern : "전체 고민",
      maxPrice,
      confidence,
      order,
    } satisfies ProductFilterValues,
  };
}

export function appendProductCatalogSearchParams(search: URLSearchParams, filters: ProductFilterValues) {
  if (filters.query) search.set("query", filters.query);
  if (filters.category !== "전체") search.set("category", filters.category);
  if (filters.grade !== "전체 등급") search.set("grade", filters.grade.replace("등급", ""));
  if (filters.ingredientId) search.set("ingredientId", filters.ingredientId);
  if (filters.minReviewScore) search.set("minReviewScore", filters.minReviewScore);
  if (filters.minFirepowerScore) search.set("minFirepowerScore", filters.minFirepowerScore);
  if (filters.concern !== "전체 고민") search.set("concern", filters.concern);
  if (filters.maxPrice) search.set("maxPrice", filters.maxPrice);
  if (filters.confidence !== "전체 근거") search.set("confidence", filters.confidence);
  if (filters.order !== "score-desc") search.set("order", filters.order);
  return search;
}

export function buildProductCatalogHref(filters: ProductFilterValues, page = 0) {
  const search = appendProductCatalogSearchParams(new URLSearchParams(), filters);
  if (page > 0) search.set("page", String(page + 1));
  return search.size ? `/products?${search}` : "/products";
}

export function buildProductCatalogFeedUrl(filters: ProductFilterValues) {
  const search = appendProductCatalogSearchParams(new URLSearchParams(), filters);
  return `/api/catalog/products${search.size ? `?${search}` : ""}`;
}

export function productCatalogBackendFilters(filters: ProductFilterValues) {
  return {
    query: filters.query || undefined,
    category: filters.category === "전체" ? undefined : filters.category,
    grade: filters.grade === "전체 등급" ? undefined : Number(filters.grade.replace("등급", "")),
    ingredientId: filters.ingredientId || undefined,
    minReviewScore: filters.minReviewScore ? Number(filters.minReviewScore) : undefined,
    minFirepowerScore: filters.minFirepowerScore ? Number(filters.minFirepowerScore) : undefined,
    concern: filters.concern === "전체 고민" ? undefined : filters.concern,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    confidence: filters.confidence === "전체 근거" ? undefined : filters.confidence as "HIGH" | "MEDIUM" | "LOW",
    ...PRODUCT_ORDERS[filters.order],
  };
}

export function appendUniqueProducts(current: Product[], incoming: Product[]) {
  const knownIds = new Set(current.map((product) => product.id));
  const next = [...current];
  for (const product of incoming) {
    if (knownIds.has(product.id)) continue;
    knownIds.add(product.id);
    next.push(product);
  }
  return next;
}
