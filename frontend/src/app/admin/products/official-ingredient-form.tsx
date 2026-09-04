"use client";

import { Check, ExternalLink, FileSearch, LoaderCircle, Save, ShieldAlert } from "lucide-react";
import { useActionState } from "react";
import { saveOfficialIngredientListAction, type DataSourceActionState } from "@/app/admin/data-sources/actions";
import type { OfficialIngredientList } from "@/lib/types";

const initialState: DataSourceActionState = { success: false, message: "" };

export function OfficialIngredientForm({ productId, initialSource, defaultCheckedAt }: { productId: string; initialSource?: OfficialIngredientList; defaultCheckedAt: string }) {
  const action = saveOfficialIngredientListAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="mt-4 space-y-4">
      {initialSource && (
        <div className={`rounded-2xl border p-4 text-xs ${initialSource.published ? "border-[#9ebea64d] bg-[#f1f7f2] text-[#55735e]" : "border-[#e5be8259] bg-[#fff9ed] text-[#866129]"}`}>
          <p className="flex items-center gap-2 font-bold">{initialSource.published ? <Check size={15} /> : <ShieldAlert size={15} />}{initialSource.published ? "공식 전성분 공개 중" : "미일치 성분 확인 필요"}</p>
          <p className="mt-1.5 leading-5">{initialSource.matchedIngredientCount}/{initialSource.totalIngredientCount}개 표준명 일치 · {initialSource.sourceDomain}</p>
          <a href={initialSource.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 font-bold underline underline-offset-4">등록 원문 확인 <ExternalLink size={12} /></a>
          {initialSource.unmatchedIngredients.length > 0 && <p className="mt-2 line-clamp-2 text-[10px]">미일치: {initialSource.unmatchedIngredients.join(", ")}</p>}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-[11px] font-semibold text-[#746168]">브랜드 공식 페이지 URL<input name="sourceUrl" type="url" required maxLength={500} defaultValue={initialSource?.sourceUrl ?? ""} placeholder="https://brand.example/product" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9a8b54d] bg-[#fffafc] px-3 text-sm font-normal outline-none focus:border-[#b86178]" /></label>
        <label className="text-[11px] font-semibold text-[#746168]">페이지 제목<input name="pageTitle" required maxLength={300} defaultValue={initialSource?.pageTitle ?? ""} placeholder="브랜드 · 제품명" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9a8b54d] bg-[#fffafc] px-3 text-sm font-normal outline-none focus:border-[#b86178]" /></label>
      </div>
      <label className="block text-[11px] font-semibold text-[#746168]">공식 페이지 확인일<input name="checkedAt" type="date" required defaultValue={initialSource?.checkedAt ?? defaultCheckedAt} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9a8b54d] bg-[#fffafc] px-3 text-sm font-normal outline-none focus:border-[#b86178] sm:max-w-56" /></label>
      <label className="block text-[11px] font-semibold text-[#746168]">전성분 원문<textarea name="ingredientText" required maxLength={30000} rows={7} defaultValue={initialSource?.ingredientText ?? ""} placeholder="정제수, 글리세린, 나이아신아마이드, ..." className="mt-1.5 w-full resize-y rounded-xl border border-[#d9a8b54d] bg-[#fffafc] p-3 text-sm font-normal leading-6 outline-none focus:border-[#b86178]" /><span className="mt-1 block font-normal text-[#97858b]">쉼표 또는 줄바꿈으로 구분해 주세요. 모두 표준사전과 일치해야 공개됩니다.</span></label>
      <label className="flex items-start gap-3 rounded-2xl bg-[#fff3df] p-4 text-[11px] leading-5 text-[#7d622e]"><input name="officialSourceConfirmed" type="checkbox" required className="mt-1 h-4 w-4 accent-[#a95067]" /><span><strong className="block">브랜드 공식 페이지임을 확인했습니다.</strong>판매처·블로그·사용자 리뷰가 아닌 브랜드가 직접 공개한 전성분 원문입니다.</span></label>
      {state.message && <div role="status" aria-live="polite" className={`rounded-xl px-3 py-2.5 text-xs leading-5 ${state.success ? "bg-[#edf5ee] text-[#53715b]" : "bg-[#fff0f3] text-[#9b4b61]"}`}><p className="flex items-start gap-2">{state.success ? <Check size={14} className="mt-0.5" /> : <FileSearch size={14} className="mt-0.5" />}{state.message}</p>{state.details?.length ? <p className="mt-2 border-t border-current/10 pt-2">미일치: {state.details.join(", ")}</p> : null}</div>}
      <button type="submit" disabled={pending} className="ink-btn w-full disabled:cursor-wait disabled:opacity-55 sm:w-auto">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{pending ? "표준명 대조 중" : "공식 전성분 검증·저장"}</button>
    </form>
  );
}
