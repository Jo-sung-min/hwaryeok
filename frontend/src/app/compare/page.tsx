import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Check, Plus, Sparkles } from "lucide-react";
import { GradeSeal } from "@/components/product-ui";
import { getAnalysis, getProducts } from "@/lib/api";
import { getComparisonViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import type { Analysis, Product } from "@/lib/types";
import { CompareSelectors } from "./compare-selectors";
import { ComparisonToolbar } from "./comparison-toolbar";

export const metadata: Metadata = {
  title: "제품 비교",
  description: "화장품 2~3개를 같은 피부 조건과 세부 화력 기준으로 나란히 비교하세요.",
  alternates: { canonical: "/compare" },
};

const defaultProfile = {
  skinType: "수부지",
  concerns: ["속건조·당김", "붉은기·민감", "장벽·각질"],
};

type CompareSearchParams = Promise<{
  left?: string | string[];
  right?: string | string[];
  third?: string | string[];
}>;

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComparePage({ searchParams }: { searchParams: CompareSearchParams }) {
  await connection();
  const [params, products, savedProfile, comparisonState] = await Promise.all([
    searchParams,
    getProducts(),
    getOptionalSkinProfile(),
    getComparisonViewState(),
  ]);
  const analysisProfile = savedProfile?.skinType
    ? {
        skinType: savedProfile.skinType,
        concerns: savedProfile.concerns,
        hydrationLevel: savedProfile.hydrationLevel,
        oilinessLevel: savedProfile.oilinessLevel,
        sensitivityLevel: savedProfile.sensitivityLevel,
        breakoutFrequency: savedProfile.breakoutFrequency,
        cleansingTightness: savedProfile.cleansingTightness,
        rednessFrequency: savedProfile.rednessFrequency,
        poreLevel: savedProfile.poreLevel,
        texturePreference: savedProfile.texturePreference,
        routineComplexity: savedProfile.routineComplexity,
        sunscreenUsage: savedProfile.sunscreenUsage,
        reactionTriggers: savedProfile.reactionTriggers,
        breakoutZones: savedProfile.breakoutZones,
        environments: savedProfile.environments,
        routineContexts: savedProfile.routineContexts,
      }
    : defaultProfile;

  if (products.length < 2) return <CompareEmpty />;

  const savedIds = comparisonState.comparison.content.map((item) => item.product.id);
  const selectedProducts = selectProducts(products, savedIds, {
    left: first(params.left),
    right: first(params.right),
    third: first(params.third),
  });
  const selectedIds = selectedProducts.map((product) => product.id);
  const analyses = await Promise.all(
    selectedProducts.map((product) => getAnalysis({ productId: product.id, ...analysisProfile })),
  );
  const rows = buildRows(analyses);
  const topScore = Math.max(...analyses.map((analysis) => analysis.score));
  const topAnalyses = analyses.filter((analysis) => analysis.score === topScore);
  const recommendationAnalysis = topAnalyses[0];
  const recommendation = selectedProducts.find((product) => product.id === recommendationAnalysis.productId) ?? selectedProducts[0];
  const strengths = recommendationAnalysis.details
    .filter((detail) => {
      const otherValues = analyses
        .filter((analysis) => analysis.productId !== recommendationAnalysis.productId)
        .map((analysis) => analysis.details.find((item) => item.label === detail.label)?.value)
        .filter((value): value is number => value !== undefined);
      if (otherValues.length === 0) return false;
      return detail.positive
        ? detail.value > Math.max(...otherValues)
        : detail.value < Math.min(...otherValues);
    })
    .slice(0, 2)
    .map((detail) => detail.label);
  const gridStyle = {
    gridTemplateColumns: `minmax(60px, 170px) repeat(${selectedProducts.length}, minmax(140px, 1fr))`,
    minWidth: selectedProducts.length === 3 ? "480px" : "340px",
  };

  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#dfa6b51f] bg-[#fff1f4] py-10 text-center md:py-14"><div className="container-page"><p className="eyebrow mb-4">SAME SKIN, SAME STANDARD</p><h1 className="text-balance font-myeongjo text-[32px] leading-tight md:text-5xl">같은 피부 조건에서 나란히 보기</h1><p className="mt-4 text-sm leading-7 text-[#786c63]">{analysisProfile.skinType} · {analysisProfile.concerns.join(" · ")} {savedProfile ? "내 프로필" : "예시 프로필"}로 {selectedProducts.length}개 제품을 같은 성분 기준에서 분석해요.</p><p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold text-[#98495d]"><Sparkles size={13} /> 브랜드와 판매량을 제외한 제품별 궁합</p>{!savedProfile && <div><Link href="/skin-check" className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[#9b4a45]">1분 피부 체크 후 다시 비교하기</Link></div>}</div></section>
    <section className="container-page py-8 md:py-16">
      <ComparisonToolbar
        products={products}
        selectedIds={selectedIds}
        savedIds={savedIds}
        isAuthenticated={comparisonState.isAuthenticated}
      />

      <div className="glass-panel overflow-x-auto rounded-[24px] sm:rounded-[30px]">
        <div className="grid" style={gridStyle}>
          <div className="border-b border-r border-[#74513f18] bg-[#f0e5d7]" />
          <CompareSelectors products={products} selectedIds={selectedIds} />
          <CompareLabel label="나의 화력" />
          {analyses.map((analysis, index) => <div key={analysis.productId} className={`flex flex-col items-center justify-center gap-3 border-b border-[#74513f18] p-4 sm:flex-row ${index < analyses.length - 1 ? "border-r" : ""}`}><GradeSeal grade={analysis.grade} compact /><span className="text-center text-[11px] text-[#776a61]">{analysis.verdict}</span></div>)}
          <CompareLabel label="적합도" />
          {analyses.map((analysis, index) => <div key={analysis.productId} className={`border-b border-[#74513f18] p-4 text-center sm:p-5 ${index < analyses.length - 1 ? "border-r" : ""} ${analysis.score === topScore && topAnalyses.length === 1 ? "bg-[#a54f4905]" : ""}`}><strong className="font-myeongjo text-3xl text-[#9b4a45] sm:text-4xl">{analysis.score}</strong><span className="text-[10px] text-[#897a70] sm:text-xs"> / 100</span></div>)}
          {rows.map((row) => <div key={row.label} className="contents"><CompareLabel label={row.label} />{row.values.map((value, index) => { const winnerValue = row.positive ? Math.max(...row.values) : Math.min(...row.values); const winner = value === winnerValue && row.values.some((other) => other !== value); return <div key={`${row.label}-${index}`} className={`relative border-b border-[#74513f18] p-4 text-center sm:p-6 ${index < row.values.length - 1 ? "border-r" : ""} ${winner ? "bg-[#8593790c]" : ""}`}><strong className="font-myeongjo text-2xl">{value}</strong>{winner && <Check size={15} className="absolute right-2 top-2 text-[#73806c]" />}<div className="mx-auto mt-2 h-1.5 max-w-24 overflow-hidden rounded-full bg-[#d6c6b74d]"><div className={`${row.positive ? "bg-[#84917b]" : "bg-[#c98b75]"} h-full rounded-full`} style={{ width: `${value}%` }} /></div></div>; })}</div>)}
        </div>
      </div>

      <div className="mt-7 rounded-[24px] border border-[#a54f4922] bg-[#f1e2db73] p-5 md:flex md:items-center md:gap-6 md:rounded-[26px] md:p-8"><span className="seal h-12 w-12 shrink-0 font-myeongjo text-xl">解</span><div className="mt-4 min-w-0 md:mt-0"><div className="flex items-center gap-2 text-xs font-bold text-[#994944]"><Sparkles size={14} /> 조건별 해석</div><p className="mt-2 font-myeongjo text-lg leading-8">{topAnalyses.length > 1 ? <><strong>{topAnalyses.length}개 제품의 종합 적합도가 같아요.</strong> 사용감과 지금 중요한 세부 항목을 함께 확인해 보세요.</> : <><strong>{recommendation.name}</strong>의 현재 조건 적합도가 가장 높아요. {strengths.length > 0 ? `${strengths.join(" · ")} 항목에서 더 유리하게 계산됐어요.` : "세부 근거를 확인한 뒤 선택해 보세요."}</>}</p><p className="mt-2 text-xs leading-5 text-[#82736a]">지금 고른 피부 조건을 바탕으로 각 제품의 차이를 풀어낸 비교예요.</p></div><Link href={`/products/${recommendation.id}`} className="line-btn mt-5 w-full shrink-0 md:ml-auto md:mt-0 md:w-auto">제품 리포트 보기</Link></div>
      <Link href="/products" className="line-btn mx-auto mt-8 w-full sm:w-auto"><Plus size={16} /> 다른 비교 제품 찾기</Link>
    </section>
  </div>;
}

function selectProducts(
  products: Product[],
  savedIds: string[],
  requested: { left?: string; right?: string; third?: string },
) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const requestedIds = [requested.left, requested.right, requested.third]
    .filter((id): id is string => Boolean(id && byId.has(id)));
  const hasRequested = Boolean(requested.left || requested.right || requested.third);
  const targetCount = hasRequested ? (requested.third ? 3 : 2) : Math.min(3, Math.max(2, savedIds.length));
  const ids = [...new Set([...requestedIds, ...savedIds, ...products.map((product) => product.id)])]
    .filter((id) => byId.has(id))
    .slice(0, targetCount);
  return ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
}

function buildRows(analyses: Analysis[]) {
  const [firstAnalysis, ...rest] = analyses;
  return firstAnalysis.details.flatMap((detail) => {
    const matching = rest.map((analysis) => analysis.details.find((item) => item.label === detail.label));
    return matching.every(Boolean)
      ? [{ label: detail.label, values: [detail.value, ...matching.map((item) => item!.value)], positive: detail.positive }]
      : [];
  });
}

function CompareEmpty() {
  return <div className="container-page grid min-h-[65vh] place-items-center py-16"><div className="paper-card max-w-lg rounded-[30px] px-8 py-14 text-center"><span className="text-4xl text-[#d08f7c]">❀</span><h1 className="mt-5 font-myeongjo text-2xl">비교할 제품이 부족해요.</h1><p className="mt-3 text-sm leading-7 text-[#796c63]">제품이 두 개 이상 등록되면 화력 차이를 나란히 보여드릴게요.</p><Link href="/products" className="ink-btn mt-7">제품 둘러보기</Link></div></div>;
}

function CompareLabel({ label }: { label: string }) {
  return <div className="flex items-center break-keep border-b border-r border-[#74513f18] bg-[#f5ecdf] p-2.5 text-[11px] font-semibold leading-5 text-[#665b54] sm:p-5 sm:text-sm">{label}</div>;
}
