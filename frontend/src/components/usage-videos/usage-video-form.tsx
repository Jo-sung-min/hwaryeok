"use client";

import Link from "next/link";
import { LoaderCircle, Send, Save } from "lucide-react";
import { useActionState, useId, type ReactNode } from "react";
import { editUsageVideoAction, submitUsageVideoAction, type UsageVideoActionState } from "./actions";
import type { UsageVideo } from "@/lib/usage-video-types";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#e7d2d9] bg-white px-3 text-sm font-normal outline-none focus:border-[#c35c7c] focus:ring-2 focus:ring-[#f8dce5]";
const initialState: UsageVideoActionState = { success: false, message: "" };

export function UsageVideoForm({ productId, video }: { productId: string; video?: UsageVideo }) {
  const action = video ? editUsageVideoAction.bind(null, video.id) : submitUsageVideoAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const prefix = useId();

  return <form action={formAction} className="grid gap-4">
    {video && <p className="rounded-xl bg-[#fff3f7] p-3 text-xs leading-6 text-[#92506a]">수정하면 현재 노출이 중단되고 검토 대기 상태로 돌아갑니다.</p>}
    <Field label="영상 제목" error={state.fieldErrors?.title}>
      <input name="title" required maxLength={120} defaultValue={state.values?.title ?? video?.title} placeholder="예: 이 앰플을 촉촉하게 바르는 저녁 루틴" className={inputClass} />
    </Field>
    <Field label="유튜브 영상 링크" hint="youtube.com/watch, youtu.be, Shorts 링크를 등록할 수 있어요." error={state.fieldErrors?.videoUrl}>
      <input name="videoUrl" type="url" required maxLength={2048} defaultValue={state.values?.videoUrl ?? video?.videoUrl} placeholder="https://www.youtube.com/watch?v=..." className={inputClass} />
    </Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="채널 이름" error={state.fieldErrors?.channelName}>
        <input name="channelName" required maxLength={100} defaultValue={state.values?.channelName ?? video?.channelName} placeholder="화면에 표시할 채널명" className={inputClass} />
      </Field>
      <Field label="유튜브 채널 링크" hint="유튜브 채널의 @핸들 또는 채널 URL" error={state.fieldErrors?.channelUrl}>
        <input name="channelUrl" type="url" required maxLength={2048} defaultValue={state.values?.channelUrl ?? video?.channelUrl} placeholder="https://www.youtube.com/@mychannel" className={inputClass} />
      </Field>
    </div>
    <Field label="사용법 소개 (선택)" error={state.fieldErrors?.description}>
      <textarea name="description" rows={3} maxLength={2000} defaultValue={state.values?.description ?? video?.description ?? ""} placeholder="제품 사용 순서나 영상에서 소개하는 내용을 알려주세요. 협찬·광고가 포함되어 있다면 함께 적어 주세요." className={`${inputClass} py-3 leading-6`} />
    </Field>
    <label htmlFor={`${prefix}-permission`} className="flex min-h-11 cursor-pointer items-start gap-2 text-xs leading-6 text-[#77636d]">
      <input id={`${prefix}-permission`} type="checkbox" name="permission" required className="mt-1.5 h-4 w-4 shrink-0 accent-[#c35c7c]" />
      본인의 채널 또는 공유 권한이 있는 영상을 등록하며, 등록한 채널 정보는 사용자 제공 정보이고 관리자 승인 후 노출됨을 확인했어요.
    </label>
    <div className="flex flex-col gap-3 border-t border-[#f0e2e7] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1"><p role="status" aria-live="polite" className={`text-xs leading-6 ${state.success ? "text-[#3e7057]" : "text-[#a74a65]"}`}>{state.message}</p>{state.success && !video && <Link href="/my/usage-videos" className="mt-1 inline-flex min-h-10 items-center text-xs font-semibold text-[#b24e70] underline underline-offset-4">내 영상 관리로 이동</Link>}</div>
      <button type="submit" disabled={pending} className="ink-btn shrink-0">{pending ? <LoaderCircle size={16} className="animate-spin" /> : video ? <Save size={16} /> : <Send size={16} />}{pending ? "저장 중" : video ? "수정하고 재검토 요청" : "검토 요청하기"}</button>
    </div>
  </form>;
}

function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return <label className="block min-w-0 text-xs font-semibold text-[#705e68]">{label}{children}{error ? <span className="mt-1.5 block font-normal text-[#ac4362]">{error}</span> : hint ? <span className="mt-1.5 block font-normal leading-5 text-[#93838a]">{hint}</span> : null}</label>;
}
