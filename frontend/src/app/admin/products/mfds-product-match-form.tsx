"use client";

import { Check, ExternalLink, FileSearch, Link2, LoaderCircle, Search, ShieldCheck, Unlink } from "lucide-react";
import { useActionState } from "react";
import {
  removeMfdsProductMatchAction,
  saveMfdsProductMatchAction,
  searchMfdsProductCandidatesAction,
  type MfdsProductMatchActionState,
} from "@/app/admin/products/actions";
import type { AdminMfdsProductMatch, MfdsProductCandidate } from "@/lib/types";

const initialState: MfdsProductMatchActionState = { success: false, message: "" };

export function MfdsProductMatchForm({
  productId,
  productName,
  initialMatch,
}: {
  productId: string;
  productName: string;
  initialMatch?: AdminMfdsProductMatch;
}) {
  const [searchState, searchAction, searchPending] = useActionState(
    searchMfdsProductCandidatesAction.bind(null, productId),
    initialState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveMfdsProductMatchAction.bind(null, productId),
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMfdsProductMatchAction.bind(null, productId),
    initialState,
  );
  const currentMatch = removeState.success ? undefined : saveState.match ?? initialMatch;

  return (
    <div className="mt-4 space-y-4">
      {currentMatch ? (
        <CurrentMatch match={currentMatch} removeAction={removeAction} pending={removePending} state={removeState} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d8adb8] bg-[#fff9fb] p-4 text-xs leading-5 text-[#826f76]">
          아직 확인된 식약처 품목 연결이 없어요. 아래에서 제품명을 검색한 뒤 실제 품목을 확인해 주세요.
        </div>
      )}

      <form action={searchAction} className="flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">식약처 품목명 검색</span>
          <span className="flex min-h-11 items-center gap-2 rounded-xl border border-[#d9a8b54d] bg-white px-3 focus-within:border-[#b86178]">
            <Search size={15} className="shrink-0 text-[#9e6071]" />
            <input name="query" required minLength={2} maxLength={120} defaultValue={productName} placeholder="제품명 핵심 단어" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </span>
        </label>
        <button type="submit" disabled={searchPending} className="line-btn min-h-11 shrink-0 disabled:cursor-wait disabled:opacity-55">
          {searchPending ? <LoaderCircle size={15} className="animate-spin" /> : <FileSearch size={15} />}
          {searchPending ? "후보 검색 중" : "식약처 후보 찾기"}
        </button>
      </form>

      <ActionMessage state={searchState} />
      {searchState.candidates && searchState.candidates.length > 0 && (
        <div className="space-y-3">
          {searchState.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.reportId}
              candidate={candidate}
              currentReportId={currentMatch?.reportId}
              saveAction={saveAction}
              pending={savePending}
            />
          ))}
        </div>
      )}
      <ActionMessage state={saveState} />
      <p className="text-[10px] leading-5 text-[#948188]">자동 후보는 공개되지 않습니다. 관리자가 제품명과 업체를 확인해 연결한 정보만 사용자 제품 상세에 표시돼요.</p>
    </div>
  );
}

function CurrentMatch({
  match,
  removeAction,
  pending,
  state,
}: {
  match: AdminMfdsProductMatch;
  removeAction: (formData: FormData) => void;
  pending: boolean;
  state: MfdsProductMatchActionState;
}) {
  return (
    <div className="rounded-2xl border border-[#9ebea64d] bg-[#f1f7f2] p-4 text-xs text-[#55735e]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold"><ShieldCheck size={15} /> 관리자 확인 완료</p>
          <p className="mt-2 font-semibold leading-5 text-[#405d49]">{match.productName}</p>
          <p className="mt-1 leading-5">{match.companyName ?? "업체명 정보 없음"}{match.reportDate ? ` · ${formatDate(match.reportDate)} 보고` : ""}</p>
          <p className="mt-1 text-[10px] leading-5 text-[#6d8272]">품목 식별자 {match.reportId}{match.reviewerNickname ? ` · ${match.reviewerNickname} 검수` : ""}</p>
          {match.reviewNote && <p className="mt-2 rounded-xl bg-white/65 px-3 py-2 text-[10px] leading-5">검수 메모 · {match.reviewNote}</p>}
          <a href="https://www.data.go.kr/data/15095680/openapi.do" target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 font-bold underline underline-offset-4">공식 데이터 안내 <ExternalLink size={11} /></a>
        </div>
        <form action={removeAction}>
          <input type="hidden" name="confirmation" value={match.productId} />
          <button type="submit" disabled={pending} className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#a8c5ad] bg-white px-3 font-bold text-[#58715e] disabled:cursor-wait disabled:opacity-55 sm:w-auto">
            {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Unlink size={14} />}
            {pending ? "해제 중" : "연결 해제"}
          </button>
        </form>
      </div>
      <ActionMessage state={state} />
    </div>
  );
}

function CandidateCard({
  candidate,
  currentReportId,
  saveAction,
  pending,
}: {
  candidate: MfdsProductCandidate;
  currentReportId?: string;
  saveAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const connected = candidate.reportId === currentReportId;
  return (
    <form action={saveAction} className="rounded-2xl border border-[#e4cbd2] bg-white p-4">
      <input type="hidden" name="reportId" value={candidate.reportId} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fff0f4] px-2.5 py-1 text-[10px] font-bold text-[#a14d64]">후보 {candidate.confidence}%</span>
            {connected && <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf3eb] px-2.5 py-1 text-[10px] font-bold text-[#58715e]"><Check size={11} /> 현재 연결</span>}
          </div>
          <h4 className="mt-2 text-sm font-bold leading-6 text-[#51464a]">{candidate.productName}</h4>
          <p className="mt-1 text-[11px] leading-5 text-[#806f75]">{candidate.companyName ?? "업체명 정보 없음"}{candidate.reportDate ? ` · ${formatDate(candidate.reportDate)}` : ""}</p>
          <p className="mt-1 text-[10px] leading-5 text-[#9a858d]">{candidate.matchReasons.join(" · ")}</p>
        </div>
      </div>
      <label className="mt-3 block text-[10px] font-semibold text-[#75636a]">검수 메모 (선택)<input name="reviewNote" maxLength={500} placeholder="제품명·책임판매업체 확인 내용" className="mt-1.5 min-h-10 w-full rounded-xl border border-[#dfc3cb] bg-[#fffafc] px-3 text-xs font-normal outline-none focus:border-[#b86178]" /></label>
      <button type="submit" disabled={pending || connected} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#a65066] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto">
        {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Link2 size={14} />}
        {pending ? "연결 중" : connected ? "연결 완료" : "확인하고 연결"}
      </button>
    </form>
  );
}

function ActionMessage({ state }: { state: MfdsProductMatchActionState }) {
  if (!state.message) return null;
  return <p role="status" aria-live="polite" className={`mt-3 rounded-xl px-3 py-2.5 text-xs leading-5 ${state.success ? "bg-[#edf5ee] text-[#53715b]" : "bg-[#fff0f3] text-[#9b4b61]"}`}>{state.message}</p>;
}

function formatDate(value: string) {
  return value.slice(0, 10).replaceAll("-", ".");
}

