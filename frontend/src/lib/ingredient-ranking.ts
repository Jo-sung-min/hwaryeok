import type { IngredientRankingSort } from "@/lib/types";

export type IngredientRankingSearchParams = Promise<{
  ingredient?: string | string[];
  category?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}>;

export type IngredientRankingFilters = {
  ingredient: string;
  category: string;
  sort: IngredientRankingSort;
  page: number;
};

export function rankingHref(basePath: "/" | "/ranking", filters: Partial<IngredientRankingFilters> = {}) {
  const search = new URLSearchParams();
  if (filters.ingredient) search.set("ingredient", filters.ingredient);
  if (filters.category) search.set("category", filters.category);
  if (filters.sort === "REVIEW") search.set("sort", "REVIEW");
  if (filters.page && filters.page > 0) search.set("page", String(filters.page + 1));
  return search.size ? `${basePath}?${search}` : basePath;
}

export function readRankingFilters(params: Awaited<IngredientRankingSearchParams>): IngredientRankingFilters {
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const page = Number(first(params.page));
  return {
    ingredient: first(params.ingredient),
    category: first(params.category),
    sort: first(params.sort) === "REVIEW" ? "REVIEW" : "FIREPOWER",
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page - 1, 100000) : 0,
  };
}
