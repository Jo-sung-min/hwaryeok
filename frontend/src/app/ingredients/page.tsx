import Link from "next/link";
import { connection } from "next/server";
import { BookOpen, Check, ChevronLeft, ChevronRight, Search, TriangleAlert } from "lucide-react";
import { getIngredients, type IngredientQuery } from "@/lib/api";
import type { IngredientStatus } from "@/lib/types";

type SearchParams = Promise<{
  query?: string | string[];
  status?: string | string[];
  tag?: string | string[];
  page?: string | string[];
  sort?: string | string[];
  direction?: string | string[];
}>;

type PageValues = {
  query: string;
  status?: IngredientStatus;
  tag: string;
  page: number;
  sort: NonNullable<IngredientQuery["sort"]>;
  direction: NonNullable<IngredientQuery["direction"]>;
};

const statusFilters: Array<{ label: string; value?: IngredientStatus }> = [
  { label: "전체 성분" },
  { label: "피부에 도움", value: "GOOD" },
  { label: "주의해서 보기", value: "CAUTION" },
  { label: "기본 성분", value: "NEUTRAL" },
];

const tagFilters = ["보습", "진정", "장벽", "피부톤"];

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageHref(values: PageValues, overrides: Partial<PageValues>) {
  const next = { ...values, ...overrides };
  const search = new URLSearchParams();
  if (next.query) search.set("query", next.query);
  if (next.status) search.set("status", next.status);
  if (next.tag) search.set("tag", next.tag);
  if (next.page > 0) search.set("page", String(next.page + 1));
  if (next.sort !== "name") search.set("sort", next.sort);
  if (next.direction !== "asc") search.set("direction", next.direction);
  const suffix = search.toString();
  return suffix ? `/ingredients?${suffix}` : "/ingredients";
}

function statusLabel(status: IngredientStatus) {
  if (status === "GOOD") return "피부에 도움";
  if (status === "CAUTION") return "주의해서 보기";
  return "기본 성분";
}

export default async function IngredientsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const rawStatus = first(params.status).toUpperCase();
  const rawPage = Number(first(params.page));
  const rawSort = first(params.sort);
  const rawDirection = first(params.direction);

  const values: PageValues = {
    query: first(params.query).trim(),
    status: ["GOOD", "CAUTION", "NEUTRAL"].includes(rawStatus) ? rawStatus as IngredientStatus : undefined,
    tag: first(params.tag).trim(),
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage - 1 : 0,
    sort: ["name", "englishName", "role", "status"].includes(rawSort)
      ? rawSort as PageValues["sort"]
      : "name",
    direction: rawDirection === "desc" ? "desc" : "asc",
  };

  const result = await getIngredients({ ...values, size: 12 });
  const visiblePages = Array.from({ length: result.totalPages }, (_, index) => index)
    .filter((page) => Math.abs(page - result.page) <= 2);

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#74513f16] bg-[#f2e8d979] py-14 text-center md:py-20">
        <div className="container-page">
          <BookOpen className="mx-auto mb-5 text-[#a45a50]" size={30} strokeWidth={1.5} />
          <p className="eyebrow mb-4">INGREDIENT DICTIONARY</p>
          <h1 className="font-myeongjo text-4xl font-medium md:text-5xl">어려운 성분, 쉬운 우리말로</h1>
          <p className="mt-4 text-sm leading-7 text-[#786c63]">전문 용어 대신 어떤 일을 하는지, 내 피부에는 어떻게 느껴질지 차분히 알려드려요.</p>

          <form className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" action="/ingredients">
            <label className="flex h-14 flex-1 items-center gap-3 rounded-full border border-[#74513f24] bg-[#fffdf7] px-5 text-left">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">성분 검색</span>
              <input name="query" defaultValue={values.query} placeholder="궁금한 성분을 검색해보세요" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            {values.status && <input type="hidden" name="status" value={values.status} />}
            {values.tag && <input type="hidden" name="tag" value={values.tag} />}
            <button className="ink-btn px-7" type="submit">검색하기</button>
          </form>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex flex-col justify-between gap-5 border-b border-[#74513f16] pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[.14em] text-[#8e7468]">상태로 보기</p>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const active = values.status === filter.value;
                return <Link key={filter.label} href={pageHref(values, { status: filter.value, page: 0 })} className={`rounded-full px-4 py-2.5 text-xs transition ${active ? "bg-[#37312c] text-white" : "border border-[#74513f20] bg-[#fffaf3] hover:border-[#74513f45]"}`}>{filter.label}</Link>;
              })}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold tracking-[.14em] text-[#8e7468] lg:text-right">기능으로 보기</p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link href={pageHref(values, { tag: "", page: 0 })} className={`rounded-full px-4 py-2.5 text-xs transition ${!values.tag ? "bg-[#9b4a45] text-white" : "border border-[#74513f20] bg-[#fffaf3]"}`}>전체 기능</Link>
              {tagFilters.map((tag) => <Link key={tag} href={pageHref(values, { tag, page: 0 })} className={`rounded-full px-4 py-2.5 text-xs transition ${values.tag === tag ? "bg-[#9b4a45] text-white" : "border border-[#74513f20] bg-[#fffaf3] hover:border-[#74513f45]"}`}>{tag}</Link>)}
            </div>
          </div>
        </div>

        <div className="my-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-[#7a6c63]"><strong className="text-[#a54f49]">{result.totalElements}</strong>개의 성분을 찾았어요</p>
          <form action="/ingredients" className="flex items-center gap-2">
            {values.query && <input type="hidden" name="query" value={values.query} />}
            {values.status && <input type="hidden" name="status" value={values.status} />}
            {values.tag && <input type="hidden" name="tag" value={values.tag} />}
            <label htmlFor="ingredient-sort" className="text-xs text-[#766960]">정렬</label>
            <select id="ingredient-sort" name="sort" defaultValue={values.sort} className="rounded-full border border-[#74513f24] bg-[#fffaf3] px-4 py-2.5 text-xs outline-none">
              <option value="name">가나다순</option>
              <option value="role">역할순</option>
              <option value="status">상태순</option>
            </select>
            <button type="submit" className="rounded-full border border-[#74513f24] bg-[#fffaf3] px-4 py-2.5 text-xs font-semibold">적용</button>
          </form>
        </div>

        {result.content.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {result.content.map((ingredient) => {
              const caution = ingredient.status === "CAUTION";
              return (
                <Link href={`/ingredients/${ingredient.id}`} key={ingredient.id} className="paper-card group rounded-[24px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(78,56,43,.11)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-myeongjo text-xl font-semibold group-hover:text-[#9b4a45]">{ingredient.name}</h2>
                        {caution ? <TriangleAlert size={16} className="text-[#b47460]" /> : <Check size={16} className="text-[#72806b]" />}
                      </div>
                      <p className="mt-1 text-[11px] text-[#9a8a7e]">{ingredient.englishName}</p>
                      <p className="mt-3 text-xs font-semibold text-[#9a6556]">{ingredient.role}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] ${caution ? "bg-[#d3957d1c] text-[#a1614c]" : "bg-[#84917a1a] text-[#65715f]"}`}>{statusLabel(ingredient.status)}</span>
                  </div>
                  <p className="mt-5 line-clamp-2 text-sm leading-7 text-[#71655d]">{ingredient.description}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">{ingredient.tags.map((tag) => <span key={tag} className="rounded-full bg-[#a54f490b] px-2.5 py-1 text-[10px] text-[#8e5a50]">#{tag}</span>)}</div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="paper-card rounded-[28px] py-20 text-center">
            <span className="text-4xl text-[#d08f7c]">花</span>
            <h2 className="mt-5 font-myeongjo text-2xl">조건에 맞는 성분이 없어요</h2>
            <p className="mt-2 text-sm text-[#81736a]">검색어나 필터를 조금 줄여보세요.</p>
            <Link href="/ingredients" className="line-btn mt-6">조건 초기화</Link>
          </div>
        )}

        {result.totalPages > 1 && (
          <nav aria-label="성분 목록 페이지" className="mt-10 flex items-center justify-center gap-2">
            {result.page > 0 && <Link href={pageHref(values, { page: result.page - 1 })} className="grid h-10 w-10 place-items-center rounded-full border border-[#74513f20] bg-[#fffaf3]" aria-label="이전 페이지"><ChevronLeft size={16} /></Link>}
            {visiblePages.map((page) => <Link key={page} href={pageHref(values, { page })} aria-current={page === result.page ? "page" : undefined} className={`grid h-10 w-10 place-items-center rounded-full text-xs ${page === result.page ? "bg-[#37312c] text-white" : "border border-[#74513f20] bg-[#fffaf3]"}`}>{page + 1}</Link>)}
            {result.hasNext && <Link href={pageHref(values, { page: result.page + 1 })} className="grid h-10 w-10 place-items-center rounded-full border border-[#74513f20] bg-[#fffaf3]" aria-label="다음 페이지"><ChevronRight size={16} /></Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
