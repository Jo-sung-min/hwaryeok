import Link from "next/link";
import { ArrowLeft, Award, Heart, MessageCircle, Sparkles } from "lucide-react";
import { ExpertAvatar, ExpertDisclaimer, expertTopics } from "@/components/expert-ui";
import { getExpertRanking } from "@/lib/api";

const periods = [{ code: "WEEK", name: "이번 주" }, { code: "MONTH", name: "이번 달" }, { code: "YEAR", name: "올해" }, { code: "ALL_TIME", name: "전체" }];

export default async function ExpertRankingPage({ searchParams }: { searchParams: Promise<{ period?: string; topic?: string }> }) {
  const params = await searchParams;
  const period = periods.some((item) => item.code === params.period) ? params.period! : "MONTH";
  const topic = expertTopics.some((item) => item.code === params.topic) ? params.topic : undefined;
  const ranking = await getExpertRanking(period, topic);
  const href = (nextPeriod: string, nextTopic?: string) => `/experts/ranking?period=${nextPeriod}${nextTopic ? `&topic=${nextTopic}` : ""}`;

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#ecd0d7] bg-[#fff3f6] py-9 md:py-16">
        <div className="container-page">
          <Link href="/experts" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#65565c]"><ArrowLeft size={16} /> 전문가 홈</Link>
          <div className="mt-4 flex items-end gap-3">
            <Award className="shrink-0 text-[#a55267]" size={32} />
            <div><p className="eyebrow mb-1">ACTIVITY RANKING</p><h1 className="font-myeongjo text-[32px] font-bold leading-tight sm:text-4xl">전문가 활동 랭킹</h1></div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#66575d]">화력 안에서 질문에 답하고 유용한 정보를 나눈 활동을 기간별로 모았습니다.</p>
        </div>
      </section>

      <section className="container-page py-7 md:py-9">
        <div className="scrollbar-hide flex snap-x gap-2 overflow-x-auto pb-2" aria-label="활동 기간">
          {periods.map((item) => <Link key={item.code} href={href(item.code, topic)} aria-current={period === item.code ? "page" : undefined} className="glass-choice shrink-0 snap-start rounded-full px-4 py-2.5 text-xs font-bold">{item.name}</Link>)}
        </div>
        <div className="scrollbar-hide mt-2 flex snap-x gap-2 overflow-x-auto pb-2" aria-label="활동 주제">
          <Link href={href(period)} aria-current={!topic ? "page" : undefined} className="glass-choice shrink-0 snap-start rounded-full px-3 py-2 text-xs font-semibold">전체 주제</Link>
          {expertTopics.map((item) => <Link key={item.code} href={href(period, item.code)} aria-current={topic === item.code ? "page" : undefined} className="glass-choice shrink-0 snap-start rounded-full px-3 py-2 text-xs font-semibold">{item.name}</Link>)}
        </div>

        <div className="mt-6 space-y-4">
          {ranking.content.map((item) => (
            <Link key={item.expert.id} href={`/experts/${item.expert.slug}`} className="paper-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[24px] p-4 sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:p-5">
              <span className={`grid h-10 w-10 place-items-center rounded-full font-myeongjo text-lg font-bold ${item.rank <= 3 ? "bg-[#a55368] text-white" : "bg-[#f4e7ea] text-[#80636b]"}`}>{item.rank}</span>
              <div className="flex min-w-0 items-center gap-3">
                <ExpertAvatar expert={item.expert} />
                <div className="min-w-0"><h2 className="truncate font-myeongjo text-lg font-bold">{item.expert.realName}</h2><p className="mt-1 truncate text-xs text-[#705d64]">{item.expert.specialty ?? "의사"} · {item.expert.verificationLabel}</p></div>
              </div>
              <div className="col-span-2 flex justify-around gap-4 border-t border-[#ead9dd] pt-3 text-center text-[11px] text-[#725f66] sm:col-span-1 sm:justify-start sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <span><MessageCircle className="mx-auto mb-1" size={16} /><b className="text-sm text-[#493c40]">{item.periodStats.answerCount}</b><br />답변</span>
                <span><Heart className="mx-auto mb-1" size={16} /><b className="text-sm text-[#493c40]">{item.periodStats.helpfulCount}</b><br />도움</span>
                <span><Sparkles className="mx-auto mb-1" size={16} /><b className="text-sm text-[#493c40]">{item.activityScore}</b><br />활동점수</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8"><ExpertDisclaimer /></div>
      </section>
    </div>
  );
}
