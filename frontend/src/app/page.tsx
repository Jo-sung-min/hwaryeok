import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeCatalog } from "@/components/home-catalog";
import { rankingHref, readRankingFilters, type IngredientRankingSearchParams } from "@/lib/ingredient-ranking";
import { readHomeCatalogFilters, type HomeCatalogSearchValues } from "@/lib/home-catalog";

export const metadata: Metadata = {
  title: "화력 | 화장품의 기준을, 내 피부로",
  description: "내 피부 설정에 따라 달라지는 화장품 랭킹. 나에게 맞는 성분을 찾고, 맞춤 화력과 추천 이유를 비교하세요.",
  alternates: { canonical: "/" },
};

type HomeSearchParams = IngredientRankingSearchParams & Promise<HomeCatalogSearchValues>;

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const params = await searchParams;
  const filters = readRankingFilters(params);
  // Ingredient-specific legacy home links remain available in the ingredient explorer.
  if (filters.ingredient || filters.page > 0 || filters.sort === "REVIEW") redirect(rankingHref("/ranking", filters));
  return <HomeCatalog requestedFilters={readHomeCatalogFilters(params)} />;
}
