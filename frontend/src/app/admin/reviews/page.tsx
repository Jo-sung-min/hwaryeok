import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageSquareText, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { getAdminReviews } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import type { AdminReviewKind, AdminReviewListItem, ReviewDetail } from "@/lib/types";
import { AdminReviewDeleteForm } from "./admin-review-delete-form";

export const metadata: Metadata = {
  title: "리뷰 관리",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;
const reviewKinds: { value: AdminReviewKind; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "USER", label: "사용자 리뷰" },
  { value: "SAMPLE", label: "화면 예시" },
];
const usagePeriodLabels: Record<ReviewDetail["usagePeriod"], string> = {
  ONE_WEEK: "1주 이내",
  TWO_WEEKS: "2주 정도",
  ONE_MONTH: "1개월 정도",
  THREE_MONTHS: "3개월 정도",
  OVER_SIX_MONTHS: "6개월 이상",
};
const publicationLabels = { DRAFT: "초안", PUBLISHED: "공개", HIDDEN: "숨김" } as const;

type SearchParams = {
  q?: string | string[];
  kind?: string | string[];
  page?: string | string[];
};

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const search = await searchParams;
  const q = first(search.q).trim().slice(0, 100);
  const kind = readKind(search.kind);
  const requestedPage = readPage(search.page);
  const returnTo = adminReviewsHref(q, kind, requestedPage);
  const user = await requireSession(returnTo);
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();

  let data = await getAdminReviews(accessToken, { q: q || undefined, kind, page: requestedPage, size: PAGE_SIZE })
    .catch((error) => recoverAdminPageSession(error, returnTo));
  if (data.page > 0 && data.page >= data.totalPages) {
    data = await getAdminReviews(accessToken, { q: q || undefined, kind, page: Math.max(0, data.totalPages - 1), size: PAGE_SIZE })
      .catch((error) => recoverAdminPageSession(error, returnTo));
  }

  return (
    <div className="min-h-screen pb-28">
      <section className="border-b border-[#eacdd4] bg-[#fff2f5] py-9 md:py-12">
        <div className="container-page">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#78666c]"><ArrowLeft size={16} /> 관리자 센터</Link>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-2">REVIEW MANAGEMENT</p>
              <h1 className="font-myeongjo text-3xl font-bold sm:text-4xl">리뷰 관리</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#77666c]">사용자 리뷰와 제품별 화면 예시를 한곳에서 확인하세요. 스팸, 욕설, 개인정보 노출처럼 운영 원칙을 벗어난 리뷰만 신중하게 삭제해 주세요.</p>
            </div>
            <span className="inline-flex self-start items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#954b5f]"><ShieldCheck size={15} /> 관리자 전용</span>
          </div>
        </div>
      </section>

      <main className="container-page py-8 md:py-10">
        <section aria-label="리뷰 검색과 구분 필터" className="rounded-[22px] border border-[#ead9df] bg-white p-4 sm:p-5">
          <form action="/admin/reviews" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="kind" value={kind} />
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">제품, 브랜드, 작성자 또는 리뷰 내용 검색</span>
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a17d8b]" />
              <input name="q" defaultValue={q} maxLength={100} autoComplete="off" className="input min-h-12 pl-11" placeholder="제품·브랜드·작성자·리뷰 내용 검색" />
            </label>
            <button type="submit" className="ink-btn min-h-12 shrink-0"><Search size={16} /> 검색</button>
            {(q || kind !== "ALL") && <Link href="/admin/reviews" className="line-btn min-h-12 shrink-0">초기화</Link>}
          </form>
          <nav aria-label="리뷰 구분" className="mt-4 flex flex-wrap gap-2 border-t border-[#f1e5e9] pt-4">
            {reviewKinds.map((option) => (
              <Link
                key={option.value}
                href={adminReviewsHref(q, option.value, 0)}
                aria-current={kind === option.value ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full border px-4 text-xs font-semibold transition ${kind === option.value ? "border-[#cf7d99] bg-[#fff0f5] text-[#aa4669]" : "border-[#eadce1] bg-white text-[#846f78] hover:border-[#d9a8b8]"}`}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </section>

        <div className="mb-5 mt-8 flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow mb-2">REVIEWS</p><h2 className="font-myeongjo text-2xl font-bold">{q ? `‘${q}’ 검색 결과` : reviewKinds.find((item) => item.value === kind)?.label} <span className="ml-1 text-base font-semibold text-[#b17288]">{data.totalElements.toLocaleString("ko-KR")}개</span></h2></div>
          <p className="text-xs text-[#8b747d]">최신 등록순 · 삭제 후 복구할 수 없어요</p>
        </div>

        {data.content.length > 0 ? (
          <ol className="divide-y divide-[#f0e2e7] overflow-hidden rounded-[24px] border border-[#ead7de] bg-white">
            {data.content.map((review) => <AdminReviewRow key={review.id} review={review} />)}
          </ol>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#dfc6d0] bg-[#fffafb] px-5 py-14 text-center">
            <MessageSquareText className="mx-auto text-[#c16a88]" size={29} />
            <h3 className="mt-4 text-lg font-bold">조건에 맞는 리뷰가 없어요</h3>
            <p className="mt-2 text-sm leading-6 text-[#89737c]">검색어 또는 리뷰 구분을 바꿔 다시 확인해 주세요.</p>
            {(q || kind !== "ALL" || requestedPage > 0) && <Link href="/admin/reviews" className="line-btn mt-5">전체 리뷰 보기</Link>}
          </div>
        )}

        <AdminReviewPagination data={data} q={q} kind={kind} />
      </main>
    </div>
  );
}

function AdminReviewRow({ review }: { review: AdminReviewListItem }) {
  const author = review.sampleReview || !review.author.id
    ? <span className="inline-flex items-center gap-1.5 font-semibold text-[#65575d]"><Sparkles size={13} className="text-[#bd6582]" />{review.author.nickname}</span>
    : <Link href={`/reviewers/${encodeURIComponent(review.author.id)}`} className="inline-flex items-center gap-1.5 font-semibold text-[#9f4564] underline decoration-[#e6b5c5] underline-offset-4"><UserRound size={13} />{review.author.nickname}</Link>;

  return (
    <li>
      <article className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${review.sampleReview ? "bg-[#fff0f5] text-[#ae4e70]" : "bg-[#edf5ef] text-[#52705b]"}`}>{review.sampleReview ? "화면 예시" : "사용자 리뷰"}</span>
            {review.sampleReview && <span className="text-[10px] font-semibold text-[#987780]">점수·랭킹 집계 제외</span>}
            <span className="rounded-full bg-[#f4f1f2] px-2.5 py-1 text-[10px] font-semibold text-[#796b70]">{review.product.category}</span>
            <span className="text-[10px] text-[#9b8990]">{publicationLabels[review.product.publicationStatus]}</span>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={`/products/${encodeURIComponent(review.product.id)}`} className="break-words font-myeongjo text-xl font-bold transition hover:text-[#a44766]">{review.product.brand} · {review.product.name}</Link>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#84737a]">{author}<span aria-hidden="true">·</span><span>{review.skinType} 피부</span><span aria-hidden="true">·</span><span>{usagePeriodLabels[review.usagePeriod]}</span></p>
            </div>
            <div className="shrink-0 text-left sm:text-right"><strong className="font-myeongjo text-2xl text-[#a04462]">{Number(review.totalScore).toFixed(1)}</strong><p className="text-[9px] text-[#927f86]">{review.sampleReview ? "화면 예시 점수" : "리뷰점수"}</p></div>
          </div>

          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#65595e]">{review.content}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#938188]">
            <span>{review.repurchaseYn ? "재구매 의향 있음" : "재구매 고민 중"}</span>
            <time dateTime={review.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(review.createdAt))}</time>
            <span>{review.sampleReview ? "도움 평가 대상 아님" : review.communityAverageScore === null ? "도움 평가 대기" : `도움 평가 ${review.communityAverageScore.toFixed(1)} / 5 · ${review.communityRatingCount}명`}</span>
          </div>
        </div>

        <AdminReviewDeleteForm
          reviewId={review.id}
          productId={review.product.id}
          productName={`${review.product.brand} ${review.product.name}`}
          authorId={review.author.id}
          authorNickname={review.author.nickname}
          sampleReview={review.sampleReview}
        />
      </article>
    </li>
  );
}

function AdminReviewPagination({ data, q, kind }: { data: { page: number; totalPages: number; hasNext: boolean }; q: string; kind: AdminReviewKind }) {
  if (data.totalPages <= 1 && data.page === 0) return null;
  return (
    <nav aria-label="관리자 리뷰 목록 페이지" className="mt-8 flex items-center justify-center gap-4">
      {data.page > 0 && <Link href={adminReviewsHref(q, kind, data.page - 1)} className="line-btn !min-h-11">이전</Link>}
      <span className="text-xs text-[#917883]">{data.page + 1} / {Math.max(1, data.totalPages)}</span>
      {data.hasNext && <Link href={adminReviewsHref(q, kind, data.page + 1)} className="line-btn !min-h-11">다음 <ArrowRight size={14} /></Link>}
    </nav>
  );
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function readKind(value: string | string[] | undefined): AdminReviewKind {
  const kind = first(value);
  return reviewKinds.some((item) => item.value === kind) ? kind as AdminReviewKind : "ALL";
}

function readPage(value: string | string[] | undefined) {
  const page = Number(first(value));
  return Number.isSafeInteger(page) && page >= 1 && page <= 100000 ? page - 1 : 0;
}

function adminReviewsHref(q: string, kind: AdminReviewKind, page: number) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (kind !== "ALL") search.set("kind", kind);
  if (page > 0) search.set("page", String(page + 1));
  return search.size ? `/admin/reviews?${search}` : "/admin/reviews";
}
