import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import { HomeProductCard } from "@/components/home-product-card";
import { RankingTabs } from "@/components/ranking-tabs";
import { getIngredientRankingOptions, getProductPage } from "@/lib/api";
import { getCurrentSession, getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { buildSkinCareGuide } from "@/lib/skin-care-guide";
import { catalogRankingHref, firstSearchValue, RankingCategories, RankingPagination, requestedRankingPage, type CatalogRankingSearch } from "../_components/catalog-ranking-controls";

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
  const requestedCategory = firstSearchValue(search.category).trim().slice(0, 80);
  const page = requestedRankingPage(search.page);
  const loginReturnTo = catalogRankingHref(basePath, requestedCategory, page);

  if (!user || !profile || !hasProfile) {
    return <div className="container-page pb-24 pt-4 sm:pt-7">
      <RankingTabs active="personal" />
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
  const category = options.categories.some((item) => item.name === requestedCategory) ? requestedCategory : "";
  const data = await getProductPage({ profile, category: category || undefined, page, size: 12, sort: "score", direction: "desc" });
  const favoriteIds = new Set(favorites.favoriteIds);
  const returnTo = catalogRankingHref(basePath, category, data.page);
  const care = buildSkinCareGuide(profile);

  return <div className="container-page pb-24 pt-4 sm:pt-7">
    <RankingTabs active="personal" />
    <section className="py-7 sm:py-10">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-xs text-[#947982]"><ArrowLeft size={14} />메인으로</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 break-words"><p className="mb-2 text-xs font-bold text-[#a63e65]">{user.nickname}님을 위한 랭킹</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">내 피부에 맞는 제품 랭킹</h1><p className="mt-3 text-sm leading-7 text-[#69646f]">저장한 피부 설정을 반영해 맞춤 화력이 높은 순서로 보여드려요.</p></div>
        <Link href="/profile" className="line-btn text-sm"><SlidersHorizontal size={14} />피부 설정 수정</Link>
      </div>
      <div className="mt-5 rounded-2xl border border-[#efdce4] bg-[#fff8fa] px-4 py-4"><p className="text-sm font-semibold text-[#a33e65]">{care.summary}</p><p className="mt-2 text-sm leading-6 text-[#69646f]">추천 제형 · {care.texture}</p><p className="mt-1 text-xs leading-6 text-[#80717b]">{care.application}</p><div className="mt-3 flex flex-wrap gap-2">{care.ingredients.map(ingredient => <Link key={ingredient.id} href={`/ingredients/${encodeURIComponent(ingredient.id)}`} className="rounded-lg border border-[#edcedc] bg-white px-3 py-2 text-xs text-[#a4476c]">{ingredient.name} 설명과 랭킹</Link>)}</div><p className="mt-3 text-xs leading-6 text-[#80717b]">{care.check.title} · {care.check.text}</p></div>
      <Link href="/principles#skin-guide" className="mt-3 inline-flex min-h-9 items-center text-xs text-[#897581]">맞춤 화력·추천 기준 안내 →</Link>
    </section>
    <section aria-labelledby="personal-products-heading">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="personal-products-heading" className="text-lg font-bold">{category || "전체상품"} <span className="ml-1 text-sm font-normal text-[#69646f]">{data.totalElements.toLocaleString("ko-KR")}개</span></h2><span className="text-sm text-[#69646f]">맞춤 화력 높은 순</span></div>
      <RankingCategories basePath={basePath} category={category} categories={options.categories} />
      {data.content.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
        {data.content.map((product, index) => <HomeProductCard key={product.id} product={product} rank={data.page * data.size + index + 1} scoreLabel="맞춤 화력" favorited={favoriteIds.has(product.id)} isAuthenticated={favorites.isAuthenticated} returnTo={returnTo} />)}
      </div> : <div className="rounded-3xl border border-dashed border-[#e6bdcc] px-5 py-14 text-center"><Sparkles className="mx-auto text-[#bd5575]" size={28} /><h3 className="mt-4 text-lg font-semibold">{page > 0 ? "이 페이지에는 제품이 없어요" : "이 카테고리에는 아직 제품이 없어요"}</h3><p className="mt-3 text-sm leading-7 text-[#8a727d]">다른 카테고리나 첫 페이지에서 제품을 살펴보세요.</p><Link href={catalogRankingHref(basePath, page > 0 ? category : "")} className="line-btn mt-5">{page > 0 ? "첫 페이지 보기" : "전체상품 보기"}</Link></div>}
      <RankingPagination basePath={basePath} category={category} page={data.page} totalPages={data.totalPages} hasNext={data.hasNext} />
    </section>
  </div>;
}
