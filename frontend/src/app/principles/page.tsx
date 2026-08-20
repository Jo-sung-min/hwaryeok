import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeInfo, CheckCircle2, Database, HeartHandshake, Scale, ShieldCheck, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "화력을 읽는 방법",
  description: "성분, 사용감, 피부 궁합, 정보 상태로 화력 리포트를 읽는 방법을 알아보세요.",
};

const currentPromises = [
  {
    icon: ShieldCheck,
    title: "한눈에 읽는 정보",
    description: "성분, 사용감, 피부 궁합, 정보 상태를 같은 흐름에서 살펴볼 수 있게 정리합니다.",
  },
  {
    icon: Scale,
    title: "브랜드보다 성분을 먼저",
    description: "브랜드 인지도, 광고비, 판매량을 추천 점수에서 제외해 신생 브랜드도 같은 기준으로 평가합니다.",
  },
  {
    icon: Database,
    title: "데이터의 깊이까지 표시",
    description: "리뷰 수와 근거가 충분한지 살펴보고, 수집 중·참고 점수·공식 점수를 구분해 보여줍니다.",
  },
  {
    icon: HeartHandshake,
    title: "내 방식대로 시작",
    description: "궁금한 제품부터 둘러보고, 더 섬세한 이야기가 필요할 때 피부 프로필을 더할 수 있습니다.",
  },
];

const scoreRules = [
  ["성분 구성 · 55%", "연결된 주요 성분의 안전성, 근거 A·B·C 수준, 전성분 순서를 함께 봅니다."],
  ["내 피부 적합 · 35%", "피부 타입뿐 아니라 당김, 유분, 민감도, 고민, 면도·메이크업 같은 생활 신호를 반영합니다."],
  ["데이터 신뢰 · 10%", "연결된 성분 수, 성분별 근거 수준, 출처 확인 상태를 바탕으로 결과의 확실성을 표시합니다."],
  ["사용자 리뷰 · 별도 표시", "사용 경험은 참고 정보로 보여주되 브랜드가 이미 유명하다는 이유로 성분 추천 순위를 올리지는 않습니다."],
];

export default function PrinciplesPage() {
  return (
    <>
      <div className="min-h-screen pb-20">
        <section className="border-b border-[#dfa6b51f] bg-[#fff1f4] py-14 md:py-24">
          <div className="container-page text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/75 text-[#a65368] shadow-sm"><ShieldCheck size={26} /></span>
            <p className="eyebrow mt-6">HWA:RYEOK GUIDE</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-balance font-myeongjo text-[36px] font-semibold leading-tight sm:text-5xl md:text-6xl">내 피부에 맞는 선택을 더 선명하게</h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-[#75675f]">무엇이 많이 팔리는지보다 내 피부에 왜 맞는지, 어떤 성분을 확인해야 하는지부터 차분히 보여드립니다.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/skin-check" className="ink-btn">1분 피부 체크 <ArrowRight size={17} /></Link><Link href="/ingredients" className="line-btn">성분 이야기 보기</Link></div>
          </div>
        </section>

        <section className="container-page py-14 md:py-24">
          <div className="mb-9 max-w-2xl"><p className="eyebrow mb-4">HOW HWA:RYEOK WORKS</p><h2 className="section-title font-myeongjo">화력을 이루는 네 가지 이야기</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            {currentPromises.map(({ icon: Icon, title, description }) => (
              <article key={title} className="paper-card rounded-[26px] p-6 sm:p-8">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#a6536812] text-[#a65368]"><Icon size={20} /></span>
                <h3 className="mt-5 font-myeongjo text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#756860]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="score-policy" className="scroll-mt-24 border-y border-[#dfa6b51f] bg-white py-14 md:py-24">
          <div className="container-page grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-16">
            <div><p className="eyebrow mb-4">UNDERSTAND THE SCORE</p><h2 className="section-title font-myeongjo">제품 순서를 정하는<br />세 가지 기준</h2><p className="mt-5 text-sm leading-7 text-[#756860]">같은 피부 조건이면 모든 브랜드를 같은 식으로 계산하고, 자료가 적은 제품은 낮은 신뢰도로 보수적으로 보여줘요.</p></div>
            <div className="grid gap-3">
              {scoreRules.map(([title, description], index) => (
                <div key={title} className="flex gap-4 rounded-[22px] border border-[#75564516] bg-[#fffafa] p-5">
                  <span className="font-myeongjo text-xl text-[#a65368]">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3 className="font-myeongjo text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#756860]">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-24">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#7d8c7330] bg-[#edf2e9] p-6 sm:p-8">
              <div className="flex items-center gap-3 text-[#65725f]"><CheckCircle2 size={21} /><h2 className="font-myeongjo text-2xl font-semibold">더 잘 이해할 수 있도록</h2></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#5f655a]">
                <li>• 점수의 계산 기준과 적용한 피부 조건을 함께 표시합니다.</li>
                <li>• 데이터가 부족하면 그 사실을 결과보다 먼저 알립니다.</li>
                <li>• 제품의 장점과 주의점을 한 화면에서 함께 보여줍니다.</li>
                <li>• 사용자 리뷰와 성분 기반 분석을 구분합니다.</li>
                <li>• 신생 브랜드도 성분 근거가 좋으면 같은 순위 기회를 가집니다.</li>
              </ul>
            </div>
            <div className="rounded-[28px] border border-[#c78e7635] bg-[#f7e9e4] p-6 sm:p-8">
              <div className="flex items-center gap-3 text-[#a36c58]"><TriangleAlert size={21} /><h2 className="font-myeongjo text-2xl font-semibold">차분히 살펴볼 부분</h2></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#6f5f58]">
                <li>• 리뷰가 적을 때는 정보 상태를 먼저 확인해 주세요.</li>
                <li>• 피부 궁합은 컨디션과 사용 환경에 따라 달라질 수 있어요.</li>
                <li>• 적합도는 의료적 진단이나 효과 보장을 뜻하지 않아요.</li>
                <li>• 성분과 사용감은 함께 살펴볼 때 더 선명해집니다.</li>
                <li>• 광고비, 판매량, 브랜드 인지도는 맞춤 점수에 넣지 않습니다.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dfa6b51f] bg-[#fff2f5] py-14 md:py-20">
          <div className="container-page max-w-4xl">
            <div className="flex flex-col gap-5 rounded-[28px] border border-white/75 bg-white/70 p-6 shadow-sm sm:p-8 md:flex-row md:items-start">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#a6536812] text-[#a65368]"><BadgeInfo size={22} /></span>
              <div>
                <h2 className="font-myeongjo text-2xl font-semibold">정보는 계속 새로워집니다</h2>
                <p className="mt-3 text-sm leading-7 text-[#756860]">성분 정보, 리뷰 수, 제품 상태가 달라지면 확인 시점과 데이터 상태를 함께 갱신합니다. 결과가 달라진 이유도 이해하기 쉽게 기록해요.</p>
                <p className="mt-3 text-xs leading-6 text-[#8a7770]">화력은 완성된 정답보다 더 나은 선택을 돕는 살아 있는 가이드를 지향합니다.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-14 text-center md:py-20">
          <p className="text-sm leading-7 text-[#756860]">화력의 정보는 화장품 선택을 돕기 위한 참고 자료이며 의료적 진단이나 치료를 대신하지 않습니다.</p>
          <Link href="/skin-check" className="ink-btn mt-7">내 피부 기준부터 확인하기 <ArrowRight size={17} /></Link>
        </section>
      </div>
    </>
  );
}
