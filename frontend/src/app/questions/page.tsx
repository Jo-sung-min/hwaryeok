import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MessageCircleQuestion, PenLine } from "lucide-react";
import { QuestionCard } from "@/components/expert-ui";
import { getExpertQuestions } from "@/lib/api";

export const metadata: Metadata = {
  title: "화장품 고민 상담소",
  description: "화장품과 성분에 관한 사용자 질문과 인증 전문가의 공개 답변을 살펴보세요.",
  alternates: { canonical: "/questions" },
};

const filters = [{ code: "ALL", name: "전체" }, { code: "OPEN", name: "답변 대기" }, { code: "ANSWERED", name: "답변 완료" }];

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status = filters.some((item) => item.code === params.status) ? params.status! : "ALL";
  const questions = await getExpertQuestions(status);

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#ead0d7] bg-gradient-to-r from-white to-[#fff0f3] py-9 md:py-16">
        <div className="container-page">
          <Link href="/experts" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#68575d]"><ArrowLeft size={16} /> 전문가 홈</Link>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="eyebrow mb-2">EXPERT Q&amp;A</p><h1 className="font-myeongjo text-[32px] font-bold leading-tight sm:text-4xl">화장품 고민 상담소</h1><p className="mt-3 text-sm leading-7 text-[#66565c]">검증된 의료진에게 성분과 피부 반응을 물어보세요.</p></div>
            <Link href="/questions/ask" className="ink-btn w-full self-start sm:w-auto"><PenLine size={17} /> 질문 작성</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-7 md:py-9">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2" aria-label="질문 상태">
          {filters.map((item) => <Link key={item.code} href={item.code === "ALL" ? "/questions" : `/questions?status=${item.code}`} aria-current={status === item.code ? "page" : undefined} className="glass-choice shrink-0 rounded-full px-4 py-2.5 text-xs font-bold">{item.name}</Link>)}
        </div>
        {questions.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">{questions.map((question) => <QuestionCard key={question.id} question={question} />)}</div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-[#d9b7bf] py-14 text-center"><MessageCircleQuestion className="mx-auto text-[#b37484]" size={34} /><h2 className="mt-4 font-myeongjo text-xl font-bold">조건에 맞는 질문이 없어요</h2><Link href="/questions/ask" className="line-btn mt-5">첫 질문 남기기</Link></div>
        )}
      </section>
    </div>
  );
}
