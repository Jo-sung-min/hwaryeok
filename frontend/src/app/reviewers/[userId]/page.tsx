import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { ApiRequestError, getReviewerProfile, getReviewerReviews } from "@/lib/api";
import { getCurrentSession, readAuthTokens } from "@/lib/auth-session";
import { ReviewFirepowerVote } from "@/components/review-firepower-vote";
import { ReviewerFirepower } from "@/components/reviewer-firepower";
import { resolveProductImageUrl } from "@/lib/media";
import type { ProductTone, ReviewerReview } from "@/lib/types";

const usagePeriodLabels: Record<ReviewerReview["usagePeriod"], string> = {
  ONE_WEEK: "1주 이내 사용",
  TWO_WEEKS: "2주 정도 사용",
  ONE_MONTH: "1개월 정도 사용",
  THREE_MONTHS: "3개월 정도 사용",
  OVER_SIX_MONTHS: "6개월 이상 사용",
};

const productToneMap: Record<ProductTone, string> = {
  peach: "bg-[#fff0ed]",
  sage: "bg-[#fff7f9]",
  sand: "bg-[#fff5f1]",
  rose: "bg-[#fff0f4]",
  blue: "bg-[#fff6f8]",
};

type ReviewerPageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params }: Pick<ReviewerPageProps, "params">): Promise<Metadata> {
  const { userId } = await params;
  try {
    const data = await getReviewerReviews(userId, 0, 1);
    return {
      title: `${data.reviewer.nickname}님의 화장품 리뷰`,
      description: `${data.reviewer.nickname}님이 작성한 실제 사용 리뷰 ${data.reviewCount}개와 평균 리뷰점수를 확인하세요.`,
      alternates: { canonical: `/reviewers/${data.reviewer.id}` },
    };
  } catch {
    return { title: "리뷰 사용자를 찾을 수 없어요", robots: { index: false, follow: false } };
  }
}

export default async function ReviewerPage({ params, searchParams }: ReviewerPageProps) {
  const [{ userId }, query] = await Promise.all([params, searchParams]);
  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = safePage(requestedPage);

  try {
    const [session, tokens] = await Promise.all([getCurrentSession(), readAuthTokens()]);
    const [data, profile] = await Promise.all([getReviewerReviews(userId, page, 10, session ? tokens.accessToken : undefined), getReviewerProfile(userId)]);
    const averageScore = data.averageReviewScore === null ? "—" : Number(data.averageReviewScore).toFixed(1);

    return (
      <div className="min-h-screen pb-24">
        <section className="border-b border-[#efd8df] bg-[#fff8fa] py-8 sm:py-10 md:py-14">
          <div className="container-page">
            <Link href="/reviewers" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#77686d]"><ArrowLeft size={16} /> 리뷰어 랭킹</Link>
            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="flex items-center gap-4 sm:gap-5">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-[#edc6d1] bg-white text-2xl font-bold text-[#b44968] shadow-sm sm:h-20 sm:w-20 sm:text-3xl" aria-hidden="true">{data.reviewer.nickname.slice(0, 1)}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[.15em] text-[#b24b69]"><ShieldCheck size={14} /> REAL USER REVIEWS</p>
                  <h1 className="mt-2 break-words font-myeongjo text-3xl font-semibold sm:text-4xl">{data.reviewer.nickname}님의 리뷰</h1>
                  <p className="mt-3 inline-flex rounded-full border border-[#ebc7d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#a15070]">{profile.skinType ? `${profile.skinType === "민감" ? "민감성" : profile.skinType} 피부` : "피부타입 미등록"}</p>
                  <p className="mt-2 text-sm leading-6 text-[#7d6c72]">직접 남긴 제품별 리뷰와 점수를 모아 보여드려요.</p>
                </div>
              </div>

              <div className="grid min-w-[240px] grid-cols-[1fr_auto] items-center gap-5 rounded-[24px] border border-[#edcbd5] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(104,50,67,.07)] sm:px-6 sm:py-5">
                <div>
                  <p className="text-[11px] font-bold text-[#96737e]">제품에 매긴 평균 리뷰점수</p>
                  <p className="mt-1 text-xs text-[#9a8990]">작성 리뷰 {data.reviewCount.toLocaleString("ko-KR")}개 기준</p>
                </div>
                <div className="text-right"><strong className="font-myeongjo text-4xl font-semibold text-[#bd4d6f]">{averageScore}</strong><span className="ml-1 text-xs text-[#8d7c82]">/ 100</span></div>
              </div>
            </div>
            <div className="mt-6 grid gap-5 rounded-2xl border border-[#edd5df] bg-white p-5 sm:grid-cols-[minmax(180px,1fr)_2fr] sm:items-center sm:gap-8 sm:p-6">
              <ReviewerFirepower score={profile.reviewFirepower} />
              <div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#896f7b]"><span>전체 순위 <strong className="text-[#aa4b6d]">{profile.rank === null ? "집계 전" : `${profile.rank}위`}</strong></span><span>평가자 {profile.uniqueRaterCount}명</span><span>받은 평가 {profile.receivedRatingCount}개</span><span>도움 평가 {profile.averageReceivedRating === null ? "—" : profile.averageReceivedRating.toFixed(1)} / 5</span></div><p className="mt-3 text-[11px] leading-6 text-[#9a858e]">리뷰 화력은 다른 사용자가 평가한 도움 정도와 평가자 수로 계산해요. 제품에 매긴 점수와는 별개예요.</p></div>
            </div>
          </div>
        </section>

        <section className="container-page py-10 md:py-16">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="eyebrow">REVIEW HISTORY</p><h2 className="mt-2 font-myeongjo text-2xl font-semibold sm:text-3xl">작성한 화장품 리뷰</h2></div>
            <p className="flex items-center gap-1.5 text-xs text-[#88777d]"><CheckCircle2 size={14} className="text-[#bd5875]" /> 제품마다 한 사용자의 리뷰는 하나만 집계돼요.</p>
          </div>

          {data.content.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#ddb6c1] bg-[#fff8fa] px-6 py-16 text-center">
              <MessageCircle className="mx-auto text-[#c26a83]" size={28} />
              <h2 className="mt-4 font-myeongjo text-xl font-semibold">아직 작성한 리뷰가 없어요</h2>
              <p className="mt-2 text-sm leading-7 text-[#806f75]">사용해 본 제품의 솔직한 경험을 첫 리뷰로 알려주세요.</p>
              <Link href="/products" className="ink-btn mt-6">리뷰할 제품 찾기 <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <div className="grid gap-5">
              {data.content.map((review) => <ReviewCard key={review.id} review={review} authorId={userId} isAuthenticated={Boolean(session)} />)}
            </div>
          )}

          {data.totalPages > 1 && (
            <nav aria-label="리뷰 페이지" className="mt-9 flex items-center justify-center gap-2">
              {data.page > 0 && <Link href={`/reviewers/${data.reviewer.id}?page=${data.page - 1}`} className="line-btn !min-h-11">이전</Link>}
              <span className="px-3 text-xs font-semibold text-[#806f75]">{data.page + 1} / {data.totalPages}</span>
              {data.hasNext && <Link href={`/reviewers/${data.reviewer.id}?page=${data.page + 1}`} className="line-btn !min-h-11">다음</Link>}
            </nav>
          )}
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}

function ReviewCard({ review, authorId, isAuthenticated }: { review: ReviewerReview; authorId: string; isAuthenticated: boolean }) {
  const imageUrl = resolveProductImageUrl(review.product.imageUrl);
  return (
    <article className="grid overflow-hidden rounded-[26px] border border-[#efd8df] bg-white shadow-[0_9px_28px_rgba(101,53,67,.06)] sm:grid-cols-[190px_1fr]">
      <Link href={`/products/${review.product.id}`} className={`relative grid min-h-44 place-items-center overflow-hidden ${productToneMap[review.product.tone]}`} aria-label={`${review.product.brand} ${review.product.name} 제품 보기`}>
        {imageUrl ? <Image src={imageUrl} alt={`${review.product.brand} ${review.product.name}`} fill sizes="(max-width: 640px) 100vw, 190px" className="object-contain p-5" /> : <><UserRound size={32} className="text-[#cf8ca0]" /><span className="absolute bottom-4 text-[10px] font-bold tracking-[.12em] text-[#b76a80]">HWA:RYEOK REVIEW</span></>}
      </Link>
      <div className="min-w-0 p-5 sm:p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a56a7b]">{review.product.brand} · {review.product.category}</p><Link href={`/products/${review.product.id}`} className="mt-1 block font-myeongjo text-lg font-semibold leading-snug hover:text-[#b54768] sm:text-xl">{review.product.name}</Link></div>
          <div className="shrink-0 rounded-2xl bg-[#fff0f4] px-3 py-2 text-right"><strong className="font-myeongjo text-2xl text-[#b94769]">{Number(review.totalScore).toFixed(1)}</strong><p className="text-[9px] font-semibold text-[#98737e]">리뷰점수</p></div>
        </div>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#61555a] [overflow-wrap:anywhere]">{review.content}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#f0dfe4] pt-4 text-[11px] text-[#88787d]">
          <span className="rounded-full bg-[#fff3f6] px-2.5 py-1">{review.skinType}</span>
          <span className="rounded-full bg-[#fff3f6] px-2.5 py-1">{usagePeriodLabels[review.usagePeriod]}</span>
          <span className="rounded-full bg-[#fff3f6] px-2.5 py-1">{review.repurchaseYn ? "재구매 의향 있음" : "재구매 고민 중"}</span>
          <time dateTime={review.createdAt} className="ml-auto">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(review.createdAt))}</time>
        </div>
        <ReviewFirepowerVote reviewId={review.id} productId={review.product.id} authorId={authorId} rating={review.communityRating} isAuthenticated={isAuthenticated} returnTo={`/reviewers/${authorId}`} />
      </div>
    </article>
  );
}

function safePage(value: string | undefined) {
  const parsed = Number(value ?? "0");
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 100000 ? parsed : 0;
}
