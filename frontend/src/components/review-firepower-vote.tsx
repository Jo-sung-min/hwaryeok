"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Flame } from "lucide-react";
import { rateReviewAction, type ReviewRatingState } from "@/app/reviewers/actions";
import type { ReviewCommunityRating } from "@/lib/types";

const labels = ["도움이 적어요", "조금 도움이 돼요", "보통이에요", "도움이 돼요", "매우 도움이 돼요"];

export function ReviewFirepowerVote({ reviewId, productId, authorId, rating: initialRating, isAuthenticated, returnTo }: {
  reviewId: string; productId: string; authorId: string; rating: ReviewCommunityRating;
  isAuthenticated: boolean; returnTo: string;
}) {
  const [state, action, pending] = useActionState(rateReviewAction.bind(null, reviewId, productId, authorId), {} as ReviewRatingState);
  // Revalidated server props also reflect other users' votes and changed eligibility.
  const rating = initialRating;
  if (!rating) return null;
  return (
    <div className="mt-5 border-t border-[#efdce2] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1 font-bold text-[#b34a69]"><Flame size={15} /> 받은 리뷰 화력</span>
        <span className="text-[#857078]">{rating.averageScore === null ? "첫 평가를 기다려요" : `${rating.averageScore.toFixed(1)} / 5점 · ${rating.ratingCount}명 평가`}</span>
      </div>
      {!isAuthenticated ? (
        <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[#a44964] underline underline-offset-4">로그인하고 이 리뷰 평가하기</Link>
      ) : !rating.canRate ? (
        <p className="mt-3 text-xs leading-6 text-[#8a767e]">본인 리뷰는 평가할 수 없어요.</p>
      ) : (
        <form action={action} className="mt-3">
          <fieldset disabled={pending} key={`${rating.viewerScore ?? "none"}-${state.message ?? ""}`}>
            <legend className="mb-2 text-xs font-semibold text-[#6d5860]">이 리뷰가 얼마나 도움이 되었나요?</legend>
            <div className="grid grid-cols-5 gap-1.5">
              {labels.map((label, index) => <label key={label} title={label} className="grid min-h-11 cursor-pointer place-items-center rounded-xl border border-[#efd7df] bg-white text-sm font-bold text-[#96717f] has-[:checked]:border-[#bd5373] has-[:checked]:bg-[#bd5373] has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#ac4564]">
                <input className="sr-only" type="radio" name="score" value={index + 1} defaultChecked={rating.viewerScore === index + 1} aria-label={`${index + 1}점: ${label}`} />{index + 1}
              </label>)}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#948089]"><span>도움이 적어요</span><span>매우 도움이 돼요</span></div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button name="intent" value="rate" className="min-h-11 rounded-xl bg-[#fff0f5] px-4 text-xs font-bold text-[#a74765] disabled:opacity-50" disabled={pending}>{pending ? "반영 중…" : rating.viewerScore === null ? "화력 평가하기" : "내 평가 수정"}</button>
              {rating.viewerScore !== null && <button name="intent" value="remove" className="min-h-11 px-3 text-xs text-[#8f7b83] underline underline-offset-4" disabled={pending}>평가 취소</button>}
            </div>
          </fieldset>
        </form>
      )}
      {state.message && <p className={`mt-2 text-xs leading-6 ${state.success ? "text-[#84616e]" : "text-[#a33955]"}`} role={state.success ? "status" : "alert"}>{state.message}</p>}
      <p className="mt-2 text-[10px] leading-5 text-[#9a858e]">제품 점수가 아닌 리뷰의 도움 정도를 평가해요. 한 리뷰에 한 번, 수정·취소할 수 있어요.</p>
    </div>
  );
}
