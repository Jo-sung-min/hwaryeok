"use client";

import {
  Check,
  ChevronDown,
  ExternalLink,
  FileSearch,
  Link2,
  LoaderCircle,
  Search,
  ShieldCheck,
  ShieldX,
  Unlink,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  removeIngredientRegulationReviewAction,
  saveIngredientRegulationReviewAction,
  searchIngredientRegulationCandidatesAction,
  type IngredientRegulationActionState,
} from "@/app/admin/data-sources/actions";
import type { AdminIngredientRegulationReview, Ingredient, IngredientRegulationCandidate } from "@/lib/types";

const initialState: IngredientRegulationActionState = { success: false, message: "" };

export function IngredientRegulationReviewBoard({
  ingredients,
  initialReviews,
}: {
  ingredients: Ingredient[];
  initialReviews: AdminIngredientRegulationReview[];
}) {
  return (
    <div className="mt-6 space-y-3">
      {ingredients.map((ingredient) => (
        <IngredientReviewItem
          key={ingredient.id}
          ingredient={ingredient}
          initialReviews={initialReviews.filter((review) => review.ingredientId === ingredient.id)}
        />
      ))}
    </div>
  );
}

function IngredientReviewItem({
  ingredient,
  initialReviews,
}: {
  ingredient: Ingredient;
  initialReviews: AdminIngredientRegulationReview[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [searchState, searchAction, searchPending] = useActionState(
    searchIngredientRegulationCandidatesAction.bind(null, ingredient.id),
    initialState,
  );

  useEffect(() => setReviews(initialReviews), [initialReviews]);

  function addReview(review: AdminIngredientRegulationReview) {
    setReviews((current) => [review, ...current.filter((item) => item.sourceRecordId !== review.sourceRecordId)]);
  }

  function removeReview(sourceRecordId: string) {
    setReviews((current) => current.filter((item) => item.sourceRecordId !== sourceRecordId));
  }

  return (
    <details className="group rounded-[22px] border border-[#dfb4bf52] bg-[#fffafb] open:bg-white">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-myeongjo text-lg text-[#514348]">{ingredient.name}</strong>
            <span className="text-[10px] text-[#958188]">{ingredient.englishName}</span>
            {reviews.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f3eb] px-2.5 py-1 text-[10px] font-bold text-[#52705a]">
                <ShieldCheck size={11} /> 공개 {reviews.length}건
              </span>
            )}
          </div>
          <p className="mt-1 text-[10px] text-[#958188]">후보 확인과 공개 연결을 여기서 관리해요.</p>
        </div>
        <ChevronDown size={18} className="shrink-0 text-[#a06b7a] transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#efdce1] px-5 pb-5 pt-4">
        {reviews.length > 0 && (
          <div className="mb-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#67816e]">검수 완료 · 사용자 공개 중</p>
            {reviews.map((review) => (
              <VerifiedReviewCard key={review.sourceRecordId} review={review} onRemoved={removeReview} />
            ))}
          </div>
        )}

        <form action={searchAction} className="flex flex-col gap-2 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">식약처 사용조건 성분명 검색</span>
            <span className="flex min-h-11 items-center gap-2 rounded-xl border border-[#d9a8b54d] bg-white px-3 focus-within:border-[#b86178]">
              <Search size={15} className="shrink-0 text-[#9e6071]" />
              <input
                name="query"
                required
                minLength={2}
                maxLength={120}
                defaultValue={ingredient.name}
                placeholder="표준명 또는 영문명"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </span>
          </label>
          <button type="submit" disabled={searchPending} className="line-btn min-h-11 shrink-0 disabled:cursor-wait disabled:opacity-55">
            {searchPending ? <LoaderCircle size={15} className="animate-spin" /> : <FileSearch size={15} />}
            {searchPending ? "후보 검색 중" : "식약처 후보 찾기"}
          </button>
        </form>

        <ActionMessage state={searchState} />
        {searchState.candidates && searchState.candidates.length > 0 && (
          <div className="mt-4 space-y-3">
            {searchState.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.sourceRecordId}
                ingredientId={ingredient.id}
                candidate={candidate}
                connected={reviews.some((review) => review.sourceRecordId === candidate.sourceRecordId)}
                onSaved={addReview}
              />
            ))}
          </div>
        )}
        <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-[#907c83]">
          <ShieldX size={13} className="mt-0.5 shrink-0" />
          검색 후보는 공개되지 않습니다. 식약처 원문의 국가·사용 부위·제품 유형·농도 조건을 관리자가 확인해 연결한 정보만 사용자에게 표시돼요.
        </p>
      </div>
    </details>
  );
}

function CandidateCard({
  ingredientId,
  candidate,
  connected,
  onSaved,
}: {
  ingredientId: string;
  candidate: IngredientRegulationCandidate;
  connected: boolean;
  onSaved: (review: AdminIngredientRegulationReview) => void;
}) {
  const [state, action, pending] = useActionState(
    saveIngredientRegulationReviewAction.bind(null, ingredientId, candidate.sourceRecordId),
    initialState,
  );

  useEffect(() => {
    if (state.review) onSaved(state.review);
  }, [state.review]);

  return (
    <form action={action} className="rounded-2xl border border-[#e4cbd2] bg-white p-4">
      <input type="hidden" name="confirmation" value={candidate.sourceRecordId} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fff0f4] px-2.5 py-1 text-[10px] font-bold text-[#a14d64]">이름 일치 {candidate.confidence}%</span>
            <ConditionBadge value={candidate.country ?? "국가 정보 확인 필요"} />
            <ConditionBadge value={candidate.restrictionType ?? "제한 유형 미기재"} />
            {(connected || candidate.verified) && <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf3eb] px-2.5 py-1 text-[10px] font-bold text-[#58715e]"><Check size={11} /> 현재 연결</span>}
          </div>
          <h4 className="mt-3 text-sm font-bold leading-6 text-[#51464a]">{candidate.standardName}</h4>
          <p className="mt-1 text-[11px] leading-5 text-[#806f75]">{candidate.englishName ?? "영문명 없음"}{candidate.casNo ? ` · CAS ${candidate.casNo}` : ""}</p>
          {candidate.noticeIngredientName && <p className="mt-1 whitespace-pre-line text-[10px] leading-5 text-[#927b83]">고시 원료명 · {candidate.noticeIngredientName}</p>}
          <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-line rounded-xl bg-[#fff8fa] px-3 py-2.5 text-[11px] leading-5 text-[#6f5f65]">{candidate.restrictionText || "제한 문구가 비어 있어 원문 확인이 필요해요."}</p>
          {candidate.proviso && <p className="mt-2 whitespace-pre-line text-[10px] leading-5 text-[#856f77]">단서 · {candidate.proviso}</p>}
          <p className="mt-2 text-[10px] leading-5 text-[#9a858d]">{candidate.matchReasons.join(" · ")}</p>
        </div>
      </div>
      <label className="mt-3 block text-[10px] font-semibold text-[#75636a]">
        검수 메모 (선택)
        <input name="reviewNote" maxLength={500} placeholder="표준명·CAS No·원문 조건 확인 내용" className="mt-1.5 min-h-10 w-full rounded-xl border border-[#dfc3cb] bg-[#fffafc] px-3 text-xs font-normal outline-none focus:border-[#b86178]" />
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <a href="https://www.data.go.kr/data/15111772/openapi.do" target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-10 items-center gap-1.5 text-[10px] font-bold text-[#8f5061] underline underline-offset-4">공식 데이터 안내 <ExternalLink size={11} /></a>
        <button type="submit" disabled={pending || connected || candidate.verified} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#a65066] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">
          {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Link2 size={14} />}
          {pending ? "연결 중" : connected || candidate.verified ? "연결 완료" : "확인하고 공개 연결"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

function VerifiedReviewCard({
  review,
  onRemoved,
}: {
  review: AdminIngredientRegulationReview;
  onRemoved: (sourceRecordId: string) => void;
}) {
  const [state, action, pending] = useActionState(
    removeIngredientRegulationReviewAction.bind(null, review.ingredientId, review.sourceRecordId),
    initialState,
  );

  useEffect(() => {
    if (state.removedSourceRecordId) onRemoved(state.removedSourceRecordId);
  }, [state.removedSourceRecordId]);

  return (
    <div className="rounded-2xl border border-[#a8c8ae61] bg-[#f1f7f2] p-4 text-xs text-[#55735e]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><ShieldCheck size={15} /><strong>{review.standardName}</strong><ConditionBadge value={review.country ?? "국가 미기재"} /><ConditionBadge value={review.restrictionType ?? "유형 미기재"} /></div>
          <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-line text-[11px] leading-5 text-[#496452]">{review.restrictionText || "제한 문구 없음"}</p>
          <p className="mt-2 text-[10px] leading-5 text-[#6d8272]">{review.reviewerNickname ? `${review.reviewerNickname} 검수` : "관리자 검수"}{review.reviewedAt ? ` · ${formatDate(review.reviewedAt)}` : ""}</p>
          {review.reviewNote && <p className="mt-2 rounded-xl bg-white/65 px-3 py-2 text-[10px] leading-5">검수 메모 · {review.reviewNote}</p>}
        </div>
        <form action={action}>
          <input type="hidden" name="confirmation" value={review.sourceRecordId} />
          <button type="submit" disabled={pending} className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#a8c5ad] bg-white px-3 font-bold text-[#58715e] disabled:cursor-wait disabled:opacity-55 sm:w-auto">
            {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Unlink size={14} />}
            {pending ? "내리는 중" : "공개 연결 해제"}
          </button>
        </form>
      </div>
      <ActionMessage state={state} />
    </div>
  );
}

function ConditionBadge({ value }: { value: string }) {
  return <span className="rounded-full border border-current/15 bg-white/65 px-2.5 py-1 text-[10px] font-bold">{value}</span>;
}

function ActionMessage({ state }: { state: IngredientRegulationActionState }) {
  if (!state.message) return null;
  return <p role="status" aria-live="polite" className={`mt-3 rounded-xl px-3 py-2.5 text-xs leading-5 ${state.success ? "bg-[#edf5ee] text-[#53715b]" : "bg-[#fff0f3] text-[#9b4b61]"}`}>{state.message}</p>;
}

function formatDate(value: string) {
  return value.slice(0, 10).replaceAll("-", ".");
}
