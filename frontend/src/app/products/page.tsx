import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getIngredientRankingOptions, getProductPage } from "@/lib/api";
import { getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { buildProductCatalogFeedUrl, buildProductCatalogHref, PRODUCT_PAGE_SIZE, productCatalogBackendFilters, readProductCatalogState } from "@/lib/product-catalog";
import { ProductCatalogGrid } from "./product-catalog-grid";
import { AppliedProductFilters, CategoryNavigation, MobileFilters, ProductSearch, ProductSort } from "./product-filters";

export const metadata: Metadata = {
  title: "화장품 탐색",
  description: "제품명과 브랜드를 검색하고 카테고리·화력 등급별로 성분, 리뷰, 피부 적합도를 확인하세요.",
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

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-[#ece8eb] bg-white py-6">
        <div className="container-page">
          <p className="eyebrow mb-1.5">PRODUCT SEARCH</p>
          <h1 className="font-myeongjo text-[26px] font-semibold leading-tight">화장품 찾기</h1>
          <p className="mt-2 text-xs leading-6 text-[#756f78]">성분과 내 피부 기준으로 제품을 빠르게 비교해 보세요.</p>
          <ProductSearch filters={filters} />
        </div>
      </header>

      <div className="container-page pb-7">
        <CategoryNavigation filters={filters} />
        <AppliedProductFilters filters={filters} ingredients={ingredients} />
        {requestedIngredientId && !filters.ingredientId && <p className="mb-4 text-xs text-[#9d3b5e]" role="status">사용할 수 없는 주요 성분 필터를 제외했어요.</p>}
        <section className="mt-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="shrink-0 text-xs text-[#716b74]"><strong className="text-sm text-[#9d385d]">{productPage.totalElements}</strong>개 제품</p>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <MobileFilters filters={filters} ingredients={ingredients} resultCount={productPage.totalElements} />
              <ProductSort filters={filters} />
            </div>
          </div>
          {productPage.content.length > 0 ? (
            <ProductCatalogGrid
              key={`${feedUrl}:${productPage.page}`}
              initialPage={productPage}
              favoriteIds={favoriteState.favoriteIds}
              isAuthenticated={favoriteState.isAuthenticated}
              returnTo={currentHref}
              feedUrl={feedUrl}
              scoreLabel={savedProfile ? "내 피부 적합도" : "성분 화력"}
            />
          ) : (
            <div className="border-y border-[#ece8eb] py-16 text-center">
              <span className="text-3xl text-[#ca7794]">❀</span>
              <h2 className="mt-4 font-myeongjo text-xl font-semibold">조건에 맞는 제품이 없어요.</h2>
              <p className="mt-2 text-xs text-[#817982]">검색어나 필터를 조금 줄여보세요.</p>
              <Link href="/products" className="line-btn mt-6">조건 초기화</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
