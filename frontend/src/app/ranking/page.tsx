"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Crown, Medal, Sparkles } from "lucide-react";
import { GradeSeal, ProductVisual } from "@/components/product-ui";
import { products } from "@/lib/data";

const tabs = ["나의 피부", "건성", "지성", "수부지", "민감", "모공"];

export default function RankingPage() {
  const [tab, setTab] = useState("나의 피부");
  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#74513f16] bg-[#302c28] py-16 text-[#fffaf2] md:py-20"><div className="container-page"><div className="grid items-end gap-8 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold tracking-[.18em] text-[#e2a995]">HWA:RYEOK RANKING</p><h1 className="mt-4 font-myeongjo text-4xl font-medium leading-tight md:text-5xl">판매량보다,<br />내 피부에 잘 맞는 순위</h1><p className="mt-5 max-w-lg text-sm leading-7 text-[#d4c9bd]">수부지 · 민감 · 속건조를 가진 사용자에게 가장 높은 화력을 보인 제품을 모았어요.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.06] p-5 text-sm"><div className="flex items-center gap-2 text-[#efb6a3]"><Sparkles size={16}/><strong>나의 랭킹 기준</strong></div><p className="mt-2 text-xs leading-6 text-[#d4c9bd]">피부 타입 40% · 고민 35%<br/>성분 궁합 25%</p></div></div></div></section>
    <div className="sticky top-[74px] z-30 border-b border-[#74513f15] bg-[#fbf7ede8] backdrop-blur-xl"><div className="container-page scrollbar-hide flex gap-2 overflow-x-auto py-4">{tabs.map(item=><button key={item} onClick={()=>setTab(item)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs transition ${tab===item?"bg-[#a54f49] text-white":"border border-[#74513f1f] bg-[#fffaf3] text-[#70635b]"}`}>{item}</button>)}</div></div>
    <section className="container-page py-12 md:py-16">
      <div className="mb-9 flex items-end justify-between"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#a54f4910] px-3 py-1.5 text-xs font-semibold text-[#984944]"><Crown size={14}/> {tab} 랭킹</span><h2 className="mt-4 font-myeongjo text-3xl font-semibold">수분 크림 TOP 6</h2></div><p className="hidden text-xs text-[#8b7c72] sm:block">2026.08.12 업데이트</p></div>
      <div className="mb-8 grid gap-5 md:grid-cols-3">{products.slice(0,3).map((product,index)=><Link href={`/products/${product.id}`} key={product.id} className={`paper-card relative overflow-hidden rounded-[26px] transition hover:-translate-y-1 ${index===0?"md:-translate-y-3 md:hover:-translate-y-4":""}`}><div className="relative"><ProductVisual tone={product.tone} compact/><span className={`absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full font-myeongjo text-lg font-bold text-white ${index===0?"bg-[#a54f49]":"bg-[#6f665f]"}`}>{index+1}</span>{index===0&&<Medal className="absolute right-4 top-4 text-[#a54f49]"/>}</div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8c786c]">{product.brand}</p><h3 className="mt-1 font-myeongjo text-lg font-semibold">{product.name}</h3><div className="mt-5 flex items-center justify-between"><GradeSeal grade={product.grade} compact/><div className="text-right"><strong className="font-myeongjo text-3xl text-[#9b4a45]">{product.score}</strong><p className="text-[10px] text-[#897970]">나의 적합도</p></div></div></div></Link>)}</div>
      <div className="grid gap-3">{products.slice(3).map((product,index)=><Link href={`/products/${product.id}`} key={product.id} className="flex items-center gap-4 rounded-2xl border border-[#74513f18] bg-[#fffaf292] p-4 transition hover:border-[#9d6b584f] sm:gap-6"><span className="w-8 text-center font-myeongjo text-xl text-[#8b7b70]">{index+4}</span><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"><ProductVisual tone={product.tone} compact/></div><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-wider text-[#8a776b]">{product.brand}</p><h3 className="mt-1 truncate font-myeongjo font-semibold">{product.name}</h3><p className="mt-1 text-[11px] text-[#86776d]">{product.benefit}</p></div><GradeSeal grade={product.grade} compact/><strong className="hidden w-12 text-right font-myeongjo text-2xl text-[#9b4a45] sm:block">{product.score}</strong></Link>)}</div>
      <div className="mt-12 rounded-[26px] bg-[#eee2d2] p-6 md:flex md:items-center md:justify-between md:p-8"><div><p className="text-xs font-bold text-[#9b4a45]">다른 카테고리도 궁금한가요?</p><h3 className="mt-2 font-myeongjo text-2xl">토너 · 세럼 · 선케어 랭킹 보기</h3></div><Link href="/products" className="ink-btn mt-5 md:mt-0">카테고리 둘러보기 <ArrowRight size={16}/></Link></div>
    </section>
  </div>;
}
