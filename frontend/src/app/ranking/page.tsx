import type { Metadata } from "next";
import { RankingTabs } from "@/components/ranking-tabs";
import { IngredientRankingExplorer } from "@/components/ingredient-ranking-explorer";
import type { IngredientRankingSearchParams } from "@/lib/ingredient-ranking";

export const metadata: Metadata = {
  title: "성분별 제품 랭킹",
  description: "히알루론산, 판테놀, 나이아신아마이드 등 관심 성분별로 앰플·세럼·크림을 비교하고 성분 화력순과 사용자 리뷰점수순으로 확인하세요.",
  alternates: { canonical: "/ranking" },
};

export default function RankingPage({ searchParams }: { searchParams: IngredientRankingSearchParams }) {
  return <><div className="container-page pt-4"><RankingTabs active="products" /></div><IngredientRankingExplorer searchParams={searchParams} basePath="/ranking" /></>;
}
