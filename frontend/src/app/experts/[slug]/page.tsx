import Link from "next/link";
import { ArrowLeft, Bookmark, Building2, Heart, MapPin, MessageCircle } from "lucide-react";
import { ExpertAvatar, ExpertDisclaimer, VerificationBadges } from "@/components/expert-ui";
import { getExpert } from "@/lib/api";

export default async function ExpertDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { expert, recentAnswers } = await getExpert(slug);
  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#eccfd6] bg-gradient-to-br from-white via-[#fff8fa] to-[#fbe5ea] py-10 md:py-16">
        <div className="container-page"><Link href="/experts" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#7a686e]"><ArrowLeft size={16} /> 전문가 홈</Link><div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center"><ExpertAvatar expert={expert} large /><div className="flex-1"><p className="text-xs font-bold tracking-[.14em] text-[#a25569]">VERIFIED EXPERT</p><h1 className="mt-2 font-myeongjo text-4xl font-bold">{expert.realName} <span className="text-xl font-normal text-[#77656b]">{expert.specialty ?? "의사"}</span></h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#75666b]">{expert.bio}</p><div className="mt-4"><VerificationBadges expert={expert} /></div></div></div></div>
      </section>
      <section className="container-page grid gap-8 py-10 lg:grid-cols-[.7fr_1.3fr]">
        <aside className="space-y-5">
          <div className="paper-card rounded-[26px] p-6"><h2 className="font-myeongjo text-xl font-bold">활동 정보</h2><div className="mt-5 grid grid-cols-3 text-center text-xs text-[#786970]"><span><strong className="block text-2xl text-[#a25165]">{expert.stats.answerCount}</strong>답변</span><span><strong className="block text-2xl text-[#a25165]">{expert.stats.helpfulCount}</strong>도움</span><span><strong className="block text-2xl text-[#a25165]">{expert.stats.adoptedCount}</strong>채택</span></div><div className="mt-5 flex flex-wrap gap-2">{expert.topics.map((topic) => <span key={topic.code} className="rounded-full bg-[#f9e6eb] px-3 py-1.5 text-xs font-semibold text-[#945064]">#{topic.name}</span>)}</div></div>
          {expert.workplace && <div className="rounded-[26px] border border-[#e8cbd2] bg-white p-6"><div className="flex items-center gap-2"><Building2 className="text-[#a55267]" size={20} /><h2 className="font-myeongjo text-xl font-bold">현재 근무지</h2></div><p className="mt-4 font-bold">{expert.workplace.hospitalName}</p><p className="mt-2 flex gap-2 text-xs leading-5 text-[#7e6d73]"><MapPin className="shrink-0" size={15} /> {expert.workplace.address}</p>{expert.workplace.verified && <p className="mt-3 text-xs font-bold text-[#53745d]">근무지 확인 완료</p>}</div>}
          <ExpertDisclaimer />
        </aside>
        <div><div className="mb-5 flex items-center justify-between"><h2 className="font-myeongjo text-2xl font-bold">최근 답변</h2><Link href="/questions" className="text-sm font-bold text-[#a24f64]">전체 질문 보기</Link></div><div className="space-y-4">{recentAnswers.length ? recentAnswers.map((answer) => <article key={answer.id} className="rounded-[24px] border border-[#ead0d6] bg-white/85 p-6"><p className="whitespace-pre-wrap text-sm leading-7 text-[#5f5357]">{answer.content}</p><div className="mt-5 flex items-center gap-4 border-t border-[#eee0e3] pt-4 text-xs text-[#8a747b]"><span className="flex items-center gap-1"><Heart size={14} /> {answer.helpfulCount}</span><span className="flex items-center gap-1"><Bookmark size={14} /> {answer.saveCount}</span>{answer.adopted && <span className="ml-auto rounded-full bg-[#edf4ef] px-2.5 py-1 font-bold text-[#55715e]">채택된 답변</span>}</div></article>) : <div className="rounded-[24px] border border-dashed border-[#d9b6bf] p-10 text-center text-sm text-[#88757b]"><MessageCircle className="mx-auto mb-3" /> 아직 공개된 답변이 없어요.</div>}</div></div>
      </section>
    </div>
  );
}
