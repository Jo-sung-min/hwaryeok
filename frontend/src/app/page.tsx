import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeCatalog } from "@/components/home-catalog";
import { rankingHref, readRankingFilters, type IngredientRankingSearchParams } from "@/lib/ingredient-ranking";

export const metadata: Metadata = {
  title: "화력 | 나에게 맞는 성분, 제품별 랭킹",
  description: "히알루론산 앰플부터 판테놀 크림까지. 내 관심 성분과 제품 종류를 선택하고 성분 화력과 실제 리뷰점수를 바로 비교하세요.",
  alternates: { canonical: "/" },
};

export default async function HomePage({ searchParams }: { searchParams: IngredientRankingSearchParams }) {
  const filters = readRankingFilters(await searchParams);
  // Preserve previously shared filtered home URLs in the full ranking explorer.
  if (filters.category || filters.page > 0 || filters.sort === "REVIEW") redirect(rankingHref("/ranking", filters));
  return <HomeCatalog filters={filters} />;
}
