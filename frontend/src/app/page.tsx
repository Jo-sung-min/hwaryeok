import { redirect } from "next/navigation";
import { HomeCatalog } from "@/components/home-catalog";
import { rankingHref, readRankingFilters, type IngredientRankingSearchParams } from "@/lib/ingredient-ranking";
import { readHomeCatalogFilters, type HomeCatalogSearchValues } from "@/lib/home-catalog";
import { buildManagedSeoMetadata } from "@/lib/seo";

export function generateMetadata() {
  return buildManagedSeoMetadata("HOME");
}

type HomeSearchParams = IngredientRankingSearchParams & Promise<HomeCatalogSearchValues>;

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const params = await searchParams;
  const filters = readRankingFilters(params);
  // Ingredient-specific legacy home links remain available in the ingredient explorer.
  if (filters.ingredient || filters.page > 0 || filters.sort === "REVIEW") redirect(rankingHref("/ranking", filters));
  return <HomeCatalog requestedFilters={readHomeCatalogFilters(params)} />;
}
