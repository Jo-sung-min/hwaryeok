import Link from "next/link";
import { connection } from "next/server";
import { ProductCard } from "@/components/product-ui";
import { getProducts } from "@/lib/api";
import { CategoryNavigation, DesktopFilters, MobileFilters, ProductSearch, type ProductFilterValues } from "./product-filters";

type SearchParams = Promise<{
  query?: string | string[];
  category?: string | string[];
  grade?: string | string[];
}>;

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const gradeValue = first(params.grade);
  const parsedGrade = /^[1-5]$/.test(gradeValue) ? Number(gradeValue) : undefined;
  const filters: ProductFilterValues = {
    query: first(params.query).trim(),
    category: first(params.category) || "전체",
    grade: parsedGrade ? `${parsedGrade}등급` : "전체 등급",
  };
  const products = await getProducts({
    query: filters.query || undefined,
    category: filters.category,
    grade: parsedGrade,
  });

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
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="text-sm text-[#766a61]"><strong className="text-[#9b4a45]">{products.length}</strong>개의 화장품이 잘 맞을 수 있어요</p>
              <div className="flex items-center gap-2">
                <MobileFilters filters={filters} resultCount={products.length} />
                <span className="hidden rounded-full border border-[#74513f20] bg-[#fffaf3] px-4 py-3 text-xs text-[#70645c] sm:inline-flex">나에게 잘 맞는 순</span>
              </div>
            </div>
            {products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
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
