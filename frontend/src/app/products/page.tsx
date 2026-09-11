import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getIngredientRankingOptions, getProductPage } from "@/lib/api";
import { getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { buildProductCatalogFeedUrl, buildProductCatalogHref, getProductConcernOption, PRODUCT_PAGE_SIZE, productCatalogBackendFilters, readProductCatalogState } from "@/lib/product-catalog";
import { ProductCatalogGrid } from "./product-catalog-grid";
import { AppliedProductFilters, ProductSearch } from "./product-filters";
import { ProductQuickFilters } from "./product-quick-filters";

export const metadata: Metadata = {
  title: "화장품 탐색",
  description: "제품명과 브랜드뿐 아니라 주름, 모공, 트러블 같은 피부 고민으로 성분 근거가 연결된 화장품을 찾아보세요.",
  alternates: { canonical: "/products" },
};

type SearchParams = Promise<{
  query?: string | string[];
  category?: string | string[];
  grade?: string | string[];
  ingredientId?: string | string[];
  minReviewScore?: string | string[];
  minFirepowerScore?: string | string[];
  page?: string | string[];
  order?: string | string[];
  concern?: string | string[];
  maxPrice?: string | string[];
  confidence?: string | string[];
}>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const [favoriteState, savedProfile, rankingOptions] = await Promise.all([
    getFavoriteViewState(),
    getOptionalSkinProfile(),
    getIngredientRankingOptions(),
  ]);
  const ingredients = rankingOptions.ingredients.filter((item) => item.productCount > 0);
  const validIngredientIds = new Set(ingredients.map((ingredient) => ingredient.id));
  const { filters, requestedIngredientId, requestedPage } = readProductCatalogState(params, validIngredientIds);
  const productPage = await getProductPage({
      ...productCatalogBackendFilters(filters),
      profile: savedProfile ?? undefined,
      page: requestedPage,
      size: PRODUCT_PAGE_SIZE,
    });
  const currentHref = buildProductCatalogHref(filters, productPage.page);
  const feedUrl = buildProductCatalogFeedUrl(filters);
  const activeConcern = getProductConcernOption(filters.concern);

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-[#ece8eb] bg-white py-6">
        <div className="container-page">
          <p className="eyebrow mb-1.5">PRODUCT SEARCH</p>
          <h1 className="font-myeongjo text-[26px] font-semibold leading-tight">화장품 찾기</h1>
          <p className="mt-2 text-xs leading-6 text-[#756f78]">제품명뿐 아니라 주름, 모공, 트러블 같은 고민으로도 찾아보세요.</p>
          <ProductSearch filters={filters} />
        </div>
      </header>

      <div className="container-page pb-7 pt-5">
        <AppliedProductFilters filters={filters} ingredients={ingredients} />
        {requestedIngredientId && !filters.ingredientId && <p className="mb-4 text-xs text-[#9d3b5e]" role="status">사용할 수 없는 주요 성분 필터를 제외했어요.</p>}
        {activeConcern && (
          <section className="mb-6 border-y border-[#eadde2] bg-[#fff9fb] px-4 py-5" aria-labelledby="concern-result-title">
            <p className="eyebrow mb-1.5">CONCERN SEARCH</p>
            <h2 id="concern-result-title" className="font-myeongjo text-xl font-semibold">{activeConcern.label} 고민에 맞춰 볼 제품</h2>
            <p className="mt-2 text-xs leading-6 text-[#756d75]">{activeConcern.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-[#8d3657]">
              <span className="mr-1 font-bold">함께 살펴볼 성분</span>
              {activeConcern.ingredients.map((ingredient) => <span key={ingredient} className="rounded-full border border-[#edcfd9] bg-white px-2.5 py-1">{ingredient}</span>)}
            </div>
          </section>
        )}
        <section className="mt-2">
          <ProductQuickFilters filters={filters} ingredients={ingredients} resultCount={productPage.totalElements} />
          {productPage.content.length > 0 ? (
            <ProductCatalogGrid
              key={`${feedUrl}:${productPage.page}`}
              initialPage={productPage}
              favoriteIds={favoriteState.favoriteIds}
              isAuthenticated={favoriteState.isAuthenticated}
              returnTo={currentHref}
              feedUrl={feedUrl}
              scoreLabel={activeConcern ? `${activeConcern.label} 반영 화력` : savedProfile ? "내 피부 적합도" : "성분 화력"}
              activeConcern={activeConcern?.value}
            />
          ) : (
            <div className="border-y border-[#ece8eb] py-16 text-center">
              <span className="text-3xl text-[#ca7794]">❀</span>
              <h2 className="mt-4 font-myeongjo text-xl font-semibold">{activeConcern ? "아직 근거가 연결된 제품이 없어요." : "조건에 맞는 제품이 없어요."}</h2>
              <p className="mt-2 text-xs text-[#817982]">{activeConcern ? "무관한 제품을 채우지 않고, 성분 자료가 확인된 제품부터 추가할게요." : "검색어나 필터를 조금 줄여보세요."}</p>
              <Link href="/products" className="line-btn mt-6">조건 초기화</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
