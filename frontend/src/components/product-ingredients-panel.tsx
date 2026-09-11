"use client";

import Link from "next/link";
import { Check, ChevronRight, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { ProductIngredient, ProductIngredients } from "@/lib/types";

const filters = ["전체", "내 피부에 좋음", "주의", "보습", "진정", "장벽"] as const;

export function ProductIngredientsPanel({ data }: { data: ProductIngredients }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("전체");
  const items = data.ingredients.filter((ingredient) => matches(ingredient, filter));

  return <section id="ingredients" className="container-page scroll-mt-24 py-8">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0"><p className="text-[10px] font-bold tracking-[.14em] text-[#ad4c6e]">INGREDIENTS</p><h2 className="mt-1 font-myeongjo text-2xl font-semibold">핵심 성분</h2><p className="mt-1 text-xs leading-5 text-[#817780]">연결된 성분과 내 피부가 확인할 점을 모았어요.</p></div>
      <Link href="/ingredients" className="inline-flex min-h-10 shrink-0 items-center gap-0.5 text-xs font-semibold text-[#a33f62]">성분 사전 <ChevronRight size={14}/></Link>
    </div>

    {data.source && <a href={data.source.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mb-4 flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[#e8e5e9] px-3 text-[10px] font-medium text-[#746b73]"><span className="flex min-w-0 items-center gap-1.5"><ShieldCheck size={13} className="shrink-0 text-[#9b4a63]" /><span className="truncate">브랜드 공식 전성분 {data.source.ingredientCount}개 · {data.source.checkedAt.replaceAll("-", ".")} 확인</span></span><ExternalLink size={11} className="shrink-0" /></a>}

    <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 border-y border-[#ece9ed] py-3 text-[10px] text-[#7f7680]">
      <strong className="text-[#4b454c]">전체 {data.totalCount}</strong>
      <span className="text-[#63715e]">잘 맞음 {data.goodCount}</span>
      <span className="text-[#a35d51]">주의 {data.cautionCount}</span>
      <span>일반 {data.neutralCount}</span>
    </div>

    <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="제품 성분 필터">
      {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className="glass-choice shrink-0 rounded-full px-3 py-2 text-[11px]">{item}</button>)}
    </div>

    {items.length > 0 ? <div className="grid gap-2">{items.map((ingredient) => <IngredientRow key={ingredient.id} ingredient={ingredient}/>)}</div> : <div className="rounded-2xl border border-dashed border-[#ddd5da] py-9 text-center"><p className="text-sm font-semibold">이 조건에 해당하는 성분이 없어요.</p></div>}
  </section>;
}

function matches(ingredient: ProductIngredient, filter: (typeof filters)[number]) {
  if (filter === "전체") return true;
  if (filter === "내 피부에 좋음") return ingredient.status === "GOOD";
  if (filter === "주의") return ingredient.status === "CAUTION";
  return ingredient.tags.includes(filter);
}

function IngredientRow({ ingredient }: { ingredient: ProductIngredient }) {
  const caution = ingredient.status === "CAUTION";
  const regulations = ingredient.regulations ?? [];
  return <Link href={`/ingredients/${ingredient.id}`} className="group flex items-start justify-between gap-3 rounded-2xl border border-[#e8e5e9] bg-white p-4 transition hover:border-[#d7a7b8]">
    <div className="flex min-w-0 gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${caution ? "bg-[#fff0ec] text-[#a76455]" : "bg-[#eef3ec] text-[#64735f]"}`}>{caution ? <TriangleAlert size={14}/> : <Check size={14}/>}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><h3 className="font-myeongjo text-[15px] font-semibold">{ingredient.name}</h3>{ingredient.concentrationNote && <span className="rounded-full bg-[#f5f2f4] px-2 py-0.5 text-[8px] text-[#796f77]">{ingredient.concentrationNote}</span>}{regulations.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-[#e2c7d0] px-2 py-0.5 text-[8px] font-bold text-[#934d63]"><ShieldCheck size={9} /> 사용조건 {regulations.length}건</span>}</div><p className="mt-0.5 text-[10px] font-semibold text-[#9a5369]">{ingredient.role}</p><p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[#716870]">{caution ? ingredient.caution : ingredient.description}</p>{regulations.length > 0 && <p className="mt-1 text-[9px] leading-4 text-[#8f6674]">{Array.from(new Set(regulations.map((item) => item.country).filter(Boolean))).join(" · ") || "식약처 원문"} 제품 유형·농도 조건 확인</p>}</div></div><ChevronRight size={15} className="mt-1 shrink-0 text-[#9a9299] transition group-hover:translate-x-0.5"/>
  </Link>;
}
