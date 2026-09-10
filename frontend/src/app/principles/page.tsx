import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeInfo, CheckCircle2, Database, HeartHandshake, Megaphone, Scale, ShieldCheck, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "성분 랭킹의 기준",
  description: "성분과 제품 종류를 고르고, 성분 화력순과 사용자 리뷰순으로 화장품 랭킹을 읽는 방법을 알아보세요.",
};

const currentPromises = [
  {
    icon: ShieldCheck,
    title: "성분부터 고르는 랭킹",
    description: "나에게 맞는 성분을 선택한 뒤 앰플, 크림, 토너 등 원하는 제품 종류 안에서 비교합니다.",
  },
  {
    icon: Scale,
    title: "실제 경험을 담는 리뷰",
    description: "한 사용자가 제품마다 남긴 한 개의 리뷰로 점수를 모읍니다. 광고비나 관리자 점수는 리뷰 랭킹에 반영하지 않습니다.",
  },
  {
    icon: Database,
    title: "리뷰 수까지 함께 확인",
    description: "평균점수와 리뷰 수를 함께 표시합니다. 아직 리뷰가 없는 제품은 첫 리뷰를 기다리는 상태로 보여줍니다.",
  },
  {
    icon: HeartHandshake,
    title: "내 방식대로 시작",
    description: "홈에서 바로 제품을 둘러보거나 원하는 성분을 고를 수 있습니다. 피부 체크와 성분 사전도 함께 활용해보세요.",
  },
];

const scoreRules = [
  ["성분 선택", "제품에 연결된 성분 정보를 기준으로 히알루론산, 세라마이드 등 선택한 성분이 포함된 제품을 모읍니다."],
  ["제품 종류 선택", "앰플, 크림, 토너 등 같은 종류 안에서 비교할 수 있습니다. 선택한 성분과 종류에 따라 랭킹을 다시 집계합니다."],
  ["성분 선택 후 · 성분 화력순", "성분을 선택하면 연결된 성분의 등록 순서와 근거, 데이터 신뢰도를 반영한 분석 점수로 정렬합니다. 성분을 고르기 전에는 기본 진열순으로 보여주며, 이를 성분 랭킹이나 사용자 리뷰점수로 표시하지 않습니다."],
  ["다른 정렬 · 사용자 리뷰순", "리뷰순을 선택하면 실제 사용자 리뷰의 평균점수가 높은 순서로 봅니다. 평균이 같으면 리뷰 수를 비교하며, 리뷰가 없는 제품에는 리뷰 순위를 부여하지 않습니다."],
];

export default function PrinciplesPage() {
  return (
    <>
      <div className="min-h-screen pb-20">
        <section className="border-b border-[#dfa6b51f] bg-[#fff1f4] py-14 md:py-24">
          <div className="container-page text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/75 text-[#a65368] shadow-sm"><ShieldCheck size={26} /></span>
            <p className="eyebrow mt-6">HWA:RYEOK GUIDE</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-balance font-myeongjo text-[36px] font-semibold leading-tight sm:text-5xl md:text-6xl">나에게 맞는 성분,<br />제품 종류별로 보는 랭킹</h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-[#75675f]">히알루론산을 고르고, 앰플을 골라보세요. 같은 성분과 제품 종류 안에서 성분 화력과 사용자들의 실제 경험을 함께 비교할 수 있어요.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/ranking" className="ink-btn">성분 랭킹 보기 <ArrowRight size={17} /></Link><Link href="/ingredients" className="line-btn">성분 사전 보기</Link></div>
          </div>
        </section>

        <section className="container-page py-14 md:py-20">
          <div className="rounded-[28px] border border-[#e7c8d0] bg-[#fff6f8] p-6 sm:p-8 md:flex md:items-center md:justify-between md:gap-10">
            <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#c94f70] text-white"><Megaphone size={19} /></span><div><div className="flex items-center gap-2"><span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#b54867]">광고</span><h2 className="font-myeongjo text-2xl font-semibold">광고는 별도의 화력 추천 탭에서</h2></div><p className="mt-3 max-w-2xl text-sm leading-7 text-[#75636a]">광고 제품은 관리자 추천점수로 광고 탭 안에서만 정렬합니다. 광고 계약이나 관리자 점수는 일반 사용자 리뷰점수와 성분별 제품 랭킹에 반영하지 않습니다.</p></div></div>
            <Link href="/promotions" className="line-btn mt-6 w-full shrink-0 md:mt-0 md:w-auto">광고 추천 보기 <ArrowRight size={16} /></Link>
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
            <div><p className="eyebrow mb-4">UNDERSTAND THE RANKING</p><h2 className="section-title font-myeongjo">성분에서 제품까지,<br />랭킹을 읽는 방법</h2><p className="mt-5 text-sm leading-7 text-[#756860]">성분과 제품 종류로 비교할 대상을 고르세요. 성분 화력순으로 먼저 보여드리며, 사용자 리뷰순으로 바꿔볼 수 있습니다.</p></div>
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
                <li>• 선택한 성분과 제품 종류를 함께 표시합니다.</li>
                <li>• 데이터가 부족하면 그 사실을 결과보다 먼저 알립니다.</li>
                <li>• 제품의 장점과 주의점을 한 화면에서 함께 보여줍니다.</li>
                <li>• 사용자 리뷰와 성분 기반 분석을 구분합니다.</li>
                <li>• 신생 브랜드도 선택한 정렬 기준으로 같은 조건에서 비교합니다.</li>
              </ul>
            </div>
            <div className="rounded-[28px] border border-[#c78e7635] bg-[#f7e9e4] p-6 sm:p-8">
              <div className="flex items-center gap-3 text-[#a36c58]"><TriangleAlert size={21} /><h2 className="font-myeongjo text-2xl font-semibold">차분히 살펴볼 부분</h2></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#6f5f58]">
                <li>• 리뷰가 적을 때는 정보 상태를 먼저 확인해 주세요.</li>
                <li>• 피부 궁합은 컨디션과 사용 환경에 따라 달라질 수 있어요.</li>
                <li>• 적합도는 의료적 진단이나 효과 보장을 뜻하지 않아요.</li>
                <li>• 성분과 사용감은 함께 살펴볼 때 더 선명해집니다.</li>
                <li>• 광고비, 판매량, 브랜드 인지도는 리뷰 점수에 넣지 않습니다.</li>
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

        <section id="skin-guide" className="container-page scroll-mt-24 py-10 md:py-14">
          <h2 className="text-2xl font-semibold">피부 리포트와 맞춤 추천 기준</h2>
          <div className="mt-6 space-y-6 text-sm leading-7 text-[#756860]">
            <div><h3 className="font-semibold text-[#4e3e4b]">피부 유형과 네 가지 코드</h3><p>최근의 자기 보고 답변을 요약한 참고 리포트입니다. 피부 코드와 유형은 화력의 표현이며 MBTI 검사나 의학적으로 검증된 분류가 아닙니다. 유형의 희소성은 피부의 좋고 나쁨을 뜻하지 않고 실제 수분·유분 측정이나 의료 진단을 대신하지 않습니다. 피부가 불편하거나 증상이 지속되면 전문가와 상담해 주세요.</p></div>
            <div><h3 className="font-semibold text-[#4e3e4b]">추천 성분과 제형</h3><p>피부 타입·속당김·세안 후 당김·민감 반응·트러블·선호 제형을 바탕으로 일반적인 화장품 선택 가이드를 제공합니다. 개별 성분의 효과가 특정 완제품의 효과나 개인의 적합성을 보장하지는 않습니다. 제품의 전성분·제형·사용 경험을 함께 확인하고 새 제품은 좁은 부위에서 먼저 살펴보세요. 불편했던 성분 경험은 알레르기 확정 결과가 아닙니다.</p><p className="mt-2">일반적인 보습 성분·제형 선택과 지성 피부의 제품 표시 안내는 <a className="underline" href="https://www.aad.org/public/everyday-care/skin-care-basics/dry/pick-moisturizer" target="_blank" rel="noreferrer">미국피부과학회 보습제 선택 안내</a> 및 <a className="underline" href="https://www.aad.org/public/everyday-care/skin-care-basics/dry/oily-skin" target="_blank" rel="noreferrer">지성 피부 관리 안내</a>를 참고했습니다. 이를 화력의 답변 항목에 연결한 규칙은 서비스의 추천 기준입니다.</p></div>
            <div><h3 className="font-semibold text-[#4e3e4b]">맞춤 화력 점수</h3><p>연결된 성분 정보와 저장한 피부 설정에 기반한 비교 점수로, 실제 사용자 리뷰점수와 별개입니다. 피부의 건강 상태를 측정하는 점수가 아니며 실제 사용감이나 피부 반응을 보장하지 않습니다. 자료의 양과 정확도에 따라 결과가 달라질 수 있습니다.</p></div>
            <div><h3 className="font-semibold text-[#4e3e4b]">같은 피부 유형의 회원 비율</h3><p>피부 프로필을 직접 저장한 활성 일반 회원의 최신 프로필 1개씩을 집계합니다. 비회원 체크·기본값 프로필·관리자·비활성 계정은 제외하며 최소 30명 이상일 때 실제 비율을 표시합니다. 기본 피부 타입의 비율이지 4자리 코드 비율이나 전체 인구의 비율은 아닙니다. 집계 자료가 없거나 조회에 실패하면 임의 수치를 표시하지 않습니다.</p></div>
          </div>
        </section>

        <section className="container-page py-14 text-center md:py-20">
          <p className="text-sm leading-7 text-[#756860]">화력의 정보는 화장품 선택을 돕기 위한 참고 자료이며 의료적 진단이나 치료를 대신하지 않습니다.</p>
          <Link href="/ranking" className="ink-btn mt-7">나에게 맞는 성분으로 랭킹 보기 <ArrowRight size={17} /></Link>
        </section>
      </div>
    </>
  );
}
