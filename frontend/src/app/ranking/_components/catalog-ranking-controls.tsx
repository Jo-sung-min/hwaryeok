import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CatalogRankingSearch = {
  category?: string | string[];
  ingredientId?: string | string[];
  minReviewScore?: string | string[];
  minFirepowerScore?: string | string[];
  page?: string | string[];
};

export type CatalogRankingFilters = {
  category: string;
  ingredientId: string;
  minReviewScore: string;
  minFirepowerScore: string;
};

export function firstSearchValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function requestedRankingPage(value: string | string[] | undefined) {
  const page = Number(firstSearchValue(value));
  return Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page - 1 : 0;
}

export function readCatalogRankingFilters(search: CatalogRankingSearch): CatalogRankingFilters {
  const reviewScore = firstSearchValue(search.minReviewScore);
  const firepowerScore = firstSearchValue(search.minFirepowerScore);
  return {
    category: firstSearchValue(search.category).trim().slice(0, 80),
    ingredientId: firstSearchValue(search.ingredientId).trim().slice(0, 64),
    minReviewScore: ["70", "80", "90"].includes(reviewScore) ? reviewScore : "",
    minFirepowerScore: ["50", "65", "80", "90"].includes(firepowerScore) ? firepowerScore : "",
  };
}

export function catalogRankingHref(basePath: string, filters: Partial<CatalogRankingFilters> = {}, page = 0) {
  const search = new URLSearchParams();
  if (filters.category) search.set("category", filters.category);
  if (filters.ingredientId) search.set("ingredientId", filters.ingredientId);
  if (filters.minReviewScore) search.set("minReviewScore", filters.minReviewScore);
  if (filters.minFirepowerScore) search.set("minFirepowerScore", filters.minFirepowerScore);
  if (page > 0) search.set("page", String(page + 1));
  return search.size ? `${basePath}?${search}` : basePath;
}

export function RankingPagination({ basePath, filters, page, totalPages, hasNext }: {
  basePath: string;
  filters?: Partial<CatalogRankingFilters>;
  page: number;
  totalPages: number;
  hasNext: boolean;
}) {
  if (totalPages < 2 || page >= totalPages) return null;
  const firstPage = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index);

  return <nav aria-label="제품 랭킹 페이지" className="mt-9 flex items-center justify-center gap-2">
    {page > 0 && <Link href={catalogRankingHref(basePath, filters, page - 1)} aria-label="이전 페이지" className="grid size-10 place-items-center rounded-full border border-[#efdce4] text-[#9c5870]"><ChevronLeft size={16} /></Link>}
    {pages.map((index) => <Link key={index} href={catalogRankingHref(basePath, filters, index)} aria-current={page === index ? "page" : undefined} className={`grid size-10 place-items-center rounded-full border text-xs font-semibold ${page === index ? "border-[#bd5575] bg-[#bd5575] text-white" : "border-[#efdce4] text-[#876e78]"}`}>{index + 1}</Link>)}
    {hasNext && <Link href={catalogRankingHref(basePath, filters, page + 1)} aria-label="다음 페이지" className="grid size-10 place-items-center rounded-full border border-[#efdce4] text-[#9c5870]"><ChevronRight size={16} /></Link>}
  </nav>;
}
