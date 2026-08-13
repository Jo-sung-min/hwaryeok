import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

const categories = ["전체", "토너", "세럼", "앰플", "에센스", "크림", "선케어"];

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
    <form action="/products" className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-full border border-[#74513f24] bg-[#fffdf7d9] px-5 shadow-[0_12px_30px_rgba(74,52,40,.06)] focus-within:border-[#a54f4970]">
      <Search size={19} className="text-[#8a796d]" />
      <input name="query" defaultValue={filters.query} placeholder="제품명이나 브랜드를 검색해보세요" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a8b80]" />
      {filters.category !== "전체" && <input type="hidden" name="category" value={filters.category} />}
      {filters.grade !== "전체 등급" && <input type="hidden" name="grade" value={filters.grade.replace("등급", "")} />}
      {filters.order !== "score-desc" && <input type="hidden" name="order" value={filters.order} />}
      <button type="submit" className="rounded-full bg-[#37312c] px-4 py-2 text-xs font-semibold text-white">검색</button>
    </form>
  );
}

export function ProductSort({ filters }: { filters: ProductFilterValues }) {
  return (
    <form action="/products" className="flex items-center gap-2">
      {filters.query && <input type="hidden" name="query" value={filters.query} />}
      {filters.category !== "전체" && <input type="hidden" name="category" value={filters.category} />}
      {filters.grade !== "전체 등급" && <input type="hidden" name="grade" value={filters.grade.replace("등급", "")} />}
      <label htmlFor="product-order" className="text-xs text-[#766960]">정렬</label>
      <select id="product-order" name="order" defaultValue={filters.order} className="rounded-full border border-[#74513f24] bg-[#fffaf3] px-3 py-2.5 text-xs outline-none sm:px-4">
        <option value="score-desc">화력 높은 순</option>
        <option value="price-asc">가격 낮은 순</option>
        <option value="price-desc">가격 높은 순</option>
        <option value="name-asc">이름순</option>
      </select>
      <button type="submit" className="rounded-full border border-[#74513f24] bg-[#fffaf3] px-3 py-2.5 text-xs font-semibold sm:px-4">적용</button>
    </form>
  );
}

export function CategoryNavigation({ filters }: { filters: ProductFilterValues }) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-3">
      {categories.map((item) => (
        <Link key={item} href={filterHref(filters, "category", item)} scroll={false} className={`shrink-0 rounded-full px-4 py-2.5 text-sm transition ${filters.category === item ? "bg-[#37312c] text-white" : "border border-[#73533f1f] bg-[#fffaf3] text-[#6d625a] hover:border-[#9f6b59]"}`}>
          {item}
        </Link>
      ))}
    </div>
  );
}

export function DesktopFilters({ filters }: { filters: ProductFilterValues }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 rounded-2xl border border-[#74513f18] bg-[#fffaf38c] p-5">
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
      <summary className="line-btn !min-h-10 !px-3 text-xs [&::-webkit-details-marker]:hidden"><SlidersHorizontal size={15} /> 필터</summary>
      <div className="absolute right-0 top-12 z-30 w-[min(330px,calc(100vw-28px))] rounded-2xl border border-[#74513f20] bg-[#fbf7ed] p-5 shadow-[0_18px_42px_rgba(65,45,34,.16)]">
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
      <div className="flex flex-wrap gap-2">{options.map(option => <Link key={option} href={filterHref(filters, filterKey, option)} scroll={false} className={`rounded-full border px-3 py-2 text-[11px] ${selected === option ? "border-[#a54f49] bg-[#a54f4910] text-[#994943]" : "border-[#74513f20] text-[#7b6e65]"}`}>{option}</Link>)}</div>
    </div>
  );
}

function StaticFilterBlock({ title, options }: { title: string; options: string[] }) {
  return <div className="mb-6 border-b border-[#74513f13] pb-5 last:border-0"><p className="mb-3 text-xs font-bold text-[#5f554e]">{title}</p><div className="flex flex-wrap gap-2">{options.map(option => <span key={option} className="rounded-full border border-[#74513f16] px-3 py-2 text-[11px] text-[#9a8b80]">{option}</span>)}</div><p className="mt-3 text-[10px] text-[#a17262]">피부 프로필 연동 예정</p></div>;
}
