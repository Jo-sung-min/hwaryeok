"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { answerQuestionAction, type ExpertFormState } from "@/app/questions/actions";

export function AnswerForm({ questionId }: { questionId: string }) {
  const initialState: ExpertFormState = { success: false, message: "" };
  const [state, action, pending] = useActionState(answerQuestionAction.bind(null, questionId), initialState);
  return <form action={action} className="rounded-[24px] border border-[#dfb8c2] bg-[#fff8fa] p-5 md:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[.12em] text-[#9e5366]">VERIFIED EXPERT</p><h2 className="mt-1 font-myeongjo text-xl font-bold">전문가 답변 작성</h2></div><span className="rounded-full bg-[#f1d2da] px-3 py-1.5 text-[10px] font-bold text-[#90485a]">인증 완료</span></div><textarea name="content" required minLength={20} maxLength={4000} rows={7} className="input mt-4 min-h-40 resize-y py-4" placeholder="근거와 주의사항을 포함해 이해하기 쉬운 답변을 작성해 주세요." />{state.message && <p role="status" className={`mt-3 rounded-xl p-3 text-xs ${state.success ? "bg-[#eaf3ec] text-[#507059]" : "bg-[#fff0f2] text-[#a0475b]"}`}>{state.message}</p>}<button disabled={pending} className="ink-btn mt-4 w-full disabled:opacity-55">{pending ? "답변 등록 중…" : <><Send size={16} /> 답변 등록</>}</button></form>;
}
