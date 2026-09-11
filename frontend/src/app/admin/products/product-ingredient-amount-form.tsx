"use client";

import { Check, ExternalLink, LoaderCircle, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import {
  deleteProductIngredientAmountAction,
  saveProductIngredientAmountAction,
  type ProductIngredientAmountActionState,
} from "@/app/admin/products/actions";
import type { ProductIngredient } from "@/lib/types";

const initialState: ProductIngredientAmountActionState = { success: false, message: "" };
const inputClass = "mt-1.5 min-h-10 w-full rounded-xl border border-[#dfcbd2] bg-white px-3 py-2 text-xs font-normal text-[#4e4146] outline-none focus:border-[#b86178] focus:ring-2 focus:ring-[#b8617818]";
const labelClass = "block text-[10px] font-bold text-[#746168]";

export function ProductIngredientAmountForm({ productId, ingredient }: { productId: string; ingredient: ProductIngredient }) {
  const amount = ingredient.amount ?? null;
  const [kind, setKind] = useState(amount?.kind ?? "EXACT");
  const saveAction = saveProductIngredientAmountAction.bind(null, productId, ingredient.id);
  const deleteAction = deleteProductIngredientAmountAction.bind(null, productId, ingredient.id);
  const [saveState, saveFormAction, saving] = useActionState(saveAction, initialState);
  const [deleteState, deleteFormAction, deleting] = useActionState(deleteAction, initialState);
  const [expanded, setExpanded] = useState(Boolean(amount));
  const primaryAmount = kind === "MAXIMUM" ? amount?.maxAmount : amount?.minAmount;
  const primaryDefaultValue = amount?.kind === kind ? primaryAmount ?? "" : "";

  return (
    <details
      className="group rounded-2xl border border-[#eadce1] bg-white"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 marker:hidden">
        <span className="min-w-0">
          <strong className="block truncate text-xs text-[#55474c]">{ingredient.name}</strong>
          <span className="mt-0.5 block text-[10px] text-[#917e85]">{amount ? `${amount.displayValue} · ${verificationLabel(amount.verificationStatus)}` : "함량 근거 미등록"}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${amount?.verificationStatus === "VERIFIED" ? "bg-[#edf5ee] text-[#55735e]" : "bg-[#f5eff1] text-[#806e75]"}`}>
          {amount?.verificationStatus === "VERIFIED" ? "공개 중" : "검수 필요"}
        </span>
      </summary>

      <div className="border-t border-[#eee3e7] p-4">
        <p className="mb-4 rounded-xl bg-[#fff7f9] px-3 py-2 text-[10px] leading-5 text-[#876f78]">
          전성분 순서나 제품명 숫자로 함량을 추정하지 않습니다. 브랜드 공식 페이지·포장·시험성적서에 수치가 직접 적힌 경우만 등록해 주세요.
        </p>
        <form action={saveFormAction} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>표시 방식
              <select name="kind" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className={inputClass}>
                <option value="EXACT">정확한 수치</option><option value="RANGE">범위</option><option value="MINIMUM">이상</option><option value="MAXIMUM">이하</option>
              </select>
            </label>
            <label className={labelClass}>{kind === "RANGE" ? "시작값" : kind === "MAXIMUM" ? "최댓값" : "함량 수치"}
              <input key={`${ingredient.id}-${kind}`} name="amount" type="number" required min="0.000000000001" step="any" defaultValue={primaryDefaultValue} placeholder="예: 0.001" className={inputClass} />
            </label>
            {kind === "RANGE" && <label className={labelClass}>최댓값
              <input name="maxAmount" type="number" required min="0.000000000001" step="any" defaultValue={amount?.kind === "RANGE" ? amount.maxAmount ?? "" : ""} placeholder="예: 0.002" className={inputClass} />
            </label>}
            <label className={labelClass}>단위
              <select name="unit" required defaultValue={amount?.unit ?? "PERCENT"} className={inputClass}>
                <option value="PERCENT">%</option><option value="PPM">ppm</option><option value="PPB">ppb</option><option value="MG_PER_G">mg/g</option><option value="MG_PER_ML">mg/mL</option>
              </select>
            </label>
            <label className={labelClass}>배합 기준
              <select name="basis" required defaultValue={amount?.basis ?? "UNSPECIFIED"} className={inputClass}>
                <option value="UNSPECIFIED">원문에 기준 미기재</option><option value="W_W">w/w · 중량 기준</option><option value="W_V">w/v · 부피당 중량</option><option value="V_V">v/v · 부피 기준</option>
              </select>
            </label>
            <label className={labelClass}>수치가 뜻하는 대상
              <select name="substanceBasis" required defaultValue={amount?.substanceBasis ?? "PURE_INGREDIENT"} className={inputClass}>
                <option value="PURE_INGREDIENT">해당 표준 성분</option><option value="RAW_MATERIAL_COMPLEX">복합 원료·추출물</option><option value="DERIVATIVE_EQUIVALENT">유도체 환산값</option>
              </select>
            </label>
            <label className={labelClass}>출처 종류
              <select name="sourceType" required defaultValue={amount?.sourceType ?? "BRAND_OFFICIAL"} className={inputClass}>
                <option value="BRAND_OFFICIAL">브랜드 공식 페이지</option><option value="PACKAGE_LABEL">제품 포장 표기</option><option value="MFDS_FUNCTIONAL_REPORT">식약처 기능성 보고</option><option value="TEST_REPORT">시험성적서</option>
              </select>
            </label>
            <label className={labelClass}>검수 상태
              <select name="verificationStatus" required defaultValue={amount?.verificationStatus ?? "DRAFT"} className={inputClass}>
                <option value="DRAFT">초안 · 사용자 비공개</option><option value="VERIFIED">검증 완료 · 공개</option><option value="STALE">재확인 필요 · 비공개</option>
              </select>
            </label>
          </div>

          <label className={labelClass}>공식 표기 원문
            <input name="rawClaimText" required maxLength={500} defaultValue={amount?.rawClaimText ?? ""} placeholder="예: Betula Platyphylla Japonica Juice (10,000 ppm)" className={inputClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>출처의 성분명
              <input name="sourceIngredientName" required maxLength={300} defaultValue={amount?.sourceIngredientName ?? ingredient.englishName} className={inputClass} />
            </label>
            <label className={labelClass}>출처 페이지명
              <input name="pageTitle" required maxLength={300} defaultValue={amount?.pageTitle ?? ""} placeholder="공식 제품 페이지 제목" className={inputClass} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <label className={labelClass}>공식 근거 URL
              <input name="sourceUrl" type="url" pattern="https://.*" title="https://로 시작하는 보안 주소를 입력해 주세요." required maxLength={500} defaultValue={amount?.sourceUrl ?? ""} placeholder="https://..." className={inputClass} />
            </label>
            <label className={labelClass}>확인일
              <input name="checkedAt" type="date" required defaultValue={amount?.checkedAt ?? ""} className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>관리자 검수 메모(선택)
            <input name="reviewNote" maxLength={500} defaultValue={amount?.reviewNote ?? ""} placeholder="리뉴얼·판매 지역·원료 기준 등을 기록해 주세요." className={inputClass} />
          </label>

          <div className="flex flex-col gap-3 border-t border-[#eee3e7] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p role="status" aria-live="polite" className={`min-h-5 text-[10px] ${saveState.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>{saveState.message && <span className="inline-flex items-center gap-1">{saveState.success && <Check size={12} />}{saveState.message}</span>}</p>
            <button type="submit" disabled={saving || deleting} className="soft-btn w-full sm:w-auto">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}{saving ? "저장 중" : "함량 근거 저장"}</button>
          </div>
        </form>

        {amount && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#eee3e7] pt-3">
          <a href={amount.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${ingredient.name} 함량 근거를 새 창에서 확인`} className="inline-flex min-h-9 items-center gap-1 text-[10px] font-semibold text-[#8d5969] underline underline-offset-4"><ShieldCheck size={12} /> 현재 근거 확인 <ExternalLink size={10} /></a>
          <form action={deleteFormAction}><input type="hidden" name="confirmation" value={ingredient.id} /><button type="submit" disabled={saving || deleting} className="inline-flex min-h-9 items-center gap-1 px-2 text-[10px] font-semibold text-[#a45c58]"><Trash2 size={12} /> 함량 근거 삭제</button></form>
        </div>}
        {amount && <p role="status" aria-live="polite" className={`min-h-5 text-right text-[10px] ${deleteState.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>{deleteState.message}</p>}
      </div>
    </details>
  );
}

function verificationLabel(status: "DRAFT" | "VERIFIED" | "STALE") {
  if (status === "VERIFIED") return "검증 완료";
  if (status === "STALE") return "재확인 필요";
  return "초안";
}
