import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-ui";
import { getProductPage } from "@/lib/api";
import { getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { CategoryNavigation, DesktopFilters, MobileFilters, ProductSearch, ProductSort, type ProductFilterValues, type ProductSortOrder } from "./product-filters";

export const metadata: Metadata = {
  title: "화장품 탐색",
  description: "제품명과 브랜드를 검색하고 카테고리·화력 등급별로 성분, 리뷰, 피부 적합도를 확인하세요.",
  alternates: { canonical: "/products" },
};

type SearchParams = Promise<{
  query?: string | string[];
  category?: string | string[];
  grade?: string | string[];
  page?: string | string[];
  order?: string | string[];
  concern?: string | string[];
  maxPrice?: string | string[];
  confidence?: string | string[];
}>;

const productOrders: Record<ProductSortOrder, { sort: "score" | "ingredient" | "price" | "name"; direction: "asc" | "desc" }> = {
  "score-desc": { sort: "score", direction: "desc" },
  "ingredient-desc": { sort: "ingredient", direction: "desc" },
  "price-asc": { sort: "price", direction: "asc" },
  "price-desc": { sort: "price", direction: "desc" },
  "name-asc": { sort: "name", direction: "asc" },
};

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function productPageHref(filters: ProductFilterValues, page: number) {
  const search = new URLSearchParams();
  if (filters.query) search.set("query", filters.query);
  if (filters.category !== "전체") search.set("category", filters.category);
  if (filters.grade !== "전체 등급") search.set("grade", filters.grade.replace("등급", ""));
  if (filters.concern !== "전체 고민") search.set("concern", filters.concern);
  if (filters.maxPrice) search.set("maxPrice", filters.maxPrice);
  if (filters.confidence !== "전체 근거") search.set("confidence", filters.confidence);
  if (filters.order !== "score-desc") search.set("order", filters.order);
  if (page > 0) search.set("page", String(page + 1));
  const suffix = search.toString();
  return suffix ? `/products?${suffix}` : "/products";
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const gradeValue = first(params.grade);
  const parsedGrade = /^[1-5]$/.test(gradeValue) ? Number(gradeValue) : undefined;
  const rawOrder = first(params.order);
  const order = Object.hasOwn(productOrders, rawOrder) ? rawOrder as ProductSortOrder : "score-desc";
  const rawPage = Number(first(params.page));
  const rawMaxPrice = first(params.maxPrice);
  const maxPrice = ["20000", "30000", "40000"].includes(rawMaxPrice) ? rawMaxPrice : "";
  const rawConfidence = first(params.confidence).toUpperCase();
  const confidence = ["HIGH", "MEDIUM", "LOW"].includes(rawConfidence) ? rawConfidence : "전체 근거";
  const requestedPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage - 1 : 0;
  const filters: ProductFilterValues = {
    query: first(params.query).trim(),
    category: first(params.category) || "전체",
    grade: parsedGrade ? `${parsedGrade}등급` : "전체 등급",
    concern: first(params.concern) || "전체 고민",
    maxPrice,
    confidence,
    order,
  };
  const [favoriteState, savedProfile] = await Promise.all([getFavoriteViewState(), getOptionalSkinProfile()]);
  const productPage = await getProductPage({
      query: filters.query || undefined,
      category: filters.category,
      grade: parsedGrade,
      concern: filters.concern === "전체 고민" ? undefined : filters.concern,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      confidence: filters.confidence === "전체 근거" ? undefined : filters.confidence as "HIGH" | "MEDIUM" | "LOW",
      profile: savedProfile ?? undefined,
      page: requestedPage,
      size: 6,
      ...productOrders[order],
    });
  const favoriteIds = new Set(favoriteState.favoriteIds);
  const currentHref = productPageHref(filters, productPage.page);
  const visiblePages = Array.from({ length: productPage.totalPages }, (_, index) => index)
    .filter((page) => Math.abs(page - productPage.page) <= 2);

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#dfa6b51f] bg-[#fff1f4] py-10 md:py-20">
        <div className="container-page text-center">
          <p className="eyebrow mb-4">PRODUCT REPORTS</p>
          <h1 className="text-balance font-myeongjo text-[32px] font-medium leading-[1.25] sm:text-4xl md:text-5xl">내 피부에 맞는 화장품을 찾아보세요</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#776b62]">브랜드 크기보다 성분 구성과 내 피부 적합도를 먼저 보고, 고민·가격·근거 수준으로 실제 후보를 좁혀보세요.</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold text-[#98495d]"><Sparkles size={13} /> 광고비·판매량을 뺀 성분 중심 순서</p>
          <ProductSearch filters={filters} />
        </div>
      </section>

      <div className="container-page py-7 sm:py-9">
        <CategoryNavigation filters={filters} />
        <div className="mt-7 grid gap-8 lg:grid-cols-[220px_1fr]">
          <DesktopFilters filters={filters} />
          <section>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[#766a61]"><strong className="text-[#9b4a45]">{productPage.totalElements}</strong>개 제품이 현재 기준과 연결돼요</p>
              <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
                <MobileFilters filters={filters} resultCount={productPage.totalElements} />
                <ProductSort filters={filters} />
              </div>
            </div>
            {productPage.content.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{productPage.content.map(product => <ProductCard key={product.id} product={product} initialFavorited={favoriteIds.has(product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={currentHref} scoreLabel={savedProfile ? "내 피부 적합도" : "성분 기준 점수"} />)}</div>
                {productPage.totalPages > 1 && (
                  <nav aria-label="화장품 목록 페이지" className="mt-10 flex items-center justify-center gap-2">
                    {productPage.page > 0 && <Link href={productPageHref(filters, productPage.page - 1)} className="glass-choice grid h-11 w-11 place-items-center rounded-full" aria-label="이전 페이지"><ChevronLeft size={16} /></Link>}
                    {visiblePages.map((page) => <Link key={page} href={productPageHref(filters, page)} aria-current={page === productPage.page ? "page" : undefined} className="glass-choice grid h-11 w-11 place-items-center rounded-full text-xs">{page + 1}</Link>)}
                    {productPage.hasNext && <Link href={productPageHref(filters, productPage.page + 1)} className="glass-choice grid h-11 w-11 place-items-center rounded-full" aria-label="다음 페이지"><ChevronRight size={16} /></Link>}
                  </nav>
                )}
              </>
            ) : (
              <div className="paper-card rounded-3xl py-20 text-center">
                <span className="text-4xl text-[#d08f7c]">❀</span>
                <h2 className="mt-5 font-myeongjo text-2xl">조건에 맞는 제품이 없어요.</h2>
                <p className="mt-2 text-sm text-[#81736a]">검색어나 필터를 조금 줄여보세요.</p>
                <Link href="/products" className="line-btn mt-6">조건 초기화</Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
