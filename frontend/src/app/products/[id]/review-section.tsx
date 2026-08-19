"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { BarChart3, Check, MessageCircle, Send, Sparkles } from "lucide-react";
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
    <section className="container-page pb-14 md:pb-20" id="reviews">
      <div className="overflow-hidden rounded-[26px] border border-[#e4afbb42] bg-white/82 shadow-[0_24px_80px_rgba(116,72,64,.08)] sm:rounded-[32px]">
        <div className="grid border-b border-[#75564516] bg-gradient-to-br from-[#fff6f7] via-[#fffaf6] to-[#f2eee7] lg:grid-cols-[.78fr_1.22fr]">
          <div className="flex min-h-64 flex-col justify-between p-6 sm:p-8 md:p-10">
            <div>
              <div className="flex items-center gap-2 text-[#a5545e]"><MessageCircle size={18} /><p className="eyebrow">HWA:RYEOK REVIEW</p></div>
              <h2 className="mt-4 font-myeongjo text-3xl font-semibold sm:text-4xl">사용자 리뷰점수</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#796c63]">{criteria.categoryName}에 꼭 맞는 {criteria.criteria.length}개 기준을 같은 방식으로 평가해 제품의 사용 경험을 비교해요.</p>
            </div>
            <div className="mt-8 flex items-end gap-4">
              {summary.rankingStatus === "COLLECTING" ? (
                <div><strong className="font-myeongjo text-3xl text-[#9b4a45]">데이터 수집 중</strong><p className="mt-2 text-xs text-[#85756b]">{summary.reviewCount === 0 ? "첫 리뷰의 항목별 평가를 기다리고 있어요." : `리뷰 ${summary.reviewCount}개 · 10개부터 참고 점수를 공개해요.`}</p></div>
              ) : (
                <><strong className="font-myeongjo text-6xl font-semibold leading-none text-[#9b4a45]">{summary.reviewScore?.toFixed(1) ?? "—"}</strong><div className="pb-1 text-xs leading-5 text-[#85756b]">/ 100점<br />리뷰 {summary.reviewCount.toLocaleString("ko-KR")}개</div></>
              )}
            </div>
          </div>
          <div className="border-t border-[#75564516] bg-white/55 p-6 sm:p-8 md:p-10 lg:border-l lg:border-t-0">
            <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BarChart3 size={18} className="text-[#a5545e]" /><h3 className="font-myeongjo text-xl font-semibold">항목별 평균</h3></div><span className="rounded-full bg-[#a54f4910] px-3 py-1 text-[10px] font-bold text-[#934640]">각 5점 기준</span></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {summary.criteriaAverages.map((item) => (
                <div key={item.criteriaId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold text-[#594d47]">{item.name}</span><strong className="font-myeongjo text-base text-[#9b4a45]">{item.averageScore === null ? "—" : item.averageScore.toFixed(1)}</strong></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#cdbeb24d]"><div className="h-full rounded-full bg-gradient-to-r from-[#dda8b4] to-[#a65362]" style={{ width: `${item.averageScore === null ? 0 : item.averageScore * 20}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-2xl bg-[#fff6f7] px-4 py-3 text-xs leading-6 text-[#786961]">{rankingMessage(summary)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-6 sm:p-8 md:p-10">
            <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">SCORE YOUR EXPERIENCE</p><h3 className="mt-2 font-myeongjo text-2xl font-semibold">이 제품은 어떠셨나요?</h3></div><div className="shrink-0 rounded-2xl bg-[#a54f49] px-4 py-3 text-center text-white shadow-sm"><strong className="font-myeongjo text-2xl">{previewScore}</strong><span className="ml-1 text-xs">점</span><p className="mt-0.5 text-[9px] text-white/75">예상 리뷰점수</p></div></div>

            {!isAuthenticated ? (
              <div className="mt-8 rounded-[22px] border border-dashed border-[#bd8d8266] bg-[#fff8f7] p-6 text-center"><Sparkles className="mx-auto text-[#b96872]" size={22} /><p className="mt-3 text-sm leading-7 text-[#6e6159]">로그인하면 내 피부 타입과 함께 항목별 리뷰를 남길 수 있어요.</p><Link href={`/login?returnTo=${encodeURIComponent(`/products/${productId}#reviews`)}`} className="ink-btn mt-5">로그인하고 리뷰 쓰기</Link></div>
            ) : state.success ? (
              <div className="mt-8 rounded-[22px] bg-[#edf5ef] p-7 text-center text-[#4d7157]"><Check className="mx-auto" size={24} /><p className="mt-3 font-semibold">{state.message}</p></div>
            ) : (
              <form action={action} className="mt-8 space-y-7">
                <div className="grid gap-5">
                  {criteria.criteria.map((item) => (
                    <fieldset key={item.id} className="rounded-[20px] border border-[#75564518] bg-[#fffdf9] p-4 sm:p-5">
                      <legend className="sr-only">{item.name}</legend>
                      <div className="mb-3"><div className="flex items-center justify-between gap-3"><strong className="font-myeongjo text-lg">{item.name}</strong><span className="text-xs font-bold text-[#9b4a45]">{scores[item.id]} / 5</span></div><p className="mt-1 text-xs leading-5 text-[#83756b]">{item.description}</p></div>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <label key={score} className={`grid min-h-11 cursor-pointer place-items-center rounded-xl border text-sm font-bold transition ${scores[item.id] === score ? "border-[#a65362] bg-[#a65362] text-white shadow-sm" : "border-[#cdbeb25e] bg-white text-[#796d65] hover:border-[#b8757f]"}`}>
                            <input type="radio" name={`score_${item.id}`} value={score} checked={scores[item.id] === score} onChange={() => setScores((current) => ({ ...current, [item.id]: score }))} className="sr-only" aria-label={`${item.name} ${score}점, ${scoreLabels[score]}`} />
                            {score}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="피부 타입" error={state.fieldErrors?.skinType}><select name="skinType" defaultValue={normalizeSkinType(savedSkinType)} className="input" required><option value="">선택해 주세요</option>{["건성", "지성", "복합성", "수부지", "중성", "민감성"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                  <Field label="사용 기간" error={state.fieldErrors?.usagePeriod}><select name="usagePeriod" defaultValue="ONE_MONTH" className="input" required>{Object.entries(usagePeriodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                </div>
                <Field label="재구매 의향" error={state.fieldErrors?.repurchaseYn}><div className="grid grid-cols-2 gap-2">{[["true", "다시 구매할래요"], ["false", "재구매는 고민돼요"]].map(([value, label], index) => <label key={value} className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-[#cdbeb25e] bg-white px-3 text-center text-sm font-semibold has-[:checked]:border-[#a65362] has-[:checked]:bg-[#fff0f3] has-[:checked]:text-[#963f51]"><input type="radio" name="repurchaseYn" value={value} defaultChecked={index === 0} className="sr-only" />{label}</label>)}</div></Field>
                <Field label="사용 후기" error={state.fieldErrors?.content}><textarea name="content" minLength={10} maxLength={2000} rows={6} required className="input min-h-36 resize-y py-4" placeholder="어떤 피부에서 얼마나 사용했는지, 좋았던 점과 아쉬웠던 점을 구체적으로 알려주세요." /></Field>
                {(state.message || state.fieldErrors?.scores) && <p role="alert" className="rounded-2xl bg-[#fff0f2] p-4 text-sm text-[#a2475c]">{state.fieldErrors?.scores ?? state.message}</p>}
                <button disabled={pending} className="ink-btn w-full disabled:opacity-55">{pending ? "리뷰점수를 계산하는 중…" : <><Send size={17} /> {previewScore}점으로 리뷰 등록하기</>}</button>
              </form>
            )}
          </div>

          <div className="border-t border-[#75564516] bg-[#f8f4ef80] p-6 sm:p-8 md:p-10 lg:border-l lg:border-t-0">
            <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">RECENT REVIEWS</p><h3 className="mt-2 font-myeongjo text-2xl font-semibold">최근 사용 후기</h3></div><span className="text-xs text-[#86786e]">{summary.reviewCount.toLocaleString("ko-KR")}개</span></div>
            {summary.reviews.length === 0 ? (
              <div className="mt-8 rounded-[22px] border border-dashed border-[#bdaea26b] bg-white/65 p-8 text-center"><MessageCircle className="mx-auto text-[#bd8b84]" size={24} /><p className="mt-3 font-myeongjo text-lg font-semibold">아직 등록된 리뷰가 없어요</p><p className="mt-2 text-xs leading-6 text-[#82746a]">첫 번째 리뷰로 이 제품의 사용 경험을 알려주세요.</p></div>
            ) : (
              <div className="mt-7 grid gap-4">
                {summary.reviews.slice(0, 5).map((review) => (
                  <article key={review.id} className="rounded-[20px] border border-[#75564516] bg-white/82 p-5">
                    <div className="flex items-start justify-between gap-4"><div><strong className="text-sm">{review.authorNickname}</strong><p className="mt-1 text-[11px] text-[#8a7c72]">{review.skinType} · {usagePeriodLabels[review.usagePeriod]}</p></div><div className="text-right"><strong className="font-myeongjo text-2xl text-[#9b4a45]">{Number(review.totalScore).toFixed(1)}</strong><p className="text-[9px] text-[#8d7d73]">리뷰점수</p></div></div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#655a53]">{review.content}</p>
                    <div className="mt-4 flex items-center justify-between text-[10px] text-[#93857b]"><span>{review.repurchaseYn ? "재구매 의향 있음" : "재구매 고민 중"}</span><time dateTime={review.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(review.createdAt))}</time></div>
                  </article>
                ))}
              </div>
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
