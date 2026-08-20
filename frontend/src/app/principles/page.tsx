import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeInfo, CheckCircle2, Database, HeartHandshake, Scale, ShieldCheck, TriangleAlert } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "운영 원칙 — 화력",
  description: "광고 없이 시작하는 화력의 정보·점수·리뷰 운영 원칙을 확인하세요.",
};

const currentPromises = [
  {
    icon: ShieldCheck,
    title: "광고 없이 정보부터",
    description: "초기 화력은 브랜드 광고, 협찬 노출, 제휴 구매 링크 없이 제품 정보와 판단 기준을 제공하는 데 집중합니다.",
  },
  {
    icon: Scale,
    title: "돈으로 점수를 바꿀 수 없음",
    description: "현재와 미래 모두 결제 여부가 화력점수, 리뷰점수, 개인 적합도 또는 일반 노출 순서에 영향을 주지 않게 설계합니다.",
  },
  {
    icon: Database,
    title: "데이터의 양과 한계를 공개",
    description: "리뷰 수가 적거나 근거가 부족하면 높은 점수처럼 포장하지 않고 수집 중, 참고 점수, 공식 점수를 구분합니다.",
  },
  {
    icon: HeartHandshake,
    title: "선택권은 사용자에게",
    description: "가입과 피부 프로필 등록을 강제하지 않습니다. 정보부터 살펴본 뒤 원하는 경우에만 개인화를 사용할 수 있습니다.",
  },
];

const scoreRules = [
  ["성분 화력점수", "전성분 구성과 조합을 바탕으로 제품이 어떤 기능을 목표로 하는지 보여줍니다."],
  ["사용자 리뷰점수", "카테고리별 동일한 질문으로 실제 사용 경험을 모아 표시합니다."],
  ["나의 적합도", "피부 타입과 고민을 적용한 참고 정보이며 의료적 진단이나 효과 보장이 아닙니다."],
  ["정보 신뢰도", "리뷰 수, 근거 수준, 데이터 최신성을 바탕으로 현재 결과를 얼마나 참고할 수 있는지 알려줍니다."],
];

export default function PrinciplesPage() {
  return (
    <>
      <div className="min-h-screen pb-20">
        <section className="border-b border-[#dfa6b51f] bg-[#fff1f4] py-14 md:py-24">
          <div className="container-page text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/75 text-[#a65368] shadow-sm"><ShieldCheck size={26} /></span>
            <p className="eyebrow mt-6">HWA:RYEOK PRINCIPLES</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-balance font-myeongjo text-[36px] font-semibold leading-tight sm:text-5xl md:text-6xl">광고보다 기준을 먼저 쌓겠습니다</h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-[#75675f]">화력은 초기 단계에서 사업성과 광고를 앞세우지 않고, 사람들이 화장품을 스스로 판단할 수 있는 정보를 만드는 데 집중합니다.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/products" className="ink-btn">제품 판정서 보기 <ArrowRight size={17} /></Link><Link href="/ingredients" className="line-btn">성분 기준 살펴보기</Link></div>
          </div>
        </section>

        <section className="container-page py-14 md:py-24">
          <div className="mb-9 max-w-2xl"><p className="eyebrow mb-4">CURRENT COMMITMENT</p><h2 className="section-title font-myeongjo">지금 지키는 네 가지 약속</h2></div>
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
            <div><p className="eyebrow mb-4">SCORE POLICY</p><h2 className="section-title font-myeongjo">서로 다른 점수를<br />하나로 섞지 않아요</h2><p className="mt-5 text-sm leading-7 text-[#756860]">숫자가 무엇을 의미하는지 알 수 있어야 사용자가 결과를 비판적으로 판단할 수 있습니다.</p></div>
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
              <div className="flex items-center gap-3 text-[#65725f]"><CheckCircle2 size={21} /><h2 className="font-myeongjo text-2xl font-semibold">정보를 보여줄 때</h2></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#5f655a]">
                <li>• 점수의 계산 기준과 적용한 피부 조건을 함께 표시합니다.</li>
                <li>• 데이터가 부족하면 그 사실을 결과보다 먼저 알립니다.</li>
                <li>• 제품의 장점과 주의점을 한 화면에서 함께 보여줍니다.</li>
                <li>• 사용자 리뷰와 성분 기반 분석을 구분합니다.</li>
              </ul>
            </div>
            <div className="rounded-[28px] border border-[#c78e7635] bg-[#f7e9e4] p-6 sm:p-8">
              <div className="flex items-center gap-3 text-[#a36c58]"><TriangleAlert size={21} /><h2 className="font-myeongjo text-2xl font-semibold">하지 않을 것</h2></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#6f5f58]">
                <li>• 광고비를 받은 제품의 점수나 일반 순위를 올리지 않습니다.</li>
                <li>• 소수의 리뷰를 충분한 여론처럼 표현하지 않습니다.</li>
                <li>• 적합도를 의학적 진단이나 효과 보장처럼 표현하지 않습니다.</li>
                <li>• 사용자가 원하지 않는 가입이나 프로필 입력을 강제하지 않습니다.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dfa6b51f] bg-[#fff2f5] py-14 md:py-20">
          <div className="container-page max-w-4xl">
            <div className="flex flex-col gap-5 rounded-[28px] border border-white/75 bg-white/70 p-6 shadow-sm sm:p-8 md:flex-row md:items-start">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#a6536812] text-[#a65368]"><BadgeInfo size={22} /></span>
              <div>
                <h2 className="font-myeongjo text-2xl font-semibold">나중에 광고를 도입한다면</h2>
                <p className="mt-3 text-sm leading-7 text-[#756860]">광고 도입 전 정책을 먼저 공개하고, 모든 광고에는 `광고` 또는 `Sponsored` 표시를 붙입니다. 광고 영역은 일반 판정서·검색 결과·순위와 시각적·데이터적으로 분리하며, 제휴 수익 여부가 추천 결과에 영향을 주지 않도록 운영합니다.</p>
                <p className="mt-3 text-xs leading-6 text-[#8a7770]">정책이 변경되면 시행일과 변경 내용을 이 페이지에 공개합니다.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-14 text-center md:py-20">
          <p className="text-sm leading-7 text-[#756860]">화력의 정보는 화장품 선택을 돕기 위한 참고 자료이며 의료적 진단이나 치료를 대신하지 않습니다.</p>
          <Link href="/products" className="ink-btn mt-7">정보부터 확인해 보기 <ArrowRight size={17} /></Link>
        </section>
      </div>
      <Footer />
    </>
  );
}
