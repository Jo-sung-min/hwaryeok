import Link from "next/link";
import { ArrowRight, Award, MessageCircleQuestion, ShieldCheck, Sparkles } from "lucide-react";
import { ExpertCard, ExpertDisclaimer, QuestionCard } from "@/components/expert-ui";
import { getExpertQuestions, getExpertRanking, getExperts } from "@/lib/api";

export default async function ExpertsPage() {
  const [experts, ranking, questions] = await Promise.all([
    getExperts(),
    getExpertRanking("MONTH"),
    getExpertQuestions(),
  ]);

  return (
    <div className="min-h-screen pb-24">
      <section className="relative overflow-hidden border-b border-[#edcbd3] bg-[radial-gradient(circle_at_78%_20%,rgba(246,193,205,.42),transparent_28%),linear-gradient(145deg,#fff_0%,#fff4f6_62%,#fde8ed_100%)] py-10 md:py-24">
        <div className="container-page relative grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <p className="eyebrow mb-5">HWA:RYEOK EXPERT</p>
            <h1 className="font-myeongjo text-[34px] font-semibold leading-tight sm:text-4xl md:text-6xl">피부 고민에<br /><span className="text-[#a24f64]">검증된 시선</span>을 더해요</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[#75666b] md:text-base">의사·전문의·근무지 인증을 구분해 보여주고, 화장품과 성분에 관한 답변을 한곳에 모았습니다.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link href="/questions" className="ink-btn w-full sm:w-auto"><MessageCircleQuestion size={18} /> 전문가에게 질문하기</Link><Link href="/experts/ranking" className="line-btn w-full sm:w-auto"><Award size={18} /> 활동 랭킹</Link></div>
          </div>
          <div className="paper-card rounded-[28px] p-5 sm:rounded-[34px] sm:p-6 md:p-8">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f5d5dd] text-[#9a4c61]"><ShieldCheck /></span><div><p className="text-xs font-bold tracking-[.12em] text-[#9a6472]">VERIFICATION</p><h2 className="font-myeongjo text-xl font-bold">인증 정보를 분리해 표시해요</h2></div></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{["의사 면허", "전문의 자격", "현재 근무지"].map((label, index) => <div key={label} className="rounded-2xl border border-[#ecd4da] bg-white/70 p-4"><strong className="text-[#a34f64]">0{index + 1}</strong><p className="mt-2 text-sm font-semibold">{label}</p><p className="mt-1 text-[11px] leading-5 text-[#85747a]">각 항목의 확인 여부를 따로 안내</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-18">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-2">THIS MONTH</p><h2 className="font-myeongjo text-3xl font-semibold">이번 달 활동 전문가</h2></div><Link href="/experts/ranking" className="inline-flex items-center gap-1 text-sm font-bold text-[#9e4e62]">전체 랭킹 <ArrowRight size={16} /></Link></div>
        <div className="grid gap-5 md:grid-cols-3">{ranking.content.slice(0, 3).map((item) => <div key={item.expert.id} className="relative"><span className="absolute -left-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#3b3033] font-myeongjo text-sm font-bold text-white shadow-lg">{item.rank}</span><ExpertCard expert={item.expert} /></div>)}</div>
        <div className="mt-6"><ExpertDisclaimer /></div>
      </section>

      <section className="border-y border-[#eed5db] bg-[#fff7f9] py-10 md:py-18">
        <div className="container-page"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="eyebrow mb-2">VERIFIED EXPERTS</p><h2 className="font-myeongjo text-3xl font-semibold">화력 전문가</h2></div><span className="text-sm text-[#8b747b]">{experts.length}명 활동 중</span></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{experts.map((expert) => <ExpertCard key={expert.id} expert={expert} />)}</div></div>
      </section>

      <section className="container-page py-10 md:py-18">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-2">Q&amp;A</p><h2 className="font-myeongjo text-3xl font-semibold">요즘 많이 묻는 고민</h2></div><Link href="/questions" className="line-btn !min-h-11">질문 모두 보기 <ArrowRight size={16} /></Link></div>
        <div className="grid gap-4 md:grid-cols-2">{questions.slice(0, 4).map((question) => <QuestionCard key={question.id} question={question} />)}</div>
        <div className="site-glass mt-10 flex flex-col items-center rounded-[28px] px-6 py-8 text-center text-white md:flex-row md:justify-between md:text-left"><div><p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[.14em] text-[#efb9c5] md:justify-start"><Sparkles size={15} /> EXPERT JOIN</p><h3 className="mt-2 font-myeongjo text-2xl font-bold">화력의 신뢰를 함께 만들어주세요</h3><p className="mt-2 text-sm text-white/65">의료진 인증 후 전문 답변 활동을 시작할 수 있어요.</p></div><Link href="/experts/apply" className="line-btn mt-5 md:mt-0">전문가 인증 신청</Link></div>
      </section>
    </div>
  );
}
