import Link from "next/link";
import { ArrowLeft, MessageCircleQuestion, PenLine } from "lucide-react";
import { QuestionCard } from "@/components/expert-ui";
import { getExpertQuestions } from "@/lib/api";

const filters = [{ code: "ALL", name: "전체" }, { code: "OPEN", name: "답변 대기" }, { code: "ANSWERED", name: "답변 완료" }];

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status = filters.some((item) => item.code === params.status) ? params.status! : "ALL";
  const questions = await getExpertQuestions(status);
  return <div className="min-h-screen pb-24"><section className="border-b border-[#ead0d7] bg-gradient-to-r from-[#fff] to-[#fff0f3] py-10 md:py-16"><div className="container-page"><Link href="/experts" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#79666c]"><ArrowLeft size={16} /> 전문가 홈</Link><div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">EXPERT Q&amp;A</p><h1 className="font-myeongjo text-4xl font-bold">화장품 고민 상담소</h1><p className="mt-3 text-sm text-[#76656b]">검증된 의료진에게 성분과 피부 반응을 물어보세요.</p></div><Link href="/questions/ask" className="ink-btn self-start"><PenLine size={17} /> 질문 작성</Link></div></div></section><section className="container-page py-9"><div className="flex gap-2">{filters.map((item) => <Link key={item.code} href={item.code === "ALL" ? "/questions" : `/questions?status=${item.code}`} className={`rounded-full px-4 py-2.5 text-xs font-bold ${status === item.code ? "bg-[#3c3034] text-white" : "border border-[#dfbdc5] bg-white text-[#78666c]"}`}>{item.name}</Link>)}</div>{questions.length ? <div className="mt-7 grid gap-4 md:grid-cols-2">{questions.map((question) => <QuestionCard key={question.id} question={question} />)}</div> : <div className="mt-8 rounded-[28px] border border-dashed border-[#d9b7bf] py-16 text-center"><MessageCircleQuestion className="mx-auto text-[#b37484]" size={34} /><h2 className="mt-4 font-myeongjo text-xl font-bold">조건에 맞는 질문이 없어요</h2><Link href="/questions/ask" className="line-btn mt-5">첫 질문 남기기</Link></div>}</section></div>;
}
