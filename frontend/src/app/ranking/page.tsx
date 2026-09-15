import { RankingTabs } from "@/components/ranking-tabs";
import { IngredientRankingExplorer } from "@/components/ingredient-ranking-explorer";
import type { IngredientRankingSearchParams } from "@/lib/ingredient-ranking";
import { buildManagedSeoMetadata } from "@/lib/seo";

export function generateMetadata() {
  return buildManagedSeoMetadata("RANKING");
}

export default function RankingPage({ searchParams }: { searchParams: IngredientRankingSearchParams }) {
  return <><div className="container-page pt-4"><RankingTabs /></div><IngredientRankingExplorer searchParams={searchParams} basePath="/ranking" /></>;
}
