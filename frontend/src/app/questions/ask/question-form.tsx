"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { askQuestionAction, type ExpertFormState } from "@/app/questions/actions";
import type { Ingredient } from "@/lib/types";

export function QuestionForm({ ingredients }: { ingredients: Ingredient[] }) {
  const initialState: ExpertFormState = { success: false, message: "" };
  const [state, action, pending] = useActionState(askQuestionAction, initialState);
  return <form action={action} className="space-y-6"><Field label="질문 제목" error={state.fieldErrors?.title}><input name="title" required maxLength={160} placeholder="예: 세라마이드 크림은 매일 발라도 괜찮을까요?" className="input" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="피부 타입"><select name="skinType" className="input"><option value="">선택 안 함</option>{["건성", "지성", "복합성", "민감성", "중성"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="관련 성분"><select name="ingredientId" className="input"><option value="">선택 안 함</option>{ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}</select></Field></div><Field label="고민 내용" error={state.fieldErrors?.content}><textarea name="content" required minLength={10} maxLength={3000} rows={8} placeholder="사용 중인 제품, 피부 반응, 궁금한 점을 구체적으로 적어주세요." className="input min-h-44 resize-y py-4" /></Field>{state.message && <p role="alert" className={`rounded-2xl p-4 text-sm ${state.success ? "bg-[#edf5ef] text-[#4d7157]" : "bg-[#fff0f2] text-[#a2475c]"}`}>{state.message}</p>}<button disabled={pending} className="ink-btn w-full disabled:opacity-55">{pending ? "질문을 등록하는 중…" : <><Send size={17} /> 질문 등록하기</>}</button></form>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span>{children}{error && <span className="mt-1 block text-xs text-[#aa425a]">{error}</span>}</label>;
}
