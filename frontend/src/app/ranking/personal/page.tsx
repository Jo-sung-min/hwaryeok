import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import { HomeProductCard } from "@/components/home-product-card";
import { RankingFilterSheet } from "@/components/ranking-filter-sheet";
import { RankingTabs } from "@/components/ranking-tabs";
import { getIngredientRankingOptions, getProductPage } from "@/lib/api";
import { getCurrentSession, getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { buildSkinCareGuide } from "@/lib/skin-care-guide";
import { catalogRankingHref, RankingPagination, readCatalogRankingFilters, requestedRankingPage, type CatalogRankingSearch } from "../_components/catalog-ranking-controls";

export const metadata: Metadata = {
  title: "내 피부에 맞는 제품 랭킹",
  description: "저장한 피부 조사 결과를 바탕으로 나에게 맞는 화장품을 카테고리별로 확인하세요.",
  alternates: { canonical: "/ranking/personal" },
  robots: { index: false, follow: true },
};

const basePath = "/ranking/personal";

export default async function PersonalRankingPage({ searchParams }: { searchParams: Promise<CatalogRankingSearch> }) {
  const [search, user, profile] = await Promise.all([searchParams, getCurrentSession(), getOptionalSkinProfile()]);
  const hasProfile = Boolean(user && profile?.configured);
  const requestedFilters = readCatalogRankingFilters(search);
  const page = requestedRankingPage(search.page);
  const loginReturnTo = catalogRankingHref(basePath, requestedFilters, page);

  if (!user || !profile || !hasProfile) {
    return <div className="container-page pb-24 pt-4 sm:pt-7">
      <RankingTabs />
      <section className="py-8 sm:py-12">
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-xs text-[#947982]"><ArrowLeft size={14} />메인으로</Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">내 피부에 맞는 제품 랭킹</h1>
        <p className="mt-3 text-sm leading-7 text-[#8a727d]">피부 조사 결과로 나에게 맞는 제품을 먼저 만나보세요.</p>
        <div className="mt-8 rounded-3xl border border-[#efd7e1] bg-[#fff8fa] px-5 py-14 text-center sm:py-18">
          <Sparkles className="mx-auto text-[#bd5575]" size={30} />
          <h2 className="mt-5 text-xl font-bold">{user ? "피부 조사를 먼저 완료해 주세요" : "로그인하고 나만의 랭킹을 확인해요"}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#69646f]">{user ? "피부타입, 고민, 사용 취향을 저장하면 맞춤 화력이 높은 순서로 제품을 보여드려요." : "저장한 피부 설정이 있을 때 개인 맞춤 랭킹을 제공해요. 피부 체크는 가입 없이 먼저 해볼 수 있어요."}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href={user ? "/skin-check" : `/login?returnTo=${encodeURIComponent(loginReturnTo)}`} className="ink-btn">{user ? "나의 성분찾기" : "로그인하기"}<ArrowRight size={15} /></Link>
            <Link href="/products" className="line-btn">전체상품 보기</Link>
            {!user && <Link href="/skin-check" className="line-btn">가입 없이 피부 체크</Link>}
          </div>
        </div>
      </section>
    </div>;
  }

  const [options, favorites] = await Promise.all([getIngredientRankingOptions(), getFavoriteViewState()]);
  const categories = options.categories.filter((item) => item.productCount > 0);
  const ingredients = options.ingredients.filter((item) => item.productCount > 0);
  const filters = {
    ...requestedFilters,
    category: categories.some((item) => item.name === requestedFilters.category) ? requestedFilters.category : "",
    ingredientId: ingredients.some((item) => item.id === requestedFilters.ingredientId) ? requestedFilters.ingredientId : "",
  };
  let data = await getProductPage({
    profile,
    category: filters.category || undefined,
    ingredientId: filters.ingredientId || undefined,
    minReviewScore: filters.minReviewScore ? Number(filters.minReviewScore) : undefined,
    minFirepowerScore: filters.minFirepowerScore ? Number(filters.minFirepowerScore) : undefined,
    page,
    size: 12,
    sort: "score",
    direction: "desc",
  });
  if (data.totalPages > 0 && page >= data.totalPages) {
    data = await getProductPage({
      profile,
      category: filters.category || undefined,
      ingredientId: filters.ingredientId || undefined,
      minReviewScore: filters.minReviewScore ? Number(filters.minReviewScore) : undefined,
      minFirepowerScore: filters.minFirepowerScore ? Number(filters.minFirepowerScore) : undefined,
      page: data.totalPages - 1,
      size: 12,
      sort: "score",
      direction: "desc",
    });
  }
  const favoriteIds = new Set(favorites.favoriteIds);
  const returnTo = catalogRankingHref(basePath, filters, data.page);
  const care = buildSkinCareGuide(profile);
  const invalidFilter = filters.category !== requestedFilters.category || filters.ingredientId !== requestedFilters.ingredientId;

  return <div className="container-page pb-24 pt-4 sm:pt-7">
    <RankingTabs />
    <section className="py-7 sm:py-10">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-xs text-[#947982]"><ArrowLeft size={14} />메인으로</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 break-words"><p className="mb-2 text-xs font-bold text-[#a63e65]">{user.nickname}님을 위한 랭킹</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">내 피부에 맞는 제품 랭킹</h1><p className="mt-3 text-sm leading-7 text-[#69646f]">저장한 피부 설정을 반영해 맞춤 화력이 높은 순서로 보여드려요.</p></div>
        <Link href="/skin-check" className="line-btn text-sm"><SlidersHorizontal size={14} />피부 설정 수정</Link>
      </div>
      <div className="mt-5 rounded-2xl border border-[#efdce4] bg-[#fff8fa] px-4 py-4"><p className="text-sm font-semibold text-[#a33e65]">{care.summary}</p><p className="mt-2 text-sm leading-6 text-[#69646f]">추천 제형 · {care.texture}</p><p className="mt-1 text-xs leading-6 text-[#80717b]">{care.application}</p><div className="mt-3 flex flex-wrap gap-2">{care.ingredients.map(ingredient => <Link key={ingredient.id} href={`/ingredients/${encodeURIComponent(ingredient.id)}`} className="rounded-lg border border-[#edcedc] bg-white px-3 py-2 text-xs text-[#a4476c]">{ingredient.name} 설명과 랭킹</Link>)}</div><p className="mt-3 text-xs leading-6 text-[#80717b]">{care.check.title} · {care.check.text}</p></div>
      <Link href="/principles#skin-guide" className="mt-3 inline-flex min-h-9 items-center text-xs text-[#897581]">맞춤 화력·추천 기준 안내 →</Link>
    </section>
    <section aria-labelledby="personal-products-heading">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="personal-products-heading" className="text-lg font-bold">{filters.category || "전체상품"} <span className="ml-1 text-sm font-normal text-[#69646f]">{data.totalElements.toLocaleString("ko-KR")}개</span></h2><span className="text-sm text-[#69646f]">맞춤 화력 높은 순</span></div>
      <RankingFilterSheet
        variant="personal"
        basePath={basePath}
        resultCount={data.totalElements}
        axes={[
          { id: "ingredient", param: "ingredientId", label: "주요 성분", shortLabel: "성분", value: filters.ingredientId, searchable: true, searchPlaceholder: "성분 이름 검색", options: [{ value: "", label: "전체 성분" }, ...ingredients.map((item) => ({ value: item.id, label: item.name, count: item.productCount, keywords: `${item.englishName} ${item.role} ${item.tags.join(" ")}` }))] },
          { id: "category", param: "category", label: "제품 유형", shortLabel: "종류", value: filters.category, options: [{ value: "", label: "전체 상품" }, ...categories.map((item) => ({ value: item.name, label: item.name, count: item.productCount }))] },
          { id: "review", param: "minReviewScore", label: "리뷰 점수", shortLabel: "리뷰", value: filters.minReviewScore, note: "실제 사용자 리뷰 평균이 선택한 점수 이상인 제품만 보여드려요.", options: [{ value: "", label: "전체 점수" }, ...[70, 80, 90].map((score) => ({ value: String(score), label: `${score}점 이상`, chipLabel: `${score}점+` }))] },
          { id: "firepower", param: "minFirepowerScore", label: "맞춤 화력", shortLabel: "맞춤화력", value: filters.minFirepowerScore, note: "저장한 피부 설정으로 계산한 맞춤 화력이 선택한 점수 이상인 제품만 보여드려요.", options: [{ value: "", label: "전체 점수" }, ...[50, 65, 80, 90].map((score) => ({ value: String(score), label: `${score}점 이상`, chipLabel: `${score}점+` }))] },
        ]}
      />
      {invalidFilter && <p role="status" className="mb-5 text-xs text-[#a13f61]">사용할 수 없는 필터를 제외하고 보여드려요.</p>}
      {data.content.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
        {data.content.map((product, index) => <HomeProductCard key={product.id} product={product} rank={data.page * data.size + index + 1} scoreLabel="맞춤 화력" favorited={favoriteIds.has(product.id)} isAuthenticated={favorites.isAuthenticated} returnTo={returnTo} />)}
      </div> : <div className="rounded-3xl border border-dashed border-[#e6bdcc] px-5 py-14 text-center"><Sparkles className="mx-auto text-[#bd5575]" size={28} /><h3 className="mt-4 text-lg font-semibold">조건에 맞는 제품이 없어요</h3><p className="mt-3 text-sm leading-7 text-[#8a727d]">필터 조건을 조금 줄여서 다시 살펴보세요.</p><Link href={basePath} className="line-btn mt-5">필터 초기화</Link></div>}
      <RankingPagination basePath={basePath} filters={filters} page={data.page} totalPages={data.totalPages} hasNext={data.hasNext} />
    </section>
  </div>;
}
