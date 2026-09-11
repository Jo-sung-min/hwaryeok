"use client";

import Link from "next/link";
import { Check, ChevronRight, ExternalLink, FlaskConical, ShieldCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { IngredientAmount, ProductIngredient, ProductIngredients } from "@/lib/types";

const filters = ["전체", "도움 성분", "주의", "보습", "진정", "장벽"] as const;

export function ProductIngredientsPanel({ data }: { data: ProductIngredients }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("전체");
  const items = data.ingredients.filter((ingredient) => matches(ingredient, filter));
  const verifiedAmounts = data.ingredients.filter((ingredient) => ingredient.amount?.verificationStatus === "VERIFIED");
  const highlightedAmounts = [...verifiedAmounts]
    .sort((left, right) => Number(Boolean(right.isKeyIngredient)) - Number(Boolean(left.isKeyIngredient)))
    .slice(0, 3);

  return <section id="ingredients" className="container-page scroll-mt-24 py-8">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0"><p className="text-[10px] font-bold tracking-[.14em] text-[#ad4c6e]">INGREDIENTS</p><h2 className="mt-1 font-myeongjo text-2xl font-semibold">핵심 성분과 공개 함량</h2><p className="mt-1 text-xs leading-5 text-[#817780]">내가 고른 성분이 실제로 얼마나 공개됐는지, 근거와 함께 확인하세요.</p></div>
      <Link href="/ingredients" className="inline-flex min-h-10 shrink-0 items-center gap-0.5 text-xs font-semibold text-[#a33f62]">성분 사전 <ChevronRight size={14}/></Link>
    </div>

    {data.source && <a href={data.source.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label={`브랜드 공식 전성분 출처를 새 창에서 확인 (${data.source.ingredientCount}개)`} className="mb-4 flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[#e8e5e9] px-3 text-[10px] font-medium text-[#746b73]"><span className="flex min-w-0 items-center gap-1.5"><ShieldCheck size={13} className="shrink-0 text-[#9b4a63]" /><span className="truncate">브랜드 공식 전성분 {data.source.ingredientCount}개 · {data.source.checkedAt.replaceAll("-", ".")} 확인</span></span><ExternalLink size={11} className="shrink-0" /></a>}

    {highlightedAmounts.length > 0 ? <div className="mb-5 rounded-2xl border border-[#efd8df] bg-[#fff9fb] p-4">
      <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-1.5 text-xs font-bold text-[#7f4858]"><FlaskConical size={14} /> 공식 수치가 확인된 성분</p><span className="text-[9px] font-semibold text-[#9a7c87]">{data.verifiedAmountCount ?? verifiedAmounts.length}개 검증</span></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">{highlightedAmounts.map((ingredient) => <AmountSummary key={ingredient.id} ingredient={ingredient} />)}</div>
      <p className="mt-3 text-[9px] leading-4 text-[#907983]">같은 성분·같은 배합 기준끼리 비교할 때 참고해 주세요. 제품 용량이 크다고 농도가 더 높은 것은 아니에요.</p>
    </div> : <div className="mb-5 flex items-start gap-2 rounded-2xl border border-[#e8e5e9] bg-[#faf9fa] px-4 py-3 text-[10px] leading-5 text-[#817780]"><FlaskConical size={14} className="mt-0.5 shrink-0" /><p><strong className="text-[#5f555d]">공개된 정량 함량은 아직 없어요.</strong><br />전성분 순서는 실제 함량이 아니며, 미공개 함량을 0으로 보지 않아요.</p></div>}

    <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 border-y border-[#ece9ed] py-3 text-[10px] text-[#7f7680]">
      <strong className="text-[#4b454c]">전체 {data.totalCount}</strong>
      <span className="text-[#63715e]">도움 성분 {data.goodCount}</span>
      <span className="text-[#a35d51]">주의 {data.cautionCount}</span>
      <span>일반 {data.neutralCount}</span>
    </div>

    <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="제품 성분 필터">
      {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className="glass-choice shrink-0 rounded-full px-3 py-2 text-[11px]">{item}</button>)}
    </div>

    {items.length > 0 ? <div className="grid gap-2">{items.map((ingredient) => <IngredientRow key={ingredient.id} ingredient={ingredient}/>)}</div> : <div className="rounded-2xl border border-dashed border-[#ddd5da] py-9 text-center"><p className="text-sm font-semibold">이 조건에 해당하는 성분이 없어요.</p></div>}
  </section>;
}

function AmountSummary({ ingredient }: { ingredient: ProductIngredient }) {
  const amount = ingredient.amount!;
  return <article className="rounded-xl border border-[#eadce1] bg-white p-3">
    <Link href={`/ingredients/${ingredient.id}`} className="block"><p className="flex items-center gap-1 text-[9px] font-bold text-[#a05069]">{ingredient.isKeyIngredient && <span className="rounded bg-[#fff0f4] px-1.5 py-0.5">핵심</span>}{ingredient.name}</p><strong className="mt-1 block text-lg tabular-nums text-[#4f4147]">{amount.displayValue}</strong>{amount.amountPerContainer && <span className="mt-1 block text-[9px] text-[#786b72]">{amount.amountPerContainer}</span>}</Link>
    <a href={amount.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${ingredient.name} 공식 함량 근거를 새 창에서 확인`} className="mt-2 inline-flex min-h-8 items-center gap-1 text-[9px] font-semibold text-[#996174] underline underline-offset-4">공식 근거 <ExternalLink size={9} /></a>
  </article>;
}

function matches(ingredient: ProductIngredient, filter: (typeof filters)[number]) {
  if (filter === "전체") return true;
  if (filter === "도움 성분") return ingredient.status === "GOOD";
  if (filter === "주의") return ingredient.status === "CAUTION";
  return ingredient.tags.includes(filter);
}

function IngredientRow({ ingredient }: { ingredient: ProductIngredient }) {
  const caution = ingredient.status === "CAUTION";
  const regulations = ingredient.regulations ?? [];
  const amount = ingredient.amount?.verificationStatus === "VERIFIED" ? ingredient.amount : null;
  return <article className="rounded-2xl border border-[#e8e5e9] bg-white transition hover:border-[#d7a7b8]">
    <Link href={`/ingredients/${ingredient.id}`} className="group flex items-start justify-between gap-3 p-4 pb-3">
      <div className="flex min-w-0 gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${caution ? "bg-[#fff0ec] text-[#a76455]" : "bg-[#eef3ec] text-[#64735f]"}`}>{caution ? <TriangleAlert size={14}/> : <Check size={14}/>}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><h3 className="font-myeongjo text-[15px] font-semibold">{ingredient.name}</h3>{ingredient.isKeyIngredient && <span className="rounded-full bg-[#fff0f4] px-2 py-0.5 text-[8px] font-bold text-[#a64c68]">핵심</span>}{regulations.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-[#e2c7d0] px-2 py-0.5 text-[8px] font-bold text-[#934d63]"><ShieldCheck size={9} /> 사용조건 {regulations.length}건</span>}</div><p className="mt-0.5 text-[10px] font-semibold text-[#9a5369]">{ingredient.role}</p><p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[#716870]">{caution ? ingredient.caution : ingredient.description}</p>{regulations.length > 0 && <p className="mt-1 text-[9px] leading-4 text-[#8f6674]">{Array.from(new Set(regulations.map((item) => item.country).filter(Boolean))).join(" · ") || "식약처 원문"} 제품 유형·농도 조건 확인</p>}</div></div><ChevronRight size={15} className="mt-1 shrink-0 text-[#9a9299] transition group-hover:translate-x-0.5"/>
    </Link>
    <div className="mx-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0eaed] py-3 pl-11 text-[9px]">
      {amount ? <><div><strong className="text-[12px] tabular-nums text-[#9f3f60]">{amount.displayValue}</strong><span className="ml-1.5 text-[#8d7b82]">{amountBasisLabel(amount)}</span>{amount.amountPerContainer && <span className="ml-1.5 text-[#6f656b]">· {amount.amountPerContainer}</span>}</div><a href={amount.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${ingredient.name} ${sourceLabel(amount)} 함량 근거를 새 창에서 확인`} className="inline-flex min-h-8 items-center gap-1 font-semibold text-[#98596e] underline underline-offset-4">{sourceLabel(amount)} · {amount.checkedAt.replaceAll("-", ".")} <ExternalLink size={9} /></a></> : <span className="text-[#80757c]">전성분 {ingredient.displayOrder}번째 · 정확 함량 미공개 · 순서는 실제 함량이 아니에요</span>}
    </div>
  </article>;
}

function sourceLabel(amount: IngredientAmount) {
  return { BRAND_OFFICIAL: "브랜드 공식", PACKAGE_LABEL: "제품 포장", MFDS_FUNCTIONAL_REPORT: "식약처 보고", TEST_REPORT: "시험성적서" }[amount.sourceType];
}

function amountBasisLabel(amount: IngredientAmount) {
  const basis = { W_W: "중량 기준", W_V: "부피당 중량", V_V: "부피 기준", UNSPECIFIED: "공식 기준 미기재" }[amount.basis];
  const substance = { PURE_INGREDIENT: "표준 성분", RAW_MATERIAL_COMPLEX: "복합 원료", DERIVATIVE_EQUIVALENT: "유도체 환산" }[amount.substanceBasis];
  return `${substance} · ${basis}`;
}
