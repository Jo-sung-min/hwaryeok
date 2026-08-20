import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ArrowRight, Crown, Medal, Sparkles } from "lucide-react";
import { GradeSeal, ProductVisual } from "@/components/product-ui";
import { getRanking } from "@/lib/api";
import { getOptionalSkinProfile } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "피부별 화력 랭킹",
  description: "피부 타입과 고민을 바탕으로 계산한 나만의 화장품 적합도 순위를 확인하세요.",
  alternates: { canonical: "/ranking" },
};

const tabs = [
  { label: "나의 피부", value: "나의 피부", skinType: "수부지" },
  { label: "건성", value: "건성", skinType: "건성" },
  { label: "지성", value: "지성", skinType: "지성" },
  { label: "수부지", value: "수부지", skinType: "수부지" },
  { label: "민감", value: "민감", skinType: "민감" },
  { label: "복합성", value: "복합성", skinType: "복합성" },
] as const;

type RankingSearchParams = Promise<{ tab?: string | string[] }>;

export default async function RankingPage({ searchParams }: { searchParams: RankingSearchParams }) {
  await connection();
  const [params, savedProfile] = await Promise.all([searchParams, getOptionalSkinProfile()]);
  const requestedTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const selectedTab = tabs.find((tab) => tab.value === requestedTab) ?? tabs[0];
  const selectedSkinType = selectedTab.value === "나의 피부" && savedProfile?.skinType
    ? savedProfile.skinType
    : selectedTab.skinType;
  const rankingProfile = selectedTab.value === "나의 피부" && savedProfile?.skinType ? savedProfile : selectedSkinType;
  const products = await getRanking(rankingProfile, 6);

  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#dfa6b51f] bg-[#fff0f3] py-10 text-[#382b30] md:py-20"><div className="container-page"><div className="grid items-end gap-7 md:grid-cols-[1fr_auto] md:gap-8"><div><p className="text-xs font-bold tracking-[.18em] text-[#ad566d]">INGREDIENT-FIRST RANKING</p><h1 className="mt-4 text-balance font-myeongjo text-[32px] font-medium leading-tight sm:text-4xl md:text-5xl">이름보다 성분을 먼저 본<br />내 피부 맞춤 순위</h1><p className="mt-5 max-w-lg text-sm leading-7 text-[#7d6870]">신생 브랜드도 성분 근거가 좋고 내 피부 고민과 맞으면 상단에 보여요. 광고비와 판매량은 점수에 넣지 않아요.</p></div><div className="rounded-2xl border border-white/90 bg-white/72 p-4 text-sm shadow-[0_14px_36px_rgba(164,82,104,.09)] backdrop-blur-xl sm:p-5"><div className="flex items-center gap-2 text-[#a54f63]"><Sparkles size={16}/><strong>현재 계산 기준</strong></div><p className="mt-2 text-xs leading-6 text-[#7d6870]">성분 구성 55% · 피부 적합 35%<br />데이터 신뢰 10%</p></div></div></div></section>

    <nav aria-label="피부 타입별 랭킹" className="ranking-tabs sticky top-[72px] z-30 max-w-full md:top-[84px]"><div className="container-page"><div className="ranking-tabs-scroll scrollbar-hide flex max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain py-4"><span className="w-px shrink-0" aria-hidden="true" />{tabs.map((item) => <Link key={item.value} href={item.value === "나의 피부" ? "/ranking" : `/ranking?tab=${encodeURIComponent(item.value)}`} aria-current={selectedTab.value === item.value ? "page" : undefined} className="ranking-tab glass-choice shrink-0 snap-start rounded-full px-4 text-xs font-medium">{item.label}</Link>)}<span className="w-px shrink-0" aria-hidden="true" /></div></div></nav>

    <section className="container-page py-10 md:py-16">
      <div className="mb-9 flex items-end justify-between"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#a54f4910] px-3 py-1.5 text-xs font-semibold text-[#984944]"><Crown size={14}/> {selectedTab.label} 기준</span><h2 className="mt-4 font-myeongjo text-3xl font-semibold">맞춤 제품 TOP {products.length}</h2>{selectedTab.value === "나의 피부" && <p className="mt-3 text-xs text-[#7f7168]">{savedProfile ? `${selectedSkinType} 피부와 저장한 고민·생활 신호를 모두 반영했어요.` : <>현재는 기본 수부지 기준이에요. <Link href="/skin-check" className="font-semibold text-[#9b4a45]">1분 피부 체크하기</Link></>}</p>}</div><p className="hidden text-xs text-[#8b7c72] sm:block">같은 점수면 성분 근거와 데이터 신뢰가 높은 제품을 먼저 보여요</p></div>

      {products.length > 0 ? <>
        <div className="scrollbar-hide -mx-3 mb-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-3 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">{products.slice(0, 3).map((product, index) => <Link href={`/products/${product.id}`} key={product.id} className={`paper-card relative min-w-[82vw] max-w-[320px] snap-center overflow-hidden rounded-[26px] transition hover:-translate-y-1 md:min-w-0 md:max-w-none ${index === 0 ? "md:-translate-y-3 md:hover:-translate-y-4" : ""}`}><div className="relative"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} compact/><span className={`absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full font-myeongjo text-lg font-bold text-white ${index === 0 ? "bg-[#a54f49]" : "bg-[#6f665f]"}`}>{index + 1}</span>{index === 0 && <Medal className="absolute right-4 top-4 text-[#a54f49]"/>}</div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8c786c]">{product.brand}</p><h3 className="mt-1 line-clamp-2 font-myeongjo text-lg font-semibold">{product.name}</h3><p className="mt-3 line-clamp-2 min-h-10 text-[11px] leading-5 text-[#76675f]">{product.matchReasons?.[0] ?? "연결된 성분 근거를 중심으로 계산했어요."}</p><div className="mt-4 flex items-center justify-between"><GradeSeal grade={product.grade} compact/><div className="text-right"><strong className="font-myeongjo text-3xl text-[#9b4a45]">{product.score}</strong><p className="text-[10px] text-[#897970]">{selectedSkinType} 맞춤 점수</p></div></div><p className="mt-3 text-[9px] font-semibold text-[#74806e]">성분 근거 {product.confidenceLevel === "HIGH" ? "높음" : product.confidenceLevel === "MEDIUM" ? "보통" : "자료 보강 중"}</p></div></Link>)}</div>
        <div className="grid min-w-0 gap-3">{products.slice(3).map((product, index) => <Link href={`/products/${product.id}`} key={product.id} className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[#74513f18] bg-[#fffaf292] p-3 transition hover:border-[#9d6b584f] sm:gap-5 sm:p-4"><span className="w-6 shrink-0 text-center font-myeongjo text-lg text-[#8b7b70] sm:w-8 sm:text-xl">{index + 4}</span><div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} compact/></div><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-wider text-[#8a776b]">{product.brand}</p><h3 className="mt-1 truncate font-myeongjo text-sm font-semibold sm:text-base">{product.name}</h3><p className="mt-1 truncate text-[10px] text-[#86776d] sm:text-[11px]">{product.matchReasons?.[0] ?? product.benefit}</p></div><div className="shrink-0 text-right sm:hidden"><strong className="font-myeongjo text-xl text-[#9b4a45]">{product.score}</strong><p className="text-[8px] text-[#8c7e73]">/100</p></div><div className="hidden sm:block"><GradeSeal grade={product.grade} compact/></div><strong className="hidden w-12 text-right font-myeongjo text-2xl text-[#9b4a45] sm:block">{product.score}</strong></Link>)}</div>
      </> : <div className="paper-card rounded-[26px] py-20 text-center"><span className="text-4xl text-[#d08f7c]">❀</span><h2 className="mt-5 font-myeongjo text-2xl">아직 랭킹 데이터가 없어요.</h2><p className="mt-2 text-sm text-[#81736a]">제품이 등록되면 피부 타입별 순위를 계산해드릴게요.</p></div>}

      <div className="mt-10 rounded-[24px] border border-[#e3b1bd33] bg-[#fff0f3] p-5 sm:mt-12 sm:rounded-[26px] sm:p-6 md:flex md:items-center md:justify-between md:p-8"><div><p className="text-xs font-bold text-[#9b4a5f]">다른 제품도 궁금한가요?</p><h3 className="mt-2 font-myeongjo text-2xl">토너 · 세럼 · 선케어 둘러보기</h3></div><Link href="/products" className="ink-btn mt-5 w-full md:mt-0 md:w-auto">카테고리 둘러보기 <ArrowRight size={16}/></Link></div>
    </section>
  </div>;
}
