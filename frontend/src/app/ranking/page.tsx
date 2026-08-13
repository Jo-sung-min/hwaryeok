import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Crown, Medal, Sparkles } from "lucide-react";
import { GradeSeal, ProductVisual } from "@/components/product-ui";
import { getRanking } from "@/lib/api";
import { getOptionalSkinProfile } from "@/lib/auth-session";

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
  const products = await getRanking(selectedSkinType, 6);

  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#74513f16] bg-[#302c28] py-16 text-[#fffaf2] md:py-20"><div className="container-page"><div className="grid items-end gap-8 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold tracking-[.18em] text-[#e2a995]">HWA:RYEOK RANKING</p><h1 className="mt-4 font-myeongjo text-4xl font-medium leading-tight md:text-5xl">판매량보다,<br />내 피부에 잘 맞는 순위</h1><p className="mt-5 max-w-lg text-sm leading-7 text-[#d4c9bd]">선택한 피부 타입에 맞춰 Spring Boot가 화력 점수를 다시 계산해 보여드려요.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.06] p-5 text-sm"><div className="flex items-center gap-2 text-[#efb6a3]"><Sparkles size={16}/><strong>현재 랭킹 기준</strong></div><p className="mt-2 text-xs leading-6 text-[#d4c9bd]">피부 타입 · 제품 효능<br />기본 화력 점수</p></div></div></div></section>

    <nav aria-label="피부 타입별 랭킹" className="sticky top-[74px] z-30 border-b border-[#74513f15] bg-[#fbf7ede8] backdrop-blur-xl"><div className="container-page scrollbar-hide flex gap-2 overflow-x-auto py-4">{tabs.map((item) => <Link key={item.value} href={item.value === "나의 피부" ? "/ranking" : `/ranking?tab=${encodeURIComponent(item.value)}`} aria-current={selectedTab.value === item.value ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2.5 text-xs transition ${selectedTab.value === item.value ? "bg-[#a54f49] text-white" : "border border-[#74513f1f] bg-[#fffaf3] text-[#70635b]"}`}>{item.label}</Link>)}</div></nav>

    <section className="container-page py-12 md:py-16">
      <div className="mb-9 flex items-end justify-between"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#a54f4910] px-3 py-1.5 text-xs font-semibold text-[#984944]"><Crown size={14}/> {selectedTab.label} 랭킹</span><h2 className="mt-4 font-myeongjo text-3xl font-semibold">화장품 TOP {products.length}</h2>{selectedTab.value === "나의 피부" && <p className="mt-3 text-xs text-[#7f7168]">{savedProfile ? `${selectedSkinType} 피부 타입 기준이에요. 고민 정보는 제품 상세 분석에 함께 반영해요.` : <>기본 수부지 기준이에요. <Link href="/profile" className="font-semibold text-[#9b4a45]">피부 프로필 등록하기</Link></>}</p>}</div><p className="hidden text-xs text-[#8b7c72] sm:block">피부 유형을 바꾸면 즉시 다시 계산해요</p></div>

      {products.length > 0 ? <>
        <div className="mb-8 grid gap-5 md:grid-cols-3">{products.slice(0, 3).map((product, index) => <Link href={`/products/${product.id}`} key={product.id} className={`paper-card relative overflow-hidden rounded-[26px] transition hover:-translate-y-1 ${index === 0 ? "md:-translate-y-3 md:hover:-translate-y-4" : ""}`}><div className="relative"><ProductVisual tone={product.tone} compact/><span className={`absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full font-myeongjo text-lg font-bold text-white ${index === 0 ? "bg-[#a54f49]" : "bg-[#6f665f]"}`}>{index + 1}</span>{index === 0 && <Medal className="absolute right-4 top-4 text-[#a54f49]"/>}</div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8c786c]">{product.brand}</p><h3 className="mt-1 font-myeongjo text-lg font-semibold">{product.name}</h3><div className="mt-5 flex items-center justify-between"><GradeSeal grade={product.grade} compact/><div className="text-right"><strong className="font-myeongjo text-3xl text-[#9b4a45]">{product.score}</strong><p className="text-[10px] text-[#897970]">{selectedSkinType} 적합도</p></div></div></div></Link>)}</div>
        <div className="grid gap-3">{products.slice(3).map((product, index) => <Link href={`/products/${product.id}`} key={product.id} className="flex items-center gap-4 rounded-2xl border border-[#74513f18] bg-[#fffaf292] p-4 transition hover:border-[#9d6b584f] sm:gap-6"><span className="w-8 text-center font-myeongjo text-xl text-[#8b7b70]">{index + 4}</span><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"><ProductVisual tone={product.tone} compact/></div><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-wider text-[#8a776b]">{product.brand}</p><h3 className="mt-1 truncate font-myeongjo font-semibold">{product.name}</h3><p className="mt-1 text-[11px] text-[#86776d]">{product.benefit}</p></div><GradeSeal grade={product.grade} compact/><strong className="hidden w-12 text-right font-myeongjo text-2xl text-[#9b4a45] sm:block">{product.score}</strong></Link>)}</div>
      </> : <div className="paper-card rounded-[26px] py-20 text-center"><span className="text-4xl text-[#d08f7c]">❀</span><h2 className="mt-5 font-myeongjo text-2xl">아직 랭킹 데이터가 없어요.</h2><p className="mt-2 text-sm text-[#81736a]">제품이 등록되면 피부 타입별 순위를 계산해드릴게요.</p></div>}

      <div className="mt-12 rounded-[26px] bg-[#eee2d2] p-6 md:flex md:items-center md:justify-between md:p-8"><div><p className="text-xs font-bold text-[#9b4a45]">다른 제품도 궁금한가요?</p><h3 className="mt-2 font-myeongjo text-2xl">토너 · 세럼 · 선케어 둘러보기</h3></div><Link href="/products" className="ink-btn mt-5 md:mt-0">카테고리 둘러보기 <ArrowRight size={16}/></Link></div>
    </section>
  </div>;
}
