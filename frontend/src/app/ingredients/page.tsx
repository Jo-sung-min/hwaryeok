"use client";

import { useState } from "react";
import { BookOpen, Check, Search, Sparkles, TriangleAlert } from "lucide-react";
import { ingredients } from "@/lib/data";

const more = [
  { name: "나이아신아마이드", role: "피부 톤 · 장벽", status: "good", description: "피부 톤을 맑게 하고 장벽 기능을 돕는 다재다능한 성분이에요." },
  { name: "병풀 추출물", role: "진정", status: "good", description: "열감과 붉은기가 느껴질 때 피부를 편안하게 다독여요." },
  { name: "에탄올", role: "사용감 · 용매", status: "caution", description: "산뜻한 사용감을 주지만 민감하거나 건조한 피부에는 자극이 될 수 있어요." },
];

export default function IngredientsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const list = [...ingredients, ...more].filter(item => item.name.includes(query) && (filter === "전체" || (filter === "내 피부에 좋음" ? item.status === "good" : item.status === "caution")));
  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#74513f16] bg-[#f2e8d979] py-16 text-center"><div className="container-page"><BookOpen className="mx-auto mb-5 text-[#a45a50]" size={30} strokeWidth={1.5}/><p className="eyebrow mb-4">INGREDIENT DICTIONARY</p><h1 className="font-myeongjo text-4xl md:text-5xl">어려운 성분, 피부의 언어로</h1><p className="mt-4 text-sm leading-7 text-[#786c63]">전문 용어 대신 내 피부에 어떤 역할을 하는지 쉽게 알려드려요.</p><div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-full border border-[#74513f24] bg-[#fffdf7] px-5"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="궁금한 성분을 검색하세요" className="h-14 flex-1 bg-transparent text-sm outline-none"/></div></div></section>
    <section className="container-page py-10"><div className="mb-7 flex flex-wrap gap-2">{["전체","내 피부에 좋음","주의해서 보기"].map(item=><button key={item} onClick={()=>setFilter(item)} className={`rounded-full px-4 py-2.5 text-xs ${filter===item?"bg-[#37312c] text-white":"border border-[#74513f20] bg-[#fffaf3]"}`}>{item}</button>)}</div><div className="mb-5 text-sm text-[#7a6c63]"><strong className="text-[#a54f49]">{list.length}</strong>개의 성분</div><div className="grid gap-4 md:grid-cols-2">{list.map(item=><article key={item.name} className="paper-card rounded-[24px] p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-myeongjo text-xl font-semibold">{item.name}</h2>{item.status === "good" ? <Check size={16} className="text-[#72806b]"/>:<TriangleAlert size={16} className="text-[#b47460]"/>}</div><p className="mt-2 text-xs font-semibold text-[#9a6556]">{item.role}</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] ${item.status === "good"?"bg-[#84917a1a] text-[#65715f]":"bg-[#d3957d1c] text-[#a1614c]"}`}>{item.status === "good"?"내 피부와 잘 맞음":"주의해서 보기"}</span></div><p className="mt-5 text-sm leading-7 text-[#71655d]">{item.description}</p><button className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#974943]"><Sparkles size={13}/> 피부 타입별 특징 보기</button></article>)}</div></section>
  </div>;
}
