import Link from "next/link";
import { connection } from "next/server";
import { Check, Plus, Sparkles } from "lucide-react";
import { GradeSeal } from "@/components/product-ui";
import { getAnalysis, getProducts } from "@/lib/api";
import { getOptionalSkinProfile } from "@/lib/auth-session";
import type { Analysis } from "@/lib/types";
import { CompareSelectors } from "./compare-selectors";

const defaultProfile = {
  skinType: "수부지",
  concerns: ["속건조", "민감", "피부 장벽"],
};

type CompareSearchParams = Promise<{ left?: string | string[]; right?: string | string[] }>;

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComparePage({ searchParams }: { searchParams: CompareSearchParams }) {
  await connection();
  const [params, products, savedProfile] = await Promise.all([searchParams, getProducts(), getOptionalSkinProfile()]);
  const analysisProfile = savedProfile?.skinType
    ? { skinType: savedProfile.skinType, concerns: savedProfile.concerns }
    : defaultProfile;

  if (products.length < 2) return <CompareEmpty />;

  const requestedLeft = first(params.left);
  const requestedRight = first(params.right);
  const left = products.find((product) => product.id === requestedLeft) ?? products[0];
  let right = products.find((product) => product.id === requestedRight) ?? products.find((product) => product.id !== left.id) ?? products[1];
  if (right.id === left.id) right = products.find((product) => product.id !== left.id) ?? products[1];

  const [leftAnalysis, rightAnalysis] = await Promise.all([
    getAnalysis({ productId: left.id, ...analysisProfile }),
    getAnalysis({ productId: right.id, ...analysisProfile }),
  ]);
  const rows = buildRows(leftAnalysis, rightAnalysis);
  const isTie = leftAnalysis.score === rightAnalysis.score;
  const leftWins = leftAnalysis.score >= rightAnalysis.score;
  const recommendation = leftWins ? left : right;
  const recommendationAnalysis = leftWins ? leftAnalysis : rightAnalysis;
  const otherAnalysis = leftWins ? rightAnalysis : leftAnalysis;
  const strengths = recommendationAnalysis.details
    .filter((detail) => {
      const other = otherAnalysis.details.find((item) => item.label === detail.label);
      return other && (detail.positive ? detail.value > other.value : detail.value < other.value);
    })
    .slice(0, 2)
    .map((detail) => detail.label);

  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#dfa6b51f] bg-[#fff1f4] py-10 text-center md:py-14"><div className="container-page"><p className="eyebrow mb-4">COMPARE POWER</p><h1 className="text-balance font-myeongjo text-[32px] leading-tight md:text-5xl">내 피부 앞에 나란히 놓고 보기</h1><p className="mt-4 text-sm leading-7 text-[#786c63]">{analysisProfile.skinType} · {analysisProfile.concerns.join(" · ")} 프로필로 두 제품을 같은 기준에서 분석해요.</p>{!savedProfile && <Link href="/profile" className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[#9b4a45]">내 피부 프로필 등록하기</Link>}</div></section>
    <section className="container-page py-8 md:py-16">
      <div className="glass-panel overflow-hidden rounded-[24px] sm:rounded-[30px]">
        <div className="grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="border-b border-r border-[#74513f18] bg-[#f0e5d7]" />
          <CompareSelectors products={products} leftId={left.id} rightId={right.id} />
          <CompareLabel label="나의 화력" />
          {[{ product: left, analysis: leftAnalysis }, { product: right, analysis: rightAnalysis }].map(({ product, analysis }, index) => <div key={product.id} className={`flex flex-col items-center justify-center gap-3 border-b border-[#74513f18] p-4 sm:flex-row ${index === 0 ? "border-r" : ""}`}><GradeSeal grade={analysis.grade} compact/><span className="text-center text-[11px] text-[#776a61]">{analysis.verdict}</span></div>)}
          <CompareLabel label="적합도" />
          {[leftAnalysis, rightAnalysis].map((analysis, index) => <div key={analysis.productId} className={`border-b border-[#74513f18] p-4 text-center sm:p-5 ${index === 0 ? "border-r bg-[#a54f4905]" : ""}`}><strong className="font-myeongjo text-3xl text-[#9b4a45] sm:text-4xl">{analysis.score}</strong><span className="text-[10px] text-[#897a70] sm:text-xs"> / 100</span></div>)}
          {rows.map((row) => <div key={row.label} className="contents"><CompareLabel label={row.label}/>{[{ value: row.left, other: row.right }, { value: row.right, other: row.left }].map(({ value, other }, index) => { const winner = row.positive ? value > other : value < other; return <div key={index} className={`relative border-b border-[#74513f18] p-4 text-center sm:p-6 ${index === 0 ? "border-r" : ""} ${winner ? "bg-[#8593790c]" : ""}`}><strong className="font-myeongjo text-2xl">{value}</strong>{winner && <Check size={15} className="absolute right-2 top-2 text-[#73806c]"/>}<div className="mx-auto mt-2 h-1.5 max-w-24 overflow-hidden rounded-full bg-[#d6c6b74d]"><div className={`${row.positive ? "bg-[#84917b]" : "bg-[#c98b75]"} h-full rounded-full`} style={{ width: `${value}%` }}/></div></div>; })}</div>)}
        </div>
      </div>

      <div className="mt-7 rounded-[24px] border border-[#a54f4922] bg-[#f1e2db73] p-5 md:flex md:items-center md:gap-6 md:rounded-[26px] md:p-8"><span className="seal h-12 w-12 shrink-0 font-myeongjo text-xl">解</span><div className="mt-4 min-w-0 md:mt-0"><div className="flex items-center gap-2 text-xs font-bold text-[#994944]"><Sparkles size={14}/> 화력의 결론</div><p className="mt-2 font-myeongjo text-lg leading-8">{isTie ? <><strong>두 제품의 종합 적합도가 같아요.</strong> 사용감과 주효능을 보고 선택해보세요.</> : <><strong>{recommendation.name}</strong>을 더 추천해요. {strengths.length > 0 ? `${strengths.join(" · ")} 항목에서 지금 피부에 더 유리해요.` : "종합 화력 점수가 더 높아요."}</>}</p></div><Link href={`/products/${recommendation.id}`} className="line-btn mt-5 w-full shrink-0 md:ml-auto md:mt-0 md:w-auto">상세 분석 보기</Link></div>
      <Link href="/products" className="line-btn mx-auto mt-8 w-full sm:w-auto"><Plus size={16}/> 다른 비교 제품 찾기</Link>
    </section>
  </div>;
}

function buildRows(left: Analysis, right: Analysis) {
  return left.details.flatMap((detail) => {
    const matching = right.details.find((item) => item.label === detail.label);
    return matching ? [{ label: detail.label, left: detail.value, right: matching.value, positive: detail.positive }] : [];
  });
}

function CompareEmpty() {
  return <div className="container-page grid min-h-[65vh] place-items-center py-16"><div className="paper-card max-w-lg rounded-[30px] px-8 py-14 text-center"><span className="text-4xl text-[#d08f7c]">❀</span><h1 className="mt-5 font-myeongjo text-2xl">비교할 제품이 부족해요.</h1><p className="mt-3 text-sm leading-7 text-[#796c63]">제품이 두 개 이상 등록되면 화력 차이를 나란히 보여드릴게요.</p><Link href="/products" className="ink-btn mt-7">제품 둘러보기</Link></div></div>;
}

function CompareLabel({ label }: { label: string }) {
  return <div className="flex items-center break-keep border-b border-r border-[#74513f18] bg-[#f5ecdf] p-2.5 text-[11px] font-semibold leading-5 text-[#665b54] sm:p-5 sm:text-sm">{label}</div>;
}
