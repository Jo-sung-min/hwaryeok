"use client";

import { Check, FileSpreadsheet, LoaderCircle, RefreshCw, ShieldAlert, Upload } from "lucide-react";
import { useActionState } from "react";
import {
  importKciaDictionaryAction,
  syncMfdsAction,
  type DataSourceActionState,
} from "@/app/admin/data-sources/actions";

const initialState: DataSourceActionState = { success: false, message: "" };

export function MfdsSyncForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(syncMfdsAction, initialState);
  return (
    <form action={action} className="mt-5 border-t border-[#ead9de] pt-5">
      <button type="submit" disabled={pending || !configured} className="ink-btn w-full disabled:cursor-not-allowed disabled:opacity-45">
        {pending ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        {pending ? "식약처 연결 중" : configured ? "식약처 API 지금 동기화" : "환경설정 후 동기화 가능"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function KciaImportForm() {
  const [state, action, pending] = useActionState(importKciaDictionaryAction, initialState);
  return (
    <form action={action} className="mt-5 space-y-4 border-t border-[#ead9de] pt-5">
      <label className="block rounded-2xl border border-dashed border-[#d5a5b2] bg-[#fff8fa] p-4 text-xs font-semibold text-[#765f67]">
        <span className="mb-2 flex items-center gap-2"><FileSpreadsheet size={16} /> 공식 CSV 또는 XLSX 파일</span>
        <input name="file" type="file" required accept=".csv,.tsv,.xlsx,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-[#f7dfe6] file:px-3 file:py-2 file:font-bold file:text-[#934b60]" />
      </label>
      <label className="flex items-start gap-3 rounded-2xl bg-[#fff3df] p-4 text-[11px] leading-5 text-[#7d622e]">
        <input name="rightsConfirmed" type="checkbox" required className="mt-1 h-4 w-4 accent-[#a95067]" />
        <span><strong className="block">데이터 사용권을 확인했습니다.</strong>대한화장품협회 이용조건을 확인했고, 화력 서비스에 적재할 권한이 있는 공식 파일만 업로드합니다.</span>
      </label>
      <button type="submit" disabled={pending} className="soft-btn w-full disabled:cursor-wait disabled:opacity-55">
        {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
        {pending ? "PostgreSQL 적재 중" : "성분 기준사전 초기 적재"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function ActionMessage({ state }: { state: DataSourceActionState }) {
  if (!state.message) return null;
  return (
    <div role="status" aria-live="polite" className={`mt-3 rounded-xl px-3 py-2.5 text-xs leading-5 ${state.success ? "bg-[#edf5ee] text-[#53715b]" : "bg-[#fff0f3] text-[#9b4b61]"}`}>
      <p className="flex items-start gap-2">{state.success ? <Check size={14} className="mt-0.5 shrink-0" /> : <ShieldAlert size={14} className="mt-0.5 shrink-0" />}{state.message}</p>
      {state.details?.length ? <ul className="mt-2 space-y-1 border-t border-current/10 pt-2">{state.details.map((detail) => <li key={detail}>· {detail}</li>)}</ul> : null}
    </div>
  );
}
