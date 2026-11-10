import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { AdminHeader, adminCardClass } from "@/app/admin/admin-ui";
import { getAdminReviews } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import type { AdminReviewKind, AdminReviewListItem, ReviewDetail } from "@/lib/types";
import { AdminReviewDeleteForm } from "./admin-review-delete-form";

export const metadata: Metadata = {
  title: "리뷰 관리",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;
const reviewKinds: { value: AdminReviewKind; label: string; short: string }[] = [
  { value: "ALL", label: "전체", short: "전체" },
  { value: "USER", label: "사용자 리뷰", short: "사용자" },
  { value: "SAMPLE", label: "화면 예시", short: "예시" },
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
  if (user.role !== "ADMIN") redirect("/");
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();

  let data = await getAdminReviews(accessToken, { q: q || undefined, kind, page: requestedPage, size: PAGE_SIZE })
    .catch((error) => recoverAdminPageSession(error, returnTo));
  if (data.page > 0 && data.page >= data.totalPages) {
    data = await getAdminReviews(accessToken, { q: q || undefined, kind, page: Math.max(0, data.totalPages - 1), size: PAGE_SIZE })
      .catch((error) => recoverAdminPageSession(error, returnTo));
  }

  return (
    <div>
      <AdminHeader title="리뷰" meta={`${data.totalElements.toLocaleString("ko-KR")}개`} />

      {/* The site navigation header is sticky at 63px (62px + 1px border), so pin the search right below it. */}
      <div className="sticky top-[63px] z-20 bg-[#f5f5f7]/85 py-3 backdrop-blur-xl backdrop-saturate-150">
        <form action="/admin/reviews" method="get" role="search" className="container-page flex items-center gap-2">
          <input type="hidden" name="kind" value={kind} />
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">제품, 브랜드, 작성자 또는 리뷰 내용 검색</span>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              name="q"
              type="text"
              enterKeyHint="search"
              defaultValue={q}
              maxLength={100}
              autoComplete="off"
              placeholder="제품·작성자 검색"
              className="h-10 w-full rounded-xl bg-white pl-9 pr-9 text-[14px] text-[#1d1d1f] outline-none ring-1 ring-black/[.06] placeholder:text-[#86868b] focus:ring-2 focus:ring-[#0071e3]/40"
            />
            {q && (
              <Link href={adminReviewsHref("", kind, 0)} aria-label="검색어 지우기" className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-[#c7c7cc] text-white transition hover:bg-[#aeaeb2]">
                <X size={12} strokeWidth={2.5} />
              </Link>
            )}
          </label>
          <nav aria-label="리뷰 구분" className="flex shrink-0 rounded-xl bg-[#e8e8ed] p-1">
            {reviewKinds.map((option) => {
              const active = kind === option.value;
              return (
                <Link
                  key={option.value}
                  href={adminReviewsHref(q, option.value, 0)}
                  aria-current={active ? "page" : undefined}
                  title={option.label}
                  className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[13px] font-medium transition sm:px-3 ${active ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,.1)]" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
                >
                  {option.short}
                </Link>
              );
            })}
          </nav>
        </form>
      </div>

      <main className="container-page mt-2">
        {data.content.length > 0 ? (
          <ol className={`${adminCardClass} divide-y divide-black/[.06] overflow-hidden`}>
            {data.content.map((review) => <AdminReviewRow key={review.id} review={review} />)}
          </ol>
        ) : (
          <div className="py-20 text-center">
            <p className="text-[15px] font-medium">조건에 맞는 리뷰가 없어요</p>
            {(q || kind !== "ALL" || requestedPage > 0) && <Link href="/admin/reviews" className="mt-3 inline-block text-[14px] text-[#0071e3]">전체 리뷰 보기</Link>}
          </div>
        )}

        <AdminReviewPagination data={data} q={q} kind={kind} />
      </main>
    </div>
  );
}

function AdminReviewRow({ review }: { review: AdminReviewListItem }) {
  const productName = `${review.product.brand} ${review.product.name}`;

  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition hover:bg-black/[.02] sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium">{productName}</span>
            <span className="mt-0.5 block truncate text-[13px] text-[#86868b]">{review.author.nickname}</span>
          </span>
          <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-[#c7c7cc] transition group-open:rotate-180" />
        </summary>

        <div className="space-y-3 px-4 pb-5 sm:px-5">
          <p className="flex flex-wrap gap-x-2.5 gap-y-1 text-[12px] text-[#86868b]">
            <span className="font-medium text-[#1d1d1f]">{review.sampleReview ? "화면 예시" : "사용자 리뷰"}</span>
            <span>{Number(review.totalScore).toFixed(1)}점</span>
            <span>{review.skinType} 피부</span>
            <span>{usagePeriodLabels[review.usagePeriod]}</span>
            <time dateTime={review.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(review.createdAt))}</time>
            <span>상품 {publicationLabels[review.product.publicationStatus]}</span>
          </p>
          <p className="whitespace-pre-wrap break-words text-[14px] leading-6 text-[#424245]">{review.content}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4 text-[13px]">
              <Link href={`/products/${encodeURIComponent(review.product.id)}`} className="text-[#0071e3] hover:underline">상품 보기</Link>
              {!review.sampleReview && review.author.id && <Link href={`/reviewers/${encodeURIComponent(review.author.id)}`} className="text-[#0071e3] hover:underline">작성자 보기</Link>}
            </div>
            <AdminReviewDeleteForm
              reviewId={review.id}
              productId={review.product.id}
              productName={productName}
              authorId={review.author.id}
              authorNickname={review.author.nickname}
              sampleReview={review.sampleReview}
            />
          </div>
        </div>
      </details>
    </li>
  );
}

function AdminReviewPagination({ data, q, kind }: { data: { page: number; totalPages: number; hasNext: boolean }; q: string; kind: AdminReviewKind }) {
  if (data.totalPages <= 1 && data.page === 0) return null;
  const pageLink = "inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-medium ring-1 ring-black/[.06] transition hover:bg-[#fafafa]";
  return (
    <nav aria-label="관리자 리뷰 목록 페이지" className="mt-6 flex items-center justify-center gap-2">
      {data.page > 0 && <Link href={adminReviewsHref(q, kind, data.page - 1)} className={pageLink}>이전</Link>}
      <span className="px-2 text-[13px] tabular-nums text-[#86868b]">{data.page + 1} / {Math.max(1, data.totalPages)}</span>
      {data.hasNext && <Link href={adminReviewsHref(q, kind, data.page + 1)} className={pageLink}>다음</Link>}
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
