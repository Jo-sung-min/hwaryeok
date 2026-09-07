import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, FlaskConical, Search, Sparkles } from "lucide-react";
import { getIngredientRanking, getIngredientRankingOptions, getUserPreferredIngredients } from "@/lib/api";
import { getFavoriteViewState, readAuthTokens } from "@/lib/auth-session";
import { rankingHref, readRankingFilters, type IngredientRankingSearchParams } from "@/lib/ingredient-ranking";
import { IngredientPicker } from "@/components/ingredient-picker";
import { IngredientRankingCard } from "@/components/ingredient-ranking-card";

async function preferredIngredientIds() {
  const { accessToken } = await readAuthTokens();
  if (!accessToken) return [];
  try {
    return (await getUserPreferredIngredients(accessToken)).content.map((item) => item.ingredient.id);
  } catch {
    return [];
  }
}

export async function IngredientRankingExplorer({ searchParams, basePath }: {
  searchParams: IngredientRankingSearchParams;
  basePath: "/" | "/ranking";
}) {
  const [params, options, favoriteState, preferredIds] = await Promise.all([
    searchParams, getIngredientRankingOptions(), getFavoriteViewState(), preferredIngredientIds(),
  ]);
  const filters = readRankingFilters(params);
  const unknownIngredient = Boolean(filters.ingredient && !options.ingredients.some((item) => item.id === filters.ingredient));
  if (unknownIngredient) filters.ingredient = "";
  let result = await getIngredientRanking({ ingredientId: filters.ingredient, category: filters.category, sort: filters.sort, page: filters.page, size: 12 });
  filters.category = result.category ?? "";
  if (result.totalPages > 0 && filters.page >= result.totalPages) {
    filters.page = result.totalPages - 1;
    result = await getIngredientRanking({ ingredientId: filters.ingredient, category: filters.category, sort: filters.sort, page: filters.page, size: 12 });
  }
  const favoriteIds = new Set(favoriteState.favoriteIds);
  const selected = options.ingredients.find((item) => item.id === filters.ingredient);
  const currentHref = rankingHref(basePath, filters);
  const totalForIngredient = result.categories.reduce((sum, category) => sum + category.productCount, 0);
  const categoryNames = [...new Set([...options.categories.map((item) => item.name), ...result.categories.map((item) => item.name), ...(filters.category ? [filters.category] : [])])];
  const visiblePages = Array.from({ length: Math.min(5, result.totalPages) }, (_, index) => Math.max(0, Math.min(result.page - 2, result.totalPages - 5)) + index);
  const isHome = basePath === "/";

  return <div className="container-page pb-12 pt-5 sm:pt-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-1 text-[10px] font-bold tracking-[.16em] text-[#c15c7d]">MY INGREDIENT, MY RANKING</p>
        <h1 className="text-[24px] font-bold tracking-tight text-[#3d3036] sm:text-[32px]">{isHome ? <>나에게 맞는 성분,<span className="text-[#c15175]"> 화력</span></> : "성분으로 찾는 제품 랭킹"}</h1>
        <p className="mt-1.5 text-xs leading-5 text-[#947b86]">성분을 고르고, 필요한 제품의 순위를 만나보세요.</p>
      </div>
      <form action="/products" role="search" aria-label="제품 찾기" className="flex h-11 items-center gap-2 rounded-xl border border-[#eedde3] bg-[#fffafb] pl-3 pr-1 sm:w-72">
        <Search size={17} className="shrink-0 text-[#c87590]" /><label className="sr-only" htmlFor="ranking-product-search">제품명 또는 브랜드</label><input id="ranking-product-search" name="query" placeholder="제품명·브랜드 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="submit" className="h-9 rounded-lg px-3 text-xs font-bold text-[#b24f70]">검색</button>
      </form>
    </div>

    <section aria-label="성분과 제품 종류 필터" className="mt-5 border-b border-[#f0e1e7] pb-1 sm:mt-6">
      <IngredientPicker ingredients={options.ingredients} filters={filters} basePath={basePath} preferredIds={preferredIds} />
      <nav aria-label="제품 종류 선택" className="scrollbar-hide mt-1 flex gap-5 overflow-x-auto sm:gap-6">
        <Link href={rankingHref(basePath, { ...filters, category: "", page: 0 })} scroll={false} aria-current={!filters.category ? "page" : undefined} className={`shrink-0 border-b-2 pb-3 pt-2 text-xs font-semibold ${!filters.category ? "border-[#cc5b7e] text-[#b84e72]" : "border-transparent text-[#8f7983]"}`}>전체 종류 <span className="ml-1 text-[10px] opacity-65">{totalForIngredient}</span></Link>
        {categoryNames.map((name) => {
          const count = result.categories.find((item) => item.name === name)?.productCount ?? 0;
          const active = name === filters.category;
          return <Link key={name} href={rankingHref(basePath, { ...filters, category: name, page: 0 })} scroll={false} aria-current={active ? "page" : undefined} className={`shrink-0 border-b-2 pb-3 pt-2 text-xs font-semibold ${active ? "border-[#cc5b7e] text-[#b84e72]" : count > 0 ? "border-transparent text-[#8f7983]" : "border-transparent text-[#bba7b0]"}`}>{name}<span className="ml-1 text-[10px] opacity-65">{count}</span></Link>;
        })}
      </nav>
    </section>

    {unknownIngredient && <p role="status" className="mt-4 rounded-xl bg-[#fff2f6] px-4 py-3 text-xs text-[#a15470]">해당 성분을 찾지 못해 전체 상품을 보여드려요. 위에서 성분을 다시 선택해 주세요.</p>}
    <section id="ranking-products" aria-label="제품 랭킹" className="scroll-mt-28 pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-[#57414b]"><h2>{selected?.name ?? "전체 성분"}</h2><ChevronRight size={14} className="text-[#d1aaba]" /><span>{filters.category || "모든 제품"}</span><span className="ml-1 text-[11px] font-normal text-[#a08b94]">{result.totalElements}개</span></div>
        <nav aria-label="랭킹 정렬" className="flex items-center gap-3 text-[11px]">
          <Link href={rankingHref(basePath, { ...filters, sort: "FIREPOWER", page: 0 })} scroll={false} aria-current={filters.sort === "FIREPOWER" ? "page" : undefined} className={`py-1 ${filters.sort === "FIREPOWER" ? "font-bold text-[#b84d71]" : "text-[#a18b95]"}`}>{selected ? "성분 화력순" : "기본 진열순"}</Link>
          <span className="h-2.5 w-px bg-[#eedee5]" />
          <Link href={rankingHref(basePath, { ...filters, sort: "REVIEW", page: 0 })} scroll={false} aria-current={filters.sort === "REVIEW" ? "page" : undefined} className={`py-1 ${filters.sort === "REVIEW" ? "font-bold text-[#b84d71]" : "text-[#a18b95]"}`}>리뷰점수순</Link>
        </nav>
      </div>
      {result.content.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{result.content.map((item) => <IngredientRankingCard key={item.product.id} item={item} ingredientName={result.ingredientName} sort={filters.sort} favorited={favoriteIds.has(item.product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={currentHref} />)}</div> : <div className="rounded-2xl border border-dashed border-[#e3b9c8] bg-[#fffafb] px-5 py-12 text-center">
        <FlaskConical size={26} className="mx-auto text-[#cc7795]" /><h3 className="mt-4 text-lg font-bold">{selected?.name ? `${selected.name} ${filters.category || "제품"}` : filters.category || "선택한 조건"}의 연결된 제품이 아직 없어요</h3><p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#947f88]">성분이 확인된 상품이 등록되면 이 목록에 자동으로 모여요. 다른 제품 종류도 살펴보세요.</p><Link href={rankingHref(basePath, { ingredient: filters.ingredient, sort: filters.sort })} className="mt-5 inline-flex min-h-10 items-center gap-1 rounded-full border border-[#e6c1ce] bg-white px-4 text-xs font-semibold text-[#af5674]">{selected?.name ?? "전체 성분"}의 모든 제품 <ArrowRight size={13} /></Link>
      </div>}

      {result.totalPages > 1 && <nav aria-label="랭킹 페이지" className="mt-7 flex justify-center gap-2">
        {result.page > 0 && <Link href={`${rankingHref(basePath, { ...filters, page: result.page - 1 })}#ranking-products`} aria-label="이전 페이지" className="grid h-10 w-10 place-items-center rounded-full border border-[#eedde3]"><ChevronLeft size={16} /></Link>}
        {visiblePages.map((page) => <Link key={page} href={`${rankingHref(basePath, { ...filters, page })}#ranking-products`} aria-current={page === result.page ? "page" : undefined} className={`grid h-10 w-10 place-items-center rounded-full text-xs ${page === result.page ? "bg-[#cf5b7d] text-white" : "border border-[#eedde3]"}`}>{page + 1}</Link>)}
        {result.hasNext && <Link href={`${rankingHref(basePath, { ...filters, page: result.page + 1 })}#ranking-products`} aria-label="다음 페이지" className="grid h-10 w-10 place-items-center rounded-full border border-[#eedde3]"><ChevronRight size={16} /></Link>}
      </nav>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9a8590]">
        <details className="max-w-2xl"><summary className="cursor-pointer py-2">순위는 어떻게 정해지나요?</summary><p className="pb-3 leading-6">{filters.sort === "REVIEW" ? "실제 사용자 리뷰의 평균점수로 정렬하고, 같은 점수일 때는 리뷰 수를 비교해요. 리뷰가 없는 제품은 순위를 매기지 않고 뒤에 표시해요." : selected ? "선택한 성분이 연결된 제품을 모아 성분 순서·근거·제품 유형을 바탕으로 비교해요. 표시된 점수는 성분 비교 지표이며 실제 함량이나 개인별 효과를 뜻하지 않아요." : "전체 상품은 등록된 기본 점수에 따라 진열해요. 성분을 선택하면 해당 성분의 순서·근거·제품 유형을 반영한 순위로 바뀌어요."} 사용자 리뷰점수는 별도로 집계합니다.</p></details>
        {selected && <Link href={`/ingredients/${selected.id}`} className="inline-flex items-center gap-1 font-semibold text-[#b5617f]">{selected.name} 성분 알아보기 <ArrowRight size={12} /></Link>}
      </div>
    </section>

    <div className="mt-7 grid gap-3 sm:grid-cols-2">
      <Link href="/skin-check" className="flex items-center justify-between gap-4 rounded-2xl border border-[#f0dce4] bg-[#fff5f8] p-5"><div><p className="flex items-center gap-1.5 text-xs font-bold text-[#b75879]"><Sparkles size={14} /> 나에게 맞는 성분을 모르겠다면</p><p className="mt-2 text-xs text-[#927984]">피부 체크로 내 관심 성분부터 찾아보세요.</p></div><ArrowRight size={17} className="shrink-0 text-[#bb5b7e]" /></Link>
      <Link href="/promotions" className="flex items-center justify-between gap-4 rounded-2xl border border-[#eedde4] bg-white p-5"><div><p className="flex items-center gap-2 text-xs font-bold text-[#745663]">새로운 브랜드를 만나는 화력 추천 <span className="rounded border border-[#e6c3d0] px-1.5 py-0.5 text-[9px] text-[#bb6685]">광고</span></p><p className="mt-2 text-xs text-[#927984]">관리자 추천 제품을 모아 봤어요.</p></div><ArrowRight size={17} className="shrink-0 text-[#bb5b7e]" /></Link>
    </div>
    {isHome && <section className="mt-10 border-t border-[#f1e4e9] pt-7"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold">관심 성분별로 둘러보기</h2><Link href="/ranking" className="text-xs text-[#b96684]">성분 랭킹 전체 <span aria-hidden="true">→</span></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{options.ingredients.filter((item) => item.productCount > 0).slice(0, 8).map((item) => <Link key={item.id} href={rankingHref("/ranking", { ingredient: item.id })} className="rounded-xl border border-[#eedee5] px-4 py-3 hover:bg-[#fff7fa]"><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-[10px] text-[#9b7c8b]">{item.role} <span className="mx-1">·</span> {item.productCount}개 제품</p></Link>)}</div></section>}
  </div>;
}
