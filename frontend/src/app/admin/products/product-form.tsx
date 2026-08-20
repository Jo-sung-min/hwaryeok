"use client";

import { Check, LoaderCircle, PackagePlus, Save } from "lucide-react";
import { useActionState, type ReactNode } from "react";
import { createProductAction, updateProductAction, type ProductActionState } from "@/app/admin/products/actions";
import type { Product } from "@/lib/types";

const initialState: ProductActionState = { success: false, message: "" };
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-[#d9a8b55c] bg-white px-3.5 py-2.5 text-sm text-[#4e4146] outline-none transition placeholder:text-[#a9939a] focus:border-[#b86178] focus:ring-2 focus:ring-[#b8617820]";
const labelClass = "block text-xs font-bold text-[#69575e]";

export function ProductForm({ product }: { product?: Product }) {
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name];
  const prefix = product?.id ?? "new";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="제품 ID" error={fieldError("id")} hint={product ? "제품 ID는 수정할 수 없어요." : "영문 소문자·숫자·하이픈만 사용해 주세요."}>
          <input id={`${prefix}-id`} name="id" required maxLength={64} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" readOnly={Boolean(product)} defaultValue={product?.id} placeholder="example-soothing-cream" className={`${inputClass} ${product ? "cursor-not-allowed bg-[#f8f3f5] text-[#88777d]" : ""}`} />
        </Field>
        <Field label="브랜드" error={fieldError("brand")}>
          <input id={`${prefix}-brand`} name="brand" required maxLength={80} defaultValue={product?.brand} placeholder="브랜드명" className={inputClass} />
        </Field>
      </div>

      <Field label="제품명" error={fieldError("name")}>
        <input id={`${prefix}-name`} name="name" required maxLength={140} defaultValue={product?.name} placeholder="제품 전체 이름" className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="카테고리" error={fieldError("category")}>
          <input id={`${prefix}-category`} name="category" required maxLength={40} defaultValue={product?.category} list={`${prefix}-product-categories`} placeholder="크림" className={inputClass} />
        </Field>
        <Field label="기존 점수 · 랭킹 미반영" error={fieldError("baseScore")}>
          <input id={`${prefix}-baseScore`} name="baseScore" type="number" required min={0} max={100} defaultValue={product?.score ?? 70} className={inputClass} />
        </Field>
        <Field label="가격(원)" error={fieldError("price")}>
          <input id={`${prefix}-price`} name="price" type="number" required min={0} step={100} defaultValue={product?.priceValue ?? 0} className={inputClass} />
        </Field>
        <Field label="대표 색상" error={fieldError("tone")}>
          <select id={`${prefix}-tone`} name="tone" required defaultValue={product?.tone ?? "rose"} className={inputClass}>
            <option value="rose">로즈</option>
            <option value="peach">피치</option>
            <option value="sage">세이지</option>
            <option value="sand">샌드</option>
            <option value="blue">블루</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="핵심 기준" error={fieldError("benefit")}>
          <input id={`${prefix}-benefit`} name="benefit" required maxLength={80} defaultValue={product?.benefit} placeholder="예: 수분 장벽 강화" className={inputClass} />
        </Field>
        <Field label="보조 기준" error={fieldError("subBenefit")}>
          <input id={`${prefix}-subBenefit`} name="subBenefit" required maxLength={80} defaultValue={product?.subBenefit} placeholder="예: 속건조 보습" className={inputClass} />
        </Field>
      </div>

      <Field label="표시 문구(선택)" error={fieldError("tag")} hint="사용자가 이해하기 쉬운, 확인 가능한 표현으로 적어 주세요.">
        <input id={`${prefix}-tag`} name="tag" maxLength={80} defaultValue={product?.tag ?? ""} placeholder="예: 성분 정보 확인" className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)_minmax(0,.8fr)]">
        <Field label="공개 상태" error={fieldError("publicationStatus")} hint="새 상품은 초안으로 검토한 뒤 공개하는 것을 권장해요.">
          <select id={`${prefix}-publicationStatus`} name="publicationStatus" required defaultValue={product?.publicationStatus ?? "DRAFT"} className={inputClass}>
            <option value="DRAFT">초안 · 사용자에게 안 보임</option>
            <option value="PUBLISHED">공개 · 사용자에게 보임</option>
            <option value="HIDDEN">숨김 · 일시 비공개</option>
          </select>
        </Field>
        <Field label="정보 출처 URL(선택)" error={fieldError("sourceUrl")} hint="브랜드 공식 페이지처럼 사용자가 확인할 수 있는 주소를 적어 주세요.">
          <input id={`${prefix}-sourceUrl`} name="sourceUrl" type="url" maxLength={500} defaultValue={product?.sourceUrl ?? ""} placeholder="https://..." className={inputClass} />
        </Field>
        <Field label="출처 확인일(선택)" error={fieldError("sourceCheckedAt")}>
          <input id={`${prefix}-sourceCheckedAt`} name="sourceCheckedAt" type="date" defaultValue={product?.sourceCheckedAt ?? ""} className={inputClass} />
        </Field>
      </div>

      <datalist id={`${prefix}-product-categories`}>
        {["크림", "토너", "세럼", "에센스", "앰플", "선케어", "클렌저", "마스크"].map((category) => <option key={category} value={category} />)}
      </datalist>

      <div className="flex flex-col gap-3 border-t border-[#74513f18] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" aria-live="polite" className={`min-h-5 text-xs ${state.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>
          {state.message && <span className="inline-flex items-center gap-1.5">{state.success && <Check size={14} />}{state.message}</span>}
        </p>
        <button type="submit" disabled={pending} className="ink-btn w-full sm:w-auto">
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : product ? <Save size={16} /> : <PackagePlus size={16} />}
          {pending ? "저장 중" : product ? "변경 저장" : "제품 등록"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {children}
      {error ? <span className="mt-1.5 block font-medium text-[#a14f61]">{error}</span> : hint ? <span className="mt-1.5 block font-normal leading-5 text-[#917e85]">{hint}</span> : null}
    </label>
  );
}
