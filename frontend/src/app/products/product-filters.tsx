import Link from "next/link";
import { Search, X } from "lucide-react";
import { buildProductCatalogHref, type ProductFilterValues } from "@/lib/product-catalog";
import type { IngredientRankingOption } from "@/lib/types";

export type { ProductFilterValues, ProductSortOrder } from "@/lib/product-catalog";

function filterHref(current: ProductFilterValues, key: keyof ProductFilterValues, value: string) {
  const next = { ...current, [key]: value };
  return buildProductCatalogHref(next);
}

function HiddenFilters({ filters, includeQuery = true }: { filters: ProductFilterValues; includeQuery?: boolean }) {
  return <>
    {includeQuery && filters.query && <input type="hidden" name="query" value={filters.query} />}
    {filters.category !== "전체" && <input type="hidden" name="category" value={filters.category} />}
    {filters.grade !== "전체 등급" && <input type="hidden" name="grade" value={filters.grade.replace("등급", "")} />}
    {filters.ingredientId && <input type="hidden" name="ingredientId" value={filters.ingredientId} />}
    {filters.minReviewScore && <input type="hidden" name="minReviewScore" value={filters.minReviewScore} />}
    {filters.minFirepowerScore && <input type="hidden" name="minFirepowerScore" value={filters.minFirepowerScore} />}
    {filters.concern !== "전체 고민" && <input type="hidden" name="concern" value={filters.concern} />}
    {filters.maxPrice && <input type="hidden" name="maxPrice" value={filters.maxPrice} />}
    {filters.confidence !== "전체 근거" && <input type="hidden" name="confidence" value={filters.confidence} />}
    {filters.order !== "score-desc" && <input type="hidden" name="order" value={filters.order} />}
  </>;
}

export function ProductSearch({ filters }: { filters: ProductFilterValues }) {
  return <form action="/products" role="search" className="glass-field mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-full px-3 focus-within:border-[#a54f4970] sm:mt-8 sm:gap-3 sm:px-5">
    <Search size={18} className="shrink-0 text-[#8a796d]" />
    <label htmlFor="product-search-query" className="sr-only">제품명, 브랜드 또는 피부 고민 검색</label>
    <input id="product-search-query" name="query" defaultValue={filters.query} placeholder="제품명·브랜드·피부 고민 검색" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8f7d85]" />
    <HiddenFilters filters={filters} includeQuery={false} />
    <button type="submit" className="ink-btn !min-h-10 shrink-0 !px-4 text-xs">검색</button>
  </form>;
}

export function AppliedProductFilters({ filters, ingredients }: { filters: ProductFilterValues; ingredients: IngredientRankingOption[] }) {
  const ingredient = ingredients.find((item) => item.id === filters.ingredientId);
  const chips: { key: keyof ProductFilterValues; label: string; active: boolean }[] = [
    { key: "ingredientId", label: `주요 성분 · ${ingredient?.name ?? ""}`, active: Boolean(ingredient) },
    { key: "minReviewScore", label: `리뷰 평점 · ${filters.minReviewScore}점+`, active: Boolean(filters.minReviewScore) },
    { key: "minFirepowerScore", label: `화력 점수 · ${filters.minFirepowerScore}점+`, active: Boolean(filters.minFirepowerScore) },
  ];
  const visible = chips.filter((chip) => chip.active);
  if (!visible.length) return null;
  return <div className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="적용된 상품 필터">
    {visible.map((chip) => <Link key={chip.key} href={filterHref(filters, chip.key, "")} scroll={false} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#d87896] bg-[#fff0f5] px-3 text-xs font-bold text-[#973153]">{chip.label}<X size={13} aria-hidden="true" /></Link>)}
  </div>;
}
