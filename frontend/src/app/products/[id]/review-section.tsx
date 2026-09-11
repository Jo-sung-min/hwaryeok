"use client";

import Link from "next/link";
import { ReviewFirepowerVote } from "@/components/review-firepower-vote";
import { useActionState, useMemo, useState } from "react";
import { BarChart3, Check, ChevronDown, MessageCircle, Send, ShieldCheck, Sparkles } from "lucide-react";
import { createReviewAction, type ReviewActionState } from "./review-actions";
import type { ProductReviewSummary, ReviewCriteria, ReviewDetail } from "@/lib/types";

const scoreLabels = ["", "매우 아쉬워요", "아쉬워요", "보통이에요", "만족해요", "매우 만족해요"];
const usagePeriodLabels: Record<ReviewDetail["usagePeriod"], string> = {
  ONE_WEEK: "1주 이내",
  TWO_WEEKS: "2주 정도",
  ONE_MONTH: "1개월 정도",
  THREE_MONTHS: "3개월 정도",
  OVER_SIX_MONTHS: "6개월 이상",
};

type ReviewSectionProps = {
  productId: string;
  criteria: ReviewCriteria;
  summary: ProductReviewSummary;
  isAuthenticated: boolean;
  savedSkinType: string | null;
};

export function ReviewSection({ productId, criteria, summary, isAuthenticated, savedSkinType }: ReviewSectionProps) {
  const initialScores = Object.fromEntries(criteria.criteria.map((item) => [item.id, 3]));
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const initialState: ReviewActionState = { success: false, message: "" };
  const reviewAction = createReviewAction.bind(null, productId, criteria.criteria.map((item) => item.id));
  const [state, action, pending] = useActionState(reviewAction, initialState);
  const previewScore = useMemo(() => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round((total / (criteria.criteria.length * 5)) * 100);
  }, [criteria.criteria.length, scores]);

  return (
    <section className="container-page pb-10" id="reviews">
      <div className="overflow-hidden rounded-[20px] border border-[#eadde1] bg-white">
        <header className="flex items-start justify-between gap-4 border-b border-[#eee5e8] px-5 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[#ad4f70]"><MessageCircle size={16} /><p className="text-[10px] font-bold tracking-[.14em]">USER REVIEWS</p></div>
            <h2 className="mt-2 font-myeongjo text-2xl font-semibold">사용자 리뷰점수</h2>
            <p className="mt-1 text-xs leading-5 text-[#82747a]">{criteria.categoryName} 기준 · 피부 타입과 사용 기간을 함께 확인해요.</p>
          </div>
          <div className="shrink-0 text-right">
            <strong className="font-myeongjo text-2xl font-semibold text-[#a24361]">{summary.rankingStatus === "COLLECTING" ? "—" : summary.reviewScore?.toFixed(1) ?? "—"}</strong>
            <p className="mt-1 text-[10px] text-[#8d7d83]">{summary.reviewCount.toLocaleString("ko-KR")}개 {summary.rankingStatus === "COLLECTING" ? "· 집계 전" : "· 100점 만점"}</p>
          </div>
        </header>

        <div className="px-5 py-5">
          <div className="flex items-end justify-between gap-3"><h3 className="font-myeongjo text-xl font-semibold">최근 사용 후기</h3><span className="text-[11px] text-[#8c7d83]">최대 5개</span></div>
          {summary.reviews.length === 0 ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[#dfd2d6] px-4 py-5"><Sparkles className="shrink-0 text-[#c57b94]" size={20} /><div><p className="text-sm font-semibold">아직 등록된 리뷰가 없어요</p><p className="mt-1 text-xs leading-5 text-[#85767c]">첫 번째 리뷰로 실제 사용 경험을 알려주세요.</p></div></div>
          ) : (
            <div className="mt-4 grid gap-3">
              {summary.reviews.slice(0, 5).map((review) => (
                <article key={review.id} className="rounded-2xl border border-[#e9dfe2] bg-white p-4">
                  <div className="flex items-start justify-between gap-4"><div><Link href={`/reviewers/${review.authorId}`} className="inline-flex min-h-7 items-center text-sm font-bold text-[#9e405e] underline decoration-[#e5a9ba] underline-offset-4 transition hover:text-[#bd4d6f]" aria-label={`${review.authorNickname}님의 리뷰 목록 보기`}>{review.authorNickname}</Link><p className="mt-0.5 text-[11px] text-[#8a7c81]">{review.skinType} · {usagePeriodLabels[review.usagePeriod]}</p></div><div className="text-right"><strong className="font-myeongjo text-xl text-[#9b4a61]">{Number(review.totalScore).toFixed(1)}</strong><p className="text-[9px] text-[#8d7d83]">리뷰점수</p></div></div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#655a5e] [overflow-wrap:anywhere]">{review.content}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-[#93858a]"><span>{review.repurchaseYn ? "재구매 의향 있음" : "재구매 고민 중"}</span><time dateTime={review.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(review.createdAt))}</time></div>
                  <ReviewFirepowerVote reviewId={review.id} productId={productId} authorId={review.authorId} rating={review.communityRating} isAuthenticated={isAuthenticated} returnTo={`/products/${productId}#reviews`} />
                </article>
              ))}
            </div>
          )}

          {summary.reviewCount > 0 && (
            <details className="group mt-4 border-t border-[#eee5e8] pt-1">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#665b60]">
                <span className="flex items-center gap-2"><BarChart3 size={16} className="text-[#ad4f70]" /> 항목별 평균 보기</span>
                <ChevronDown size={16} className="transition group-open:rotate-180" />
              </summary>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-5 gap-y-4 pb-4 pt-2">
                {summary.criteriaAverages.map((item) => (
                  <div key={item.criteriaId}>
                    <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold text-[#594d52]">{item.name}</span><strong className="text-[#9b4a61]">{item.averageScore === null ? "—" : item.averageScore.toFixed(1)}</strong></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f1e8eb]"><div className="h-full rounded-full bg-[#cb6a88]" style={{ width: `${item.averageScore === null ? 0 : item.averageScore * 20}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="border-t border-[#f0e8ea] py-3 text-[11px] leading-5 text-[#81747a]">{rankingMessage(summary)}</p>
            </details>
          )}

          <div className="mt-5 border-t border-[#eee5e8] pt-5">
            {!isAuthenticated ? (
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-[#75686e]">로그인하면 내 피부 타입과 함께 리뷰를 남길 수 있어요.</p><Link href={`/login?returnTo=${encodeURIComponent(`/products/${productId}#reviews`)}`} className="line-btn">로그인하고 리뷰 쓰기</Link></div>
            ) : summary.viewerHasReviewed ? (
              <div className="flex items-center gap-2 text-sm text-[#765e67]"><Check size={17} className="text-[#a64b6a]" /><div><p className="font-semibold">이미 이 제품에 리뷰를 남겼어요.</p><p className="mt-0.5 text-[11px] text-[#8b7b81]">한 사용자는 한 제품에 하나의 리뷰만 작성할 수 있어요.</p></div></div>
            ) : state.success ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-[#52705b]" role="status"><Check size={17} />{state.message}</div>
            ) : (
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-xl border border-[#dfcdd3] px-4 text-sm font-bold text-[#9b405e]">
                  <span>이 제품은 어떠셨나요? 리뷰 작성하기</span>
                  <ChevronDown size={17} className="shrink-0 transition group-open:rotate-180" />
                </summary>
                <form action={action} className="space-y-6 pt-5">
                  <div className="flex items-center justify-between gap-3 border-b border-[#eee5e8] pb-4"><p className="text-xs leading-5 text-[#786a70]"><ShieldCheck size={14} className="mr-1.5 inline text-[#b14b69]" />한 제품에 하나의 리뷰만 등록할 수 있어요.</p><p className="shrink-0 text-xs"><strong className="font-myeongjo text-xl text-[#9b405e]">{previewScore}</strong>점 예상</p></div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-x-5 gap-y-2">
                    {criteria.criteria.map((item) => (
                      <fieldset key={item.id} className="border-b border-[#f0e8ea] py-3">
                        <legend className="sr-only">{item.name}</legend>
                        <div className="mb-3"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{item.name}</strong><span className="text-xs font-bold text-[#9b4a61]">{scores[item.id]} / 5</span></div><p className="mt-1 text-[11px] leading-5 text-[#83767b]">{item.description}</p></div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <label key={score} className={`grid min-h-10 cursor-pointer place-items-center rounded-lg border text-xs font-bold transition ${scores[item.id] === score ? "border-[#a6536c] bg-[#a6536c] text-white" : "border-[#ddd1d5] bg-white text-[#796d72] hover:border-[#b87588]"}`}>
                              <input type="radio" name={`score_${item.id}`} value={score} checked={scores[item.id] === score} onChange={() => setScores((current) => ({ ...current, [item.id]: score }))} className="sr-only" aria-label={`${item.name} ${score}점, ${scoreLabels[score]}`} />
                              {score}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                    <Field label="피부 타입" error={state.fieldErrors?.skinType}><select name="skinType" defaultValue={normalizeSkinType(savedSkinType)} className="input" required><option value="">선택해 주세요</option>{["건성", "지성", "복합성", "수부지", "중성", "민감성"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                    <Field label="사용 기간" error={state.fieldErrors?.usagePeriod}><select name="usagePeriod" defaultValue="ONE_MONTH" className="input" required>{Object.entries(usagePeriodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                  </div>
                  <Field label="재구매 의향" error={state.fieldErrors?.repurchaseYn}><div className="grid grid-cols-2 gap-2">{[["true", "다시 구매할래요"], ["false", "재구매는 고민돼요"]].map(([value, label], index) => <label key={value} className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-[#ddd1d5] bg-white px-3 text-center text-xs font-semibold has-[:checked]:border-[#a6536c] has-[:checked]:text-[#963f58]"><input type="radio" name="repurchaseYn" value={value} defaultChecked={index === 0} className="sr-only" />{label}</label>)}</div></Field>
                  <Field label="사용 후기" error={state.fieldErrors?.content}><textarea name="content" minLength={10} maxLength={2000} rows={5} required className="input min-h-32 resize-y py-3" placeholder="어떤 피부에서 얼마나 사용했는지, 좋았던 점과 아쉬웠던 점을 구체적으로 알려주세요." /></Field>
                  {(state.message || state.fieldErrors?.scores) && <p role="alert" className="rounded-lg border border-[#edd4db] px-4 py-3 text-sm text-[#a2475c]">{state.fieldErrors?.scores ?? state.message}</p>}
                  <button disabled={pending} className="ink-btn w-full disabled:opacity-55">{pending ? "리뷰점수를 계산하는 중…" : <><Send size={17} /> {previewScore}점으로 리뷰 등록하기</>}</button>
                </form>
              </details>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span>{children}{error && <span className="mt-1 block text-xs text-[#aa425a]">{error}</span>}</label>;
}

function normalizeSkinType(skinType: string | null) {
  if (skinType === "민감") return "민감성";
  return ["건성", "지성", "복합성", "수부지", "중성", "민감성"].includes(skinType ?? "") ? skinType ?? "" : "";
}

function rankingMessage(summary: ProductReviewSummary) {
  if (summary.rankingStatus === "OFFICIAL") return `리뷰 ${summary.reviewCount.toLocaleString("ko-KR")}개의 평균으로 공식 리뷰 순위에 반영되는 점수예요.`;
  if (summary.rankingStatus === "REFERENCE") return `현재는 참고 점수예요. 리뷰 ${summary.minimumOfficialReviewCount}개부터 공식 순위에 반영돼요.`;
  return `리뷰가 10개 모이기 전까지는 데이터 수집 중으로 표시해요. 소수 의견이 순위를 크게 흔들지 않도록 한 기준이에요.`;
}
