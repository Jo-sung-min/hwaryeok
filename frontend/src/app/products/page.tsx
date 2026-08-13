import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-ui";
import { getProductPage } from "@/lib/api";
import { CategoryNavigation, DesktopFilters, MobileFilters, ProductSearch, ProductSort, type ProductFilterValues, type ProductSortOrder } from "./product-filters";

type SearchParams = Promise<{
  query?: string | string[];
  category?: string | string[];
  grade?: string | string[];
  page?: string | string[];
  order?: string | string[];
}>;

const productOrders: Record<ProductSortOrder, { sort: "score" | "price" | "name"; direction: "asc" | "desc" }> = {
  "score-desc": { sort: "score", direction: "desc" },
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
  const requestedPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage - 1 : 0;
  const filters: ProductFilterValues = {
    query: first(params.query).trim(),
    category: first(params.category) || "전체",
    grade: parsedGrade ? `${parsedGrade}등급` : "전체 등급",
    order,
  };
  const productPage = await getProductPage({
    query: filters.query || undefined,
    category: filters.category,
    grade: parsedGrade,
    page: requestedPage,
    size: 6,
    ...productOrders[order],
  });
  const visiblePages = Array.from({ length: productPage.totalPages }, (_, index) => index)
    .filter((page) => Math.abs(page - productPage.page) <= 2);

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#74513f16] bg-[#f4ebdc86] py-14 md:py-20">
        <div className="container-page text-center">
          <p className="eyebrow mb-4">COSMETIC FINDER</p>
          <h1 className="font-myeongjo text-4xl font-medium md:text-5xl">내 피부에 피어날 화장품</h1>
          <p className="mt-4 text-sm leading-7 text-[#776b62]">평균 평점이 아닌 수부지 · 민감 · 속건조인 나의 화력 순으로 보여드려요.</p>
          <ProductSearch filters={filters} />
        </div>
      </section>

      <div className="container-page py-9">
        <CategoryNavigation filters={filters} />
        <div className="mt-7 grid gap-8 lg:grid-cols-[220px_1fr]">
          <DesktopFilters filters={filters} />
          <section>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[#766a61]"><strong className="text-[#9b4a45]">{productPage.totalElements}</strong>개의 화장품이 잘 맞을 수 있어요</p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <MobileFilters filters={filters} resultCount={productPage.totalElements} />
                <ProductSort filters={filters} />
              </div>
            </div>
            {productPage.content.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{productPage.content.map(product => <ProductCard key={product.id} product={product} />)}</div>
                {productPage.totalPages > 1 && (
                  <nav aria-label="화장품 목록 페이지" className="mt-10 flex items-center justify-center gap-2">
                    {productPage.page > 0 && <Link href={productPageHref(filters, productPage.page - 1)} className="grid h-10 w-10 place-items-center rounded-full border border-[#74513f20] bg-[#fffaf3]" aria-label="이전 페이지"><ChevronLeft size={16} /></Link>}
                    {visiblePages.map((page) => <Link key={page} href={productPageHref(filters, page)} aria-current={page === productPage.page ? "page" : undefined} className={`grid h-10 w-10 place-items-center rounded-full text-xs ${page === productPage.page ? "bg-[#37312c] text-white" : "border border-[#74513f20] bg-[#fffaf3]"}`}>{page + 1}</Link>)}
                    {productPage.hasNext && <Link href={productPageHref(filters, productPage.page + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-[#74513f20] bg-[#fffaf3]" aria-label="다음 페이지"><ChevronRight size={16} /></Link>}
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
