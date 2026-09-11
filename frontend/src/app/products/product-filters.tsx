import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { buildProductCatalogHref, PRODUCT_CONCERNS, type ProductFilterValues, type ProductSortOrder } from "@/lib/product-catalog";
import type { IngredientRankingOption } from "@/lib/types";

export type { ProductFilterValues, ProductSortOrder } from "@/lib/product-catalog";

type FilterOption = { label: string; value: string };

function filterHref(current: ProductFilterValues, key: keyof ProductFilterValues, value: string) {
  const next = { ...current, [key]: value };
  return buildProductCatalogHref(next);
}

function HiddenFilters({ filters, includeOrder = true, includeQuery = true }: { filters: ProductFilterValues; includeOrder?: boolean; includeQuery?: boolean }) {
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
    {includeOrder && filters.order !== "score-desc" && <input type="hidden" name="order" value={filters.order} />}
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

export function ProductSort({ filters }: { filters: ProductFilterValues }) {
  return <form action="/products" className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
    <HiddenFilters filters={filters} includeOrder={false} />
    <label htmlFor="product-order" className="sr-only sm:not-sr-only sm:text-xs sm:text-[#766960]">정렬</label>
    <select id="product-order" name="order" defaultValue={filters.order} className="glass-select min-w-0 flex-1 rounded-full px-3 py-2.5 text-xs outline-none sm:flex-none sm:px-4">
      <option value="score-desc">내 피부 추천순</option>
      <option value="ingredient-desc">성분 구성 높은 순</option>
      <option value="price-asc">가격 낮은 순</option>
      <option value="price-desc">가격 높은 순</option>
      <option value="name-asc">이름순</option>
    </select>
    <button type="submit" className="line-btn !min-h-11 shrink-0 !px-3 text-xs font-semibold sm:!px-4">적용</button>
  </form>;
}

export function DesktopFilters({ filters, ingredients }: { filters: ProductFilterValues; ingredients: IngredientRankingOption[] }) {
  return <aside className="hidden lg:block"><div className="glass-panel sticky top-28 rounded-2xl p-5">
    <div className="mb-5 flex items-center justify-between"><strong className="font-myeongjo text-lg">내 기준으로 찾기</strong><SlidersHorizontal size={16} /></div>
    <AllFilterBlocks filters={filters} ingredients={ingredients} />
    <p className="text-[10px] leading-5 text-[#907f76]">선택한 고민과 실제로 연결된 성분이 있는 제품만 보여줘요.</p>
  </div></aside>;
}

export function MobileFilters({ filters, ingredients, resultCount }: { filters: ProductFilterValues; ingredients: IngredientRankingOption[]; resultCount: number }) {
  const count = activeProductFilterCount(filters);
  return <details className="relative lg:hidden"><summary className={`line-btn !min-h-11 !px-3 text-xs [&::-webkit-details-marker]:hidden ${count ? "!border-[#d87896] !bg-[#fff0f5] !text-[#973153]" : ""}`}><SlidersHorizontal size={15} /> 필터{count ? ` ${count}` : ""}</summary><div className="glass-panel absolute left-0 top-12 z-[70] max-h-[70dvh] w-[min(350px,calc(100dvw-32px))] overscroll-contain overflow-y-auto rounded-2xl p-5 pb-[calc(80px+env(safe-area-inset-bottom))]"><AllFilterBlocks filters={filters} ingredients={ingredients} /><p className="text-center text-xs text-[#7d6f66]">현재 조건에 {resultCount}개 제품</p></div></details>;
}

function AllFilterBlocks({ filters, ingredients }: { filters: ProductFilterValues; ingredients: IngredientRankingOption[] }) {
  return <>
    <FilterBlock title="주요 성분" options={[{ label: "전체", value: "" }, ...ingredients.map((item) => ({ label: item.name, value: item.id }))]} selected={filters.ingredientId} filters={filters} filterKey="ingredientId" />
    <FilterBlock title="리뷰 평점" options={[{ label: "전체", value: "" }, ...[70, 80, 90].map((score) => ({ label: `${score}점 이상`, value: String(score) }))]} selected={filters.minReviewScore} filters={filters} filterKey="minReviewScore" />
    <FilterBlock title="화력 점수" options={[{ label: "전체", value: "" }, ...[50, 65, 80, 90].map((score) => ({ label: `${score}점 이상`, value: String(score) }))]} selected={filters.minFirepowerScore} filters={filters} filterKey="minFirepowerScore" />
    <FilterBlock title="성분·적합 등급" options={["전체 등급", "1등급", "2등급", "3등급"].map(value => ({ label: value, value }))} selected={filters.grade} filters={filters} filterKey="grade" />
    <FilterBlock title="피부 고민" options={PRODUCT_CONCERNS.map(value => ({ label: value, value }))} selected={filters.concern} filters={filters} filterKey="concern" />
    <FilterBlock title="가격" options={[{ label: "전체", value: "" }, { label: "2만원 이하", value: "20000" }, { label: "3만원 이하", value: "30000" }, { label: "4만원 이하", value: "40000" }]} selected={filters.maxPrice} filters={filters} filterKey="maxPrice" />
    <FilterBlock title="성분 자료 신뢰" options={[{ label: "전체 근거", value: "전체 근거" }, { label: "높음", value: "HIGH" }, { label: "보통", value: "MEDIUM" }]} selected={filters.confidence} filters={filters} filterKey="confidence" />
  </>;
}

export function AppliedProductFilters({ filters, ingredients }: { filters: ProductFilterValues; ingredients: IngredientRankingOption[] }) {
  const ingredient = ingredients.find((item) => item.id === filters.ingredientId);
  const chips: { key: keyof ProductFilterValues; label: string; active: boolean }[] = [
    { key: "category", label: `제품 유형 · ${filters.category}`, active: filters.category !== "전체" },
    { key: "concern", label: `피부 고민 · ${filters.concern}`, active: filters.concern !== "전체 고민" },
    { key: "ingredientId", label: `주요 성분 · ${ingredient?.name ?? ""}`, active: Boolean(ingredient) },
    { key: "minReviewScore", label: `리뷰 평점 · ${filters.minReviewScore}점+`, active: Boolean(filters.minReviewScore) },
    { key: "minFirepowerScore", label: `화력 점수 · ${filters.minFirepowerScore}점+`, active: Boolean(filters.minFirepowerScore) },
  ];
  const visible = chips.filter((chip) => chip.active);
  if (!visible.length) return null;
  return <div className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="적용된 상품 필터">
    {visible.map((chip) => <Link key={chip.key} href={filterHref(filters, chip.key, chip.key === "category" ? "전체" : chip.key === "concern" ? "전체 고민" : "")} scroll={false} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#d87896] bg-[#fff0f5] px-3 text-xs font-bold text-[#973153]">{chip.label}<X size={13} aria-hidden="true" /></Link>)}
  </div>;
}

function activeProductFilterCount(filters: ProductFilterValues) {
  return Number(filters.category !== "전체")
    + Number(Boolean(filters.ingredientId))
    + Number(Boolean(filters.minReviewScore))
    + Number(Boolean(filters.minFirepowerScore))
    + Number(filters.grade !== "전체 등급")
    + Number(filters.concern !== "전체 고민")
    + Number(Boolean(filters.maxPrice))
    + Number(filters.confidence !== "전체 근거");
}

function FilterBlock({ title, options, selected, filters, filterKey }: { title: string; options: FilterOption[]; selected: string; filters: ProductFilterValues; filterKey: keyof ProductFilterValues }) {
  return <div className="mb-6 border-b border-[#74513f13] pb-5 last:border-0"><p className="mb-3 text-xs font-bold text-[#5f554e]">{title}</p><div className="flex flex-wrap gap-2">{options.map(option => <Link key={`${filterKey}-${option.value}`} href={filterHref(filters, filterKey, option.value)} scroll={false} aria-current={selected === option.value ? "page" : undefined} className="glass-choice rounded-full px-3 py-2 text-[11px]">{option.label}</Link>)}</div></div>;
}
