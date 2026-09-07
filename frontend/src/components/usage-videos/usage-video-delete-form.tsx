"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteUsageVideoAction, type UsageVideoActionState } from "./actions";

const initialState: UsageVideoActionState = { success: false, message: "" };

export function UsageVideoDeleteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteUsageVideoAction.bind(null, id), initialState);
  return <details className="mt-5 border-t border-[#f0e1e7] pt-3"><summary className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs text-[#a46377]"><Trash2 size={13} />영상 링크 등록 삭제</summary><form action={action} className="mt-2 rounded-xl bg-[#fff6f9] p-4"><p className="text-xs leading-6 text-[#926777]">화력에 등록한 링크와 검토 기록이 삭제됩니다. 유튜브 원본 영상과 채널은 삭제되지 않아요.</p><label className="my-3 flex min-h-11 cursor-pointer items-center gap-2 text-xs text-[#8b5c6e]"><input name="confirmDelete" type="checkbox" required className="h-4 w-4 accent-[#b25676]" />화력에서 이 영상 등록을 삭제할게요.</label><button type="submit" disabled={pending} className="line-btn !min-h-11 !text-[#a44666]">{pending && <LoaderCircle size={14} className="animate-spin" />}{pending ? "삭제 중" : "등록 삭제하기"}</button><p role="status" aria-live="polite" className="mt-2 text-xs leading-6 text-[#a34f6f]">{state.message}</p></form></details>;
}
