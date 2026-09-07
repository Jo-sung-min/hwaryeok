import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { IngredientRankingCategory } from "@/lib/types";

export type CatalogRankingSearch = { category?: string | string[]; page?: string | string[] };

export function firstSearchValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function requestedRankingPage(value: string | string[] | undefined) {
  const page = Number(firstSearchValue(value));
  return Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page - 1 : 0;
}

export function catalogRankingHref(basePath: string, category = "", page = 0) {
  const search = new URLSearchParams();
  if (category) search.set("category", category);
  if (page > 0) search.set("page", String(page + 1));
  return search.size ? `${basePath}?${search}` : basePath;
}

export function RankingCategories({ basePath, category, categories }: {
  basePath: string;
  category: string;
  categories: IngredientRankingCategory[];
}) {
  return <nav aria-label="제품 카테고리" className="my-5 flex gap-2 overflow-x-auto pb-2">
    {[{ name: "", productCount: 0 }, ...categories].map(({ name }) => <Link
      key={name || "all"}
      href={catalogRankingHref(basePath, name)}
      aria-current={category === name ? "page" : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-5 text-xs font-bold transition-colors ${category === name ? "border-[#bd5575] bg-[#bd5575] text-white" : "border-[#efdae2] bg-white text-[#856f78] hover:bg-[#fff8fa]"}`}
    >{name || "전체보기"}</Link>)}
  </nav>;
}

export function RankingPagination({ basePath, category, page, totalPages, hasNext }: {
  basePath: string;
  category: string;
  page: number;
  totalPages: number;
  hasNext: boolean;
}) {
  if (totalPages < 2 || page >= totalPages) return null;
  const firstPage = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index);

  return <nav aria-label="제품 랭킹 페이지" className="mt-9 flex items-center justify-center gap-2">
    {page > 0 && <Link href={catalogRankingHref(basePath, category, page - 1)} aria-label="이전 페이지" className="grid size-10 place-items-center rounded-full border border-[#efdce4] text-[#9c5870]"><ChevronLeft size={16} /></Link>}
    {pages.map((index) => <Link key={index} href={catalogRankingHref(basePath, category, index)} aria-current={page === index ? "page" : undefined} className={`grid size-10 place-items-center rounded-full border text-xs font-semibold ${page === index ? "border-[#bd5575] bg-[#bd5575] text-white" : "border-[#efdce4] text-[#876e78]"}`}>{index + 1}</Link>)}
    {hasNext && <Link href={catalogRankingHref(basePath, category, page + 1)} aria-label="다음 페이지" className="grid size-10 place-items-center rounded-full border border-[#efdce4] text-[#9c5870]"><ChevronRight size={16} /></Link>}
  </nav>;
}
