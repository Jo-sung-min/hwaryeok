import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { QuestionForm } from "@/app/questions/ask/question-form";
import { getIngredients } from "@/lib/api";
import { requireSession } from "@/lib/auth-session";

export default async function AskQuestionPage() {
  await requireSession("/questions/ask");
  const ingredients = (await getIngredients({ size: 50 })).content;
  return <div className="min-h-screen pb-24"><section className="border-b border-[#ecd1d8] bg-[#fff4f6] py-10"><div className="container-page max-w-3xl"><Link href="/questions" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#7c696f]"><ArrowLeft size={16} /> 질문 목록</Link><p className="eyebrow mb-2 mt-5">ASK AN EXPERT</p><h1 className="font-myeongjo text-4xl font-bold">전문가에게 질문하기</h1><p className="mt-3 text-sm leading-7 text-[#76666c]">제품명보다 현재 피부 상태와 사용 후 반응을 자세히 적으면 더 유용한 답변을 받을 수 있어요.</p></div></section><section className="container-page max-w-3xl py-9"><div className="mb-6 flex gap-3 rounded-[20px] border border-[#ead0d6] bg-white p-4 text-xs leading-6 text-[#75666b]"><ShieldAlert className="mt-0.5 shrink-0 text-[#a65368]" size={20} /><p>온라인 답변은 일반적인 정보이며 진단이나 처방을 대신하지 않습니다. 통증, 빠르게 번지는 염증, 호흡 곤란 등 급한 증상은 즉시 의료기관을 찾아주세요.</p></div><div className="paper-card rounded-[28px] p-6 md:p-9"><QuestionForm ingredients={ingredients} /></div></section></div>;
}
