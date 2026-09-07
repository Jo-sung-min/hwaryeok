"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { moderateUsageVideoAction, type UsageVideoActionState } from "@/components/usage-videos/actions";
import type { UsageVideo } from "@/lib/usage-video-types";

const initialState: UsageVideoActionState = { success: false, message: "" };
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#e7d2d9] bg-white px-3 text-sm font-normal outline-none focus:border-[#c35c7c] focus:ring-2 focus:ring-[#f8dce5]";

export function UsageVideoModerationForm({ video }: { video: UsageVideo }) {
  const [state, action, pending] = useActionState(moderateUsageVideoAction.bind(null, video.id), initialState);
  return <form action={action} className="grid gap-4">
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-[#745d69]">노출 상태<select name="status" required defaultValue={video.status === "PENDING" ? "" : video.status} className={inputClass}><option value="" disabled>검토 후 선택</option><option value="APPROVED">승인 · 공개 제품에 노출</option><option value="REJECTED">반려 · 노출하지 않음</option><option value="HIDDEN">숨김 · 노출 중단</option></select>{state.fieldErrors?.status && <span className="mt-1 block text-[#aa4968]">{state.fieldErrors.status}</span>}</label><label className="text-xs font-semibold text-[#745d69]">그룹 안 노출 순서<input name="displayOrder" type="number" required min={0} max={100000} step={1} defaultValue={video.displayOrder} className={inputClass} /><span className="mt-1 block text-[10px] font-normal leading-5 text-[#9b8190]">작은 숫자가 먼저, 동일하면 최신 검토순</span></label></div>
    <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-[#fff2f7] px-3 text-xs font-semibold text-[#995772]"><input name="featured" type="checkbox" defaultChecked={video.featured} className="h-4 w-4 accent-[#b85477]" />관리자 우선 노출 그룹에 표시</label>
    <label className="text-xs font-semibold text-[#745d69]">등록자에게 전달할 검토 메모<textarea name="moderationNote" maxLength={1000} rows={3} defaultValue={video.moderationNote ?? ""} placeholder="제품과 무관한 영상, 접속 불가, 협찬 표시 보완 등 검토 사유를 남겨주세요." className={`${inputClass} py-3 leading-6`} /><span className="mt-1 block text-[10px] font-normal leading-5 text-[#9b8190]">메모는 등록자와 관리자만 볼 수 있어요.</span>{state.fieldErrors?.moderationNote && <span className="mt-1 block text-[#aa4968]">{state.fieldErrors.moderationNote}</span>}</label>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p role="status" aria-live="polite" className={`text-xs leading-6 ${state.success ? "text-[#477456]" : "text-[#a6506f]"}`}>{state.message}</p><button type="submit" disabled={pending} className="ink-btn shrink-0">{pending ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{pending ? "저장 중" : "검토 결과 저장"}</button></div>
  </form>;
}
