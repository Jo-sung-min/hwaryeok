import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { getIngredients, type IngredientQuery } from "@/lib/api";
import type { IngredientStatus } from "@/lib/types";
import styles from "./ingredients.module.css";

export const metadata: Metadata = {
  title: "성분 사전",
  description: "화장품 성분의 역할과 피부별 특징을 알아보고, 성분별 제품 랭킹으로 이어서 탐색하세요.",
  alternates: { canonical: "/ingredients" },
};

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
const sortOptions: Array<{ label: string; value: PageValues["sort"] }> = [
  { label: "가나다순", value: "name" },
  { label: "영문명순", value: "englishName" },
  { label: "역할순", value: "role" },
  { label: "상태순", value: "status" },
];

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

function listHref(href: string) {
  return `${href}#ingredient-list`;
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
  const selectedStatus = statusFilters.find((filter) => filter.value === values.status)?.label ?? "전체 성분";
  const selectedSort = sortOptions.find((option) => option.value === values.sort)?.label ?? "가나다순";
  const activeFilterCount = Number(Boolean(values.status)) + Number(Boolean(values.tag)) + Number(values.sort !== "name") + Number(values.direction !== "asc");

  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={`container-page ${styles.headerInner}`}>
        <h1>성분 사전</h1>
        <p className={styles.intro}>궁금한 성분을 누르면 역할과 피부별 특징, 해당 성분의 제품 랭킹을 자세히 볼 수 있어요.</p>
        <form className={styles.searchForm} action="/ingredients#ingredient-list" role="search">
          <label className={styles.searchField}>
            <Search size={17} aria-hidden="true" focusable="false" />
            <span className="sr-only">성분 검색</span>
            <input type="search" name="query" defaultValue={values.query} placeholder="성분명 또는 영문명 검색" enterKeyHint="search" />
          </label>
          {values.status && <input type="hidden" name="status" value={values.status} />}
          {values.tag && <input type="hidden" name="tag" value={values.tag} />}
          {values.sort !== "name" && <input type="hidden" name="sort" value={values.sort} />}
          {values.direction !== "asc" && <input type="hidden" name="direction" value={values.direction} />}
          <button type="submit">검색</button>
        </form>
      </div>
    </header>

    <section className={`container-page ${styles.content}`} aria-labelledby="ingredient-list-title">
      <details className={styles.filters}>
        <summary>
          <span className={styles.filterTitle}><SlidersHorizontal size={15} aria-hidden="true" focusable="false" />필터·정렬</span>
          <span className={styles.filterValue}>{activeFilterCount > 0 ? `${activeFilterCount}개 적용` : `${selectedStatus} · ${selectedSort}`}</span>
          <ChevronDown className={styles.filterChevron} size={16} aria-hidden="true" focusable="false" />
        </summary>
        <div className={styles.filterBody}>
          <div className={styles.filterGroup}>
            <p>상태</p>
            <nav aria-label="성분 상태 필터">
              {statusFilters.map((filter) => {
                const active = values.status === filter.value;
                return <Link key={filter.label} href={listHref(pageHref(values, { status: filter.value, page: 0 }))} aria-current={active ? "page" : undefined} className={styles.chip}>{filter.label}</Link>;
              })}
            </nav>
          </div>
          <div className={styles.filterGroup}>
            <p>기능</p>
            <nav aria-label="성분 기능 필터">
              <Link href={listHref(pageHref(values, { tag: "", page: 0 }))} aria-current={!values.tag ? "page" : undefined} className={styles.chip}>전체 기능</Link>
              {tagFilters.map((tag) => <Link key={tag} href={listHref(pageHref(values, { tag, page: 0 }))} aria-current={values.tag === tag ? "page" : undefined} className={styles.chip}>{tag}</Link>)}
            </nav>
          </div>
          <div className={styles.filterGroup}>
            <p>정렬</p>
            <nav aria-label="성분 목록 정렬">
              {sortOptions.map((option) => <Link key={option.value} href={listHref(pageHref(values, { sort: option.value, page: 0 }))} aria-current={values.sort === option.value ? "page" : undefined} className={styles.chip}>{option.label}</Link>)}
            </nav>
          </div>
          <div className={styles.filterGroup}>
            <p>방향</p>
            <nav aria-label="성분 정렬 방향">
              {[{ label: "오름차순", value: "asc" }, { label: "내림차순", value: "desc" }].map((option) => <Link key={option.value} href={listHref(pageHref(values, { direction: option.value as PageValues["direction"], page: 0 }))} aria-current={values.direction === option.value ? "page" : undefined} className={styles.chip}>{option.label}</Link>)}
            </nav>
          </div>
        </div>
      </details>

      <div id="ingredient-list" className={styles.resultHeading}>
        <div>
          <h2 id="ingredient-list-title">{values.query ? `‘${values.query}’ 검색 결과` : "전체 성분"}</h2>
          <p>{result.totalElements.toLocaleString("ko-KR")}개 · {selectedSort} · {values.direction === "asc" ? "오름차순" : "내림차순"}</p>
        </div>
        {values.query && <Link href={listHref(pageHref(values, { query: "", page: 0 }))} className={styles.clearSearch}><X size={13} aria-hidden="true" focusable="false" />검색어 지우기</Link>}
      </div>

      {result.content.length > 0 ? <ul className={styles.list} data-ingredient-list>
        {result.content.map((ingredient) => {
          const caution = ingredient.status === "CAUTION";
          return <li key={ingredient.id} className={styles.listItem}>
            <Link href={`/ingredients/${encodeURIComponent(ingredient.id)}`} className={styles.ingredientLink} data-ingredient-detail-link>
              <div className={styles.ingredientCopy}>
                <div className={styles.nameLine}>
                  <h3>{ingredient.name}</h3>
                  {caution && <span className={styles.caution}>주의</span>}
                </div>
                <p className={styles.secondaryLine}>
                  {ingredient.englishName && <span lang="en" className={styles.englishName}>{ingredient.englishName}</span>}
                  <span className={styles.role}>{ingredient.role || "역할 정보 확인 중"}</span>
                </p>
              </div>
              <span className={styles.openDetail}><ChevronRight size={18} aria-hidden="true" focusable="false" /></span>
            </Link>
          </li>;
        })}
      </ul> : <div className={styles.empty} role="status">
        <h2>조건에 맞는 성분이 없어요</h2>
        <p>검색어나 필터를 조금 줄여보세요.</p>
        <Link href="/ingredients#ingredient-list">전체 성분 보기</Link>
      </div>}

      {result.totalPages > 1 && <nav aria-label="성분 목록 페이지" className={styles.pagination}>
        {result.page > 0 ? <Link href={listHref(pageHref(values, { page: result.page - 1 }))} aria-label="이전 페이지"><ChevronLeft size={16} aria-hidden="true" focusable="false" />이전</Link> : <span className={styles.disabledPage} aria-hidden="true"><ChevronLeft size={16} />이전</span>}
        <p><strong>{result.page + 1}</strong> / {result.totalPages}</p>
        {result.hasNext ? <Link href={listHref(pageHref(values, { page: result.page + 1 }))} aria-label="다음 페이지">다음<ChevronRight size={16} aria-hidden="true" focusable="false" /></Link> : <span className={styles.disabledPage} aria-hidden="true">다음<ChevronRight size={16} /></span>}
      </nav>}
    </section>
  </div>;
}
