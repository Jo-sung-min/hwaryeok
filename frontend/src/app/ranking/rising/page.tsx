import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import { HomeProductCard } from "@/components/home-product-card";
import { RankingTabs } from "@/components/ranking-tabs";
import { getIngredientRankingOptions, getRisingProductRanking } from "@/lib/api";
import { getFavoriteViewState } from "@/lib/auth-session";
import { catalogRankingHref, firstSearchValue, RankingCategories, RankingPagination, requestedRankingPage, type CatalogRankingSearch } from "../_components/catalog-ranking-controls";

export const metadata: Metadata = {
  title: "급상승 제품 랭킹",
  description: "최근 7일 동안 사용자 리뷰가 더 많이 모인 화장품을 카테고리별로 확인하세요. 직전 7일 대비 리뷰 증가 수로 집계해요.",
  alternates: { canonical: "/ranking/rising" },
};

const basePath = "/ranking/rising";

export default async function RisingRankingPage({ searchParams }: { searchParams: Promise<CatalogRankingSearch> }) {
  const search = await searchParams;
  const requestedCategory = firstSearchValue(search.category).trim().slice(0, 80);
  const page = requestedRankingPage(search.page);
  const [data, favorites, options] = await Promise.all([
    getRisingProductRanking({ category: requestedCategory || undefined, page, size: 12 }),
    getFavoriteViewState(),
    getIngredientRankingOptions(),
  ]);
  const category = data.category ?? "";
  const returnTo = catalogRankingHref(basePath, category, data.page);
  const favoriteIds = new Set(favorites.favoriteIds);

  return <div className="container-page pb-24 pt-4 sm:pt-7">
    <RankingTabs active="rising" />
    <section className="py-7 sm:py-10">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-xs text-[#947982]"><ArrowLeft size={14} />메인으로</Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div><p className="mb-2 text-xs font-bold text-[#bd5575]">지금 리뷰가 모이는 제품</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">급상승 랭킹</h1><p className="mt-3 text-sm leading-7 text-[#8a727d]">최근 {data.window.days}일 리뷰 수가 직전 {data.window.days}일보다 증가한 제품을 모았어요.</p></div>
        <span className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-[#fff0f5] text-[#bd5575] sm:grid" aria-hidden="true"><TrendingUp size={25} /></span>
      </div>
      <details className="mt-5 rounded-2xl border border-[#efdce4] bg-[#fff8fa] px-4 py-3 text-xs leading-6 text-[#917481]">
        <summary className="cursor-pointer font-semibold text-[#a14a68]">급상승 랭킹 집계 기준</summary>
        <p className="mt-2">최근 {data.window.days}일의 리뷰 수에서 직전 {data.window.days}일의 리뷰 수를 뺀 ‘리뷰 증가 수’가 큰 순서예요. 증가 수는 점수 변화나 순위 상승 폭이 아니에요.</p>
        <p className="mt-2">공개된 제품에 활성 사용자가 작성한 리뷰만 집계해요. 광고비, 관리자 추천점수, 외부 판매량은 반영하지 않으며, 증가한 리뷰가 없는 제품은 표시하지 않아요.</p>
      </details>
    </section>
    <section aria-labelledby="rising-products-heading">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="rising-products-heading" className="text-lg font-bold">{category || "전체상품"} <span className="ml-1 text-sm font-normal text-[#9e8390]">{data.totalElements.toLocaleString("ko-KR")}개</span></h2><span className="text-xs text-[#917883]">최근 {data.window.days}일 리뷰 증가 수순</span></div>
      <RankingCategories basePath={basePath} category={category} categories={options.categories} />
      {data.content.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
        {data.content.map((item) => <HomeProductCard key={item.product.id} product={item.product} rank={item.rank} favorited={favoriteIds.has(item.product.id)} isAuthenticated={favorites.isAuthenticated} returnTo={returnTo} growth={{ recentReviewCount: item.recentReviewCount, previousReviewCount: item.previousReviewCount, reviewGrowth: item.reviewGrowth }} review={{ score: item.recentReviewScore, count: item.recentReviewCount }} />)}
      </div> : <div className="rounded-3xl border border-dashed border-[#e6bdcc] bg-[#fffafb] px-5 py-14 text-center">
        <TrendingUp className="mx-auto text-[#bd5575]" size={30} />
        <h3 className="mt-4 text-lg font-semibold">{page > 0 ? "이 페이지에는 제품이 없어요" : "아직 급상승한 제품이 없어요"}</h3>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#8a727d]">{page > 0 ? "첫 페이지로 돌아가 현재 집계된 제품을 확인해 보세요." : `최근 ${data.window.days}일의 실제 리뷰가 직전 기간보다 증가하면 랭킹에 표시돼요. 충분한 활동이 모일 때까지 임의의 순위를 만들지 않아요.`}</p>
        <Link href={page > 0 ? catalogRankingHref(basePath, category) : category ? basePath : "/products"} className="line-btn mt-6">{page > 0 ? "첫 페이지 보기" : category ? "전체 급상승 보기" : "제품 둘러보기"}<ArrowRight size={14} /></Link>
      </div>}
      <RankingPagination basePath={basePath} category={category} page={data.page} totalPages={data.totalPages} hasNext={data.hasNext} />
    </section>
  </div>;
}
