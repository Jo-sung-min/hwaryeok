"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deletePromotionAction, type PromotionActionState } from "./actions";

const initialState: PromotionActionState = { success: false, message: "" };

export function PromotionDeleteForm({ promotionId }: { promotionId: string }) {
  const [state, action, pending] = useActionState(deletePromotionAction.bind(null, promotionId), initialState);
  return (
    <form action={action} className="mt-5 rounded-2xl border border-[#efcfd7] bg-[#fff8fa] p-4">
      <label className="text-[11px] font-semibold text-[#765f67]">삭제하려면 광고 ID <code className="rounded bg-white px-1 py-0.5">{promotionId}</code>를 입력하세요.<input name="confirmation" required autoComplete="off" className="mt-2 min-h-11 w-full rounded-xl border border-[#dec4cb] bg-white px-3 text-xs outline-none focus:border-[#b55b73]" /></label>
      <div className="mt-3 flex items-center justify-between gap-3"><p role="status" className="text-[11px] text-[#a14f61]">{state.message}</p><button type="submit" disabled={pending} className="line-btn !min-h-10 shrink-0 text-[#a14f61]">{pending ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />} 광고 삭제</button></div>
    </form>
  );
}
