"use client";

import { useActionState, useState } from "react";
import { Check, ChevronDown, ChevronUp, LoaderCircle, RotateCcw, Save } from "lucide-react";
import type { Product, WeeklyRanking } from "@/lib/types";
import {
  resetWeeklyRankingAction,
  updateWeeklyRankingAction,
  type WeeklyRankingActionState,
} from "./actions";

const initialState: WeeklyRankingActionState = { success: false, message: "" };

export function WeeklyRankingForm({ products, ranking }: { products: Product[]; ranking: WeeklyRanking }) {
  const initialIds = [...ranking.content.map((item) => item.product.id), ...Array(10).fill("")].slice(0, 10);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [saveState, saveAction, savePending] = useActionState(updateWeeklyRankingAction, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetWeeklyRankingAction, initialState);
  const metricByProduct = new Map(ranking.content.map((item) => [item.product.id, item]));

  function selectProduct(index: number, productId: string) {
    setSelectedIds((current) => {
      const next = [...current];
      const previousId = next[index];
      const duplicateIndex = productId ? next.findIndex((id, itemIndex) => itemIndex !== index && id === productId) : -1;
      if (duplicateIndex >= 0) next[duplicateIndex] = previousId;
      next[index] = productId;
      return next;
    });
  }

  function moveItem(index: number, step: number) {
    const target = index + step;
    if (target < 0 || target >= selectedIds.length) return;
    setSelectedIds((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return <div className="grid gap-5">
    <form action={saveAction} className="grid gap-3">
      {selectedIds.map((productId, index) => {
        const metric = productId ? metricByProduct.get(productId) : undefined;
        return <div key={index} className="grid grid-cols-[42px_minmax(0,1fr)_42px] items-center gap-2 rounded-2xl border border-[#ead8de] bg-white p-3">
          <strong className="text-center font-myeongjo text-lg text-[#a34c67]">{String(index + 1).padStart(2, "0")}</strong>
          <div className="min-w-0">
            <label htmlFor={`weekly-product-${index}`} className="sr-only">{index + 1}위 배너 상품</label>
            <select
              id={`weekly-product-${index}`}
              name="productId"
              value={productId}
              onChange={(event) => selectProduct(index, event.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#dec4cb] bg-white px-3 text-sm outline-none focus:border-[#b55b73] focus:ring-2 focus:ring-[#edcbd5]"
            >
              <option value="">이 순위 비우기</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.brand} · {product.name}</option>)}
            </select>
            <p className="mt-1.5 truncate text-[10px] text-[#907c83]">
              {!productId ? "노출하지 않음" : metric ? `평가 ${metric.reviewCount.toLocaleString("ko-KR")}개 · ${metric.reviewScore === null ? "점수 집계 전" : `${metric.reviewScore.toFixed(1)} / 100`}` : "저장 후 주간 평가 수와 점수를 표시해요"}
            </p>
          </div>
          <div className="grid gap-1">
            <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label={`${index + 1}위 상품 위로 이동`} className="grid h-8 place-items-center rounded-lg text-[#875f6c] hover:bg-[#fff0f4] disabled:opacity-25"><ChevronUp size={16} /></button>
            <button type="button" onClick={() => moveItem(index, 1)} disabled={index === selectedIds.length - 1} aria-label={`${index + 1}위 상품 아래로 이동`} className="grid h-8 place-items-center rounded-lg text-[#875f6c] hover:bg-[#fff0f4] disabled:opacity-25"><ChevronDown size={16} /></button>
          </div>
        </div>;
      })}

      <div className="mt-2 flex flex-col gap-3 border-t border-[#ead9de] pt-5">
        <p role="status" aria-live="polite" className={`min-h-5 text-xs ${saveState.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>{saveState.message && <span className="inline-flex items-center gap-1.5">{saveState.success && <Check size={14} />}{saveState.message}</span>}</p>
        <button type="submit" disabled={savePending || selectedIds.every((id) => !id)} className="ink-btn w-full disabled:opacity-50">{savePending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{savePending ? "저장 중" : "이번 주 배너 저장"}</button>
      </div>
    </form>

    <form action={resetAction} className="rounded-2xl border border-dashed border-[#dcbfc8] bg-[#fff8fa] p-4">
      <p className="text-xs leading-6 text-[#806d74]">수동 편집을 취소하면 이번 주 평가 데이터를 다시 계산해 자동 상위 10개를 바로 노출합니다.</p>
      <button type="submit" disabled={resetPending || ranking.mode === "AUTO"} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cda7b2] bg-white px-4 text-xs font-bold text-[#9d4d64] disabled:opacity-45">{resetPending ? <LoaderCircle size={15} className="animate-spin" /> : <RotateCcw size={15} />}{resetPending ? "복원 중" : ranking.mode === "AUTO" ? "현재 자동 순위 사용 중" : "자동 순위로 되돌리기"}</button>
      <p role="status" aria-live="polite" className={`mt-2 min-h-5 text-xs ${resetState.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>{resetState.message}</p>
    </form>
  </div>;
}
