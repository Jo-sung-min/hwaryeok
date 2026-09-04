"use client";

import { Check, ExternalLink, Link2, LoaderCircle, Unlink } from "lucide-react";
import { useActionState } from "react";
import { saveCoupangPartnersLinkAction, type ProductActionState } from "@/app/admin/products/actions";

const initialState: ProductActionState = { success: false, message: "" };

export function CoupangPartnersForm({ productId, initialUrl }: { productId: string; initialUrl?: string | null }) {
  const action = saveCoupangPartnersLinkAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 rounded-2xl border border-[#e2b7c24d] bg-[#fff8fa] p-4 sm:p-5">
      <label htmlFor={`${productId}-coupang-partners-url`} className="text-xs font-bold text-[#69575e]">쿠팡 파트너스 URL</label>
      <input
        id={`${productId}-coupang-partners-url`}
        name="coupangPartnersUrl"
        type="url"
        inputMode="url"
        maxLength={1000}
        defaultValue={initialUrl ?? ""}
        placeholder="https://link.coupang.com/a/..."
        className="mt-2 min-h-11 w-full rounded-xl border border-[#d9a8b55c] bg-white px-3.5 py-2.5 text-sm text-[#4e4146] outline-none transition placeholder:text-[#a9939a] focus:border-[#b86178] focus:ring-2 focus:ring-[#b8617820]"
      />
      <p className="mt-2 text-[11px] leading-5 text-[#8b777e]">쿠팡 파트너스에서 발급한 HTTPS 링크만 저장돼요. 공식판매자 상품인지 확인한 뒤 연결해 주세요.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" aria-live="polite" className={`min-h-5 text-xs ${state.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>
          {state.message && <span className="inline-flex items-center gap-1.5">{state.success && <Check size={14} />}{state.message}</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {initialUrl && <a href={initialUrl} target="_blank" rel="noopener noreferrer sponsored nofollow" className="line-btn !min-h-10 !px-3 text-xs">현재 링크 확인 <ExternalLink size={13} /></a>}
          {initialUrl && <button type="submit" name="intent" value="clear" formNoValidate disabled={pending} className="line-btn !min-h-10 !px-3 text-xs"><Unlink size={14} /> 연결 해제</button>}
          <button type="submit" name="intent" value="save" disabled={pending} className="ink-btn !min-h-10 !px-4 text-xs">
            {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Link2 size={14} />}
            {pending ? "저장 중" : "링크 연결"}
          </button>
        </div>
      </div>
    </form>
  );
}
