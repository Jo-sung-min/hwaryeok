import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeCatalog } from "@/components/home-catalog";
import { IndexTestHero } from "@/components/index-test-hero";
import { rankingHref, readRankingFilters, type IngredientRankingSearchParams } from "@/lib/ingredient-ranking";
import { readHomeCatalogFilters, type HomeCatalogSearchValues } from "@/lib/home-catalog";

export const metadata: Metadata = {
  title: "화력 홈 비주얼 테스트",
  description: "화력의 모바일 메인페이지 비주얼 실험 화면입니다.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

type IndexTestSearchParams = IngredientRankingSearchParams & Promise<HomeCatalogSearchValues>;

export default async function IndexTestPage({ searchParams }: { searchParams: IndexTestSearchParams }) {
  const params = await searchParams;
  const filters = readRankingFilters(params);
  if (filters.ingredient || filters.page > 0 || filters.sort === "REVIEW") redirect(rankingHref("/ranking", filters));

  return (
    <HomeCatalog
      requestedFilters={readHomeCatalogFilters(params)}
      homePath="/indextest"
      intro={<IndexTestHero />}
    />
  );
}
