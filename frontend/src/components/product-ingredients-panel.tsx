"use client";

import Link from "next/link";
import { Check, ChevronRight, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { ProductIngredient, ProductIngredients } from "@/lib/types";

const filters = ["전체", "내 피부에 좋음", "주의", "보습", "진정", "장벽"] as const;

export function ProductIngredientsPanel({ data }: { data: ProductIngredients }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("전체");
  const items = data.ingredients.filter((ingredient) => matches(ingredient, filter));

  return <section className="container-page py-20 md:py-28">
    <div className="mb-9 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div><p className="eyebrow mb-4">INGREDIENT NOTE</p><h2 className="section-title font-myeongjo">전성분을 피부의 언어로</h2><p className="mt-4 text-sm leading-7 text-[#796c63]">제품에 실제로 연결된 핵심 성분과 지금 피부가 주의해서 볼 지점을 확인해보세요.</p></div>
      <Link href="/ingredients" className="line-btn self-start md:self-auto">성분 사전 <ChevronRight size={16}/></Link>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Summary label="전체 성분" value={data.totalCount}/>
      <Summary label="내 피부에 좋음" value={data.goodCount} tone="good"/>
      <Summary label="주의해서 보기" value={data.cautionCount} tone="caution"/>
      <Summary label="일반 성분" value={data.neutralCount}/>
    </div>

    <div className="scrollbar-hide mb-7 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="제품 성분 필터">
      {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`shrink-0 rounded-full px-4 py-2.5 text-xs transition ${filter === item ? "bg-[#37312c] text-white" : "border border-[#74513f20] bg-[#fffaf3] text-[#70635b]"}`}>{item}</button>)}
    </div>

    {items.length > 0 ? <div className="grid gap-3 md:grid-cols-2">{items.map((ingredient) => <IngredientRow key={ingredient.id} ingredient={ingredient}/>)}</div> : <div className="rounded-[24px] border border-dashed border-[#74513f2a] bg-[#fffaf278] py-14 text-center"><span className="text-3xl text-[#d08f7c]">❀</span><p className="mt-4 font-myeongjo text-lg">이 조건에 해당하는 성분이 없어요.</p></div>}
  </section>;
}

function matches(ingredient: ProductIngredient, filter: (typeof filters)[number]) {
  if (filter === "전체") return true;
  if (filter === "내 피부에 좋음") return ingredient.status === "GOOD";
  if (filter === "주의") return ingredient.status === "CAUTION";
  return ingredient.tags.includes(filter);
}

function Summary({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "good" | "caution" }) {
  const color = tone === "good" ? "text-[#71806b]" : tone === "caution" ? "text-[#b06e59]" : "text-[#51473f]";
  return <div className="rounded-2xl border border-[#74513f17] bg-[#fffaf291] p-4"><strong className={`font-myeongjo text-2xl ${color}`}>{value}</strong><p className="mt-1 text-[11px] text-[#81736a]">{label}</p></div>;
}

function IngredientRow({ ingredient }: { ingredient: ProductIngredient }) {
  const caution = ingredient.status === "CAUTION";
  return <Link href={`/ingredients/${ingredient.id}`} className="group flex items-start justify-between gap-4 rounded-[22px] border border-[#74513f17] bg-[#fffaf291] p-5 transition hover:border-[#9f705e4a]">
    <div className="flex min-w-0 gap-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${caution ? "bg-[#dca38d25] text-[#ad705c]" : "bg-[#8c9b8020] text-[#71806b]"}`}>{caution ? <TriangleAlert size={16}/> : <Check size={16}/>}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-myeongjo text-lg font-semibold">{ingredient.name}</h3>{ingredient.concentrationNote && <span className="rounded-full bg-[#8c796b12] px-2 py-1 text-[9px] text-[#79695f]">{ingredient.concentrationNote}</span>}</div><p className="mt-1 text-xs font-semibold text-[#9a6556]">{ingredient.role}</p><p className="mt-3 line-clamp-2 text-xs leading-6 text-[#71655d]">{caution ? ingredient.caution : ingredient.description}</p></div></div><ChevronRight size={17} className="mt-2 shrink-0 text-[#9a8275] transition group-hover:translate-x-0.5"/>
  </Link>;
}
