import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

const categories = ["전체", "토너", "세럼", "앰플", "에센스", "크림", "선케어", "마스크팩", "젤", "클렌저"];

export type ProductFilterValues = {
  query: string;
  category: string;
  grade: string;
  order: ProductSortOrder;
};

export type ProductSortOrder = "score-desc" | "price-asc" | "price-desc" | "name-asc";

function filterHref(current: ProductFilterValues, key: keyof ProductFilterValues, value: string) {
  const params = new URLSearchParams();
  const next = { ...current, [key]: value };
  if (next.query) params.set("query", next.query);
  if (next.category && next.category !== "전체") params.set("category", next.category);
  if (next.grade && next.grade !== "전체 등급") params.set("grade", next.grade.replace("등급", ""));
  if (next.order !== "score-desc") params.set("order", next.order);
  const queryString = params.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

export function ProductSearch({ filters }: { filters: ProductFilterValues }) {
  return (
    <form action="/products" className="glass-field mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-full px-3 focus-within:border-[#a54f4970] sm:mt-8 sm:gap-3 sm:px-5">
      <Search size={18} className="shrink-0 text-[#8a796d]" />
      <input name="query" defaultValue={filters.query} placeholder="제품명·브랜드 검색" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8f7d85]" />
      {filters.category !== "전체" && <input type="hidden" name="category" value={filters.category} />}
      {filters.grade !== "전체 등급" && <input type="hidden" name="grade" value={filters.grade.replace("등급", "")} />}
      {filters.order !== "score-desc" && <input type="hidden" name="order" value={filters.order} />}
      <button type="submit" className="ink-btn !min-h-10 shrink-0 !px-4 text-xs">검색</button>
    </form>
  );
}

export function ProductSort({ filters }: { filters: ProductFilterValues }) {
  return (
    <form action="/products" className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
      {filters.query && <input type="hidden" name="query" value={filters.query} />}
      {filters.category !== "전체" && <input type="hidden" name="category" value={filters.category} />}
      {filters.grade !== "전체 등급" && <input type="hidden" name="grade" value={filters.grade.replace("등급", "")} />}
      <label htmlFor="product-order" className="sr-only sm:not-sr-only sm:text-xs sm:text-[#766960]">정렬</label>
      <select id="product-order" name="order" defaultValue={filters.order} className="glass-select min-w-0 flex-1 rounded-full px-3 py-2.5 text-xs outline-none sm:flex-none sm:px-4">
        <option value="score-desc">화력 높은 순</option>
        <option value="price-asc">가격 낮은 순</option>
        <option value="price-desc">가격 높은 순</option>
        <option value="name-asc">이름순</option>
      </select>
      <button type="submit" className="line-btn !min-h-11 shrink-0 !px-3 text-xs font-semibold sm:!px-4">적용</button>
    </form>
  );
}

export function CategoryNavigation({ filters }: { filters: ProductFilterValues }) {
  return (
    <nav
      aria-label="제품 카테고리"
      className="scrollbar-hide -mx-3 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 py-4 sm:mx-0"
    >
      {categories.map((item) => (
        <Link key={item} href={filterHref(filters, "category", item)} scroll={false} aria-current={filters.category === item ? "page" : undefined} className="glass-choice shrink-0 snap-start rounded-full px-4 py-2.5 text-sm">
          {item}
        </Link>
      ))}
    </nav>
  );
}

export function DesktopFilters({ filters }: { filters: ProductFilterValues }) {
  return (
    <aside className="hidden lg:block">
      <div className="glass-panel sticky top-28 rounded-2xl p-5">
        <div className="mb-5 flex items-center justify-between"><strong className="font-myeongjo text-lg">세밀하게 찾기</strong><SlidersHorizontal size={16} /></div>
        <FilterBlock title="화력 등급" options={["전체 등급", "1등급", "2등급", "3등급"]} selected={filters.grade} filters={filters} filterKey="grade" />
        <StaticFilterBlock title="피부 고민" options={["속건조", "민감", "피부 장벽", "붉은기"]} />
        <StaticFilterBlock title="사용감" options={["산뜻한", "촉촉한", "무향", "저자극"]} />
      </div>
    </aside>
  );
}

export function MobileFilters({ filters, resultCount }: { filters: ProductFilterValues; resultCount: number }) {
  return (
    <details className="relative lg:hidden">
      <summary className="line-btn !min-h-11 !px-3 text-xs [&::-webkit-details-marker]:hidden"><SlidersHorizontal size={15} /> 필터</summary>
      <div className="glass-panel absolute left-0 top-12 z-30 w-[min(330px,calc(100dvw-32px))] rounded-2xl p-5">
        <FilterBlock title="화력 등급" options={["전체 등급", "1등급", "2등급", "3등급"]} selected={filters.grade} filters={filters} filterKey="grade" />
        <p className="text-center text-xs text-[#7d6f66]">현재 조건에 {resultCount}개 제품</p>
      </div>
    </details>
  );
}

function FilterBlock({ title, options, selected, filters, filterKey }: { title: string; options: string[]; selected: string; filters: ProductFilterValues; filterKey: keyof ProductFilterValues }) {
  return (
    <div className="mb-6 border-b border-[#74513f13] pb-5 last:border-0">
      <p className="mb-3 text-xs font-bold text-[#5f554e]">{title}</p>
      <div className="flex flex-wrap gap-2">{options.map(option => <Link key={option} href={filterHref(filters, filterKey, option)} scroll={false} aria-current={selected === option ? "page" : undefined} className="glass-choice rounded-full px-3 py-2 text-[11px]">{option}</Link>)}</div>
    </div>
  );
}

function StaticFilterBlock({ title, options }: { title: string; options: string[] }) {
  return <div className="mb-6 border-b border-[#74513f13] pb-5 last:border-0"><p className="mb-3 text-xs font-bold text-[#5f554e]">{title}</p><div className="flex flex-wrap gap-2">{options.map(option => <span key={option} className="glass-chip-muted rounded-full px-3 py-2 text-[11px] text-[#8b7880]">{option}</span>)}</div><p className="mt-3 text-[10px] text-[#a17262]">피부 프로필 연동 예정</p></div>;
}
