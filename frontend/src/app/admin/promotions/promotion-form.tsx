"use client";

import { Check, LoaderCircle, Megaphone, Save } from "lucide-react";
import { useActionState, type ReactNode } from "react";
import { createPromotionAction, updatePromotionAction, type PromotionActionState } from "./actions";
import type { Product, ProductPromotion } from "@/lib/types";

const initialState: PromotionActionState = { success: false, message: "" };
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#dec4cb] bg-white px-3 text-sm outline-none transition focus:border-[#b55b73] focus:ring-2 focus:ring-[#edcbd5]";
const labelClass = "text-xs font-bold text-[#6e5d63]";

export function PromotionForm({ products, promotion }: { products: Product[]; promotion?: ProductPromotion }) {
  const action = promotion ? updatePromotionAction.bind(null, promotion.id) : createPromotionAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name];
  const prefix = promotion ? `promotion-${promotion.id}` : "new-promotion";

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-[1.2fr_.6fr_.7fr]">
        <Field label="광고 제품" error={fieldError("productId")} hint={promotion ? "광고에 연결된 제품은 변경할 수 없어요." : "제품 하나당 광고 하나를 운영합니다."}>
          {promotion ? <><input type="hidden" name="productId" value={promotion.product.id} /><input value={`${promotion.product.brand} · ${promotion.product.name}`} readOnly className={`${inputClass} cursor-not-allowed bg-[#f8f3f5]`} /></> : (
            <select id={`${prefix}-productId`} name="productId" required className={inputClass} defaultValue="">
              <option value="" disabled>제품 선택</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.brand} · {product.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="관리자 추천점수" error={fieldError("recommendationScore")} hint="0~100점 · 광고 탭 정렬 기준">
          <input id={`${prefix}-score`} name="recommendationScore" type="number" required min={0} max={100} step={1} defaultValue={promotion?.recommendationScore ?? 80} className={inputClass} />
        </Field>
        <Field label="노출 상태" error={fieldError("status")}>
          <select id={`${prefix}-status`} name="status" required defaultValue={promotion?.status ?? "DRAFT"} className={inputClass}>
            <option value="DRAFT">초안</option><option value="ACTIVE">노출</option><option value="PAUSED">일시중지</option>
          </select>
        </Field>
      </div>

      <Field label="추천 한 줄" error={fieldError("headline")} hint="제품의 검증 가능한 장점을 짧게 적어 주세요.">
        <input id={`${prefix}-headline`} name="headline" required maxLength={100} defaultValue={promotion?.headline} placeholder="예: 작지만 성분 구성이 단단한 신생 브랜드" className={inputClass} />
      </Field>
      <Field label="관리자 추천 이유" error={fieldError("recommendationReason")} hint="사용자 리뷰가 아니라 화력 관리자의 평가임을 전제로 구체적인 근거를 적어 주세요.">
        <textarea id={`${prefix}-reason`} name="recommendationReason" required maxLength={500} rows={4} defaultValue={promotion?.recommendationReason} placeholder="성분 구성, 제품 차별점, 신생 브랜드로서 주목할 이유를 설명해 주세요." className={`${inputClass} py-3 leading-6`} />
      </Field>

      <div className="grid gap-4 md:grid-cols-[1.4fr_.7fr_.7fr]">
        <Field label="예비 쿠팡 판매처 URL" error={fieldError("destinationUrl")} hint="상품 관리에 파트너스 링크가 연결되어 있으면 사용자 화면에서는 그 링크를 우선 사용해요.">
          <input id={`${prefix}-url`} name="destinationUrl" type="url" required maxLength={500} defaultValue={promotion?.destinationUrl} placeholder="https://www.coupang.com/..." className={inputClass} />
        </Field>
        <Field label="노출 시작일" error={fieldError("startsOn")} hint="비워두면 즉시 가능">
          <input id={`${prefix}-starts`} name="startsOn" type="date" defaultValue={promotion?.startsOn ?? ""} className={inputClass} />
        </Field>
        <Field label="노출 종료일" error={fieldError("endsOn")} hint="비워두면 종료일 없음">
          <input id={`${prefix}-ends`} name="endsOn" type="date" defaultValue={promotion?.endsOn ?? ""} className={inputClass} />
        </Field>
      </div>

      <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-[#e6c7d0] bg-[#fff5f7] px-4 text-sm font-semibold text-[#704f59]">
        <input type="checkbox" name="emergingBrand" defaultChecked={promotion?.emergingBrand ?? true} className="h-4 w-4 accent-[#bf4e6d]" />
        신생 브랜드 우선 노출 대상으로 표시
        <span className="ml-auto text-[10px] font-normal text-[#92747d]">광고 탭 최우선 그룹</span>
      </label>

      <div className="flex flex-col gap-3 border-t border-[#ead9de] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" aria-live="polite" className={`min-h-5 text-xs ${state.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>{state.message && <span className="inline-flex items-center gap-1.5">{state.success && <Check size={14} />}{state.message}</span>}</p>
        <button type="submit" disabled={pending || products.length === 0} className="ink-btn w-full sm:w-auto">{pending ? <LoaderCircle size={16} className="animate-spin" /> : promotion ? <Save size={16} /> : <Megaphone size={16} />}{pending ? "저장 중" : promotion ? "광고 저장" : "광고 등록"}</button>
      </div>
    </form>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return <label className={labelClass}><span>{label}</span>{children}{error ? <span className="mt-1.5 block font-medium text-[#a14f61]">{error}</span> : hint ? <span className="mt-1.5 block font-normal leading-5 text-[#917e85]">{hint}</span> : null}</label>;
}
