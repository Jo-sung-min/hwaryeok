"use client";

import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { useRef, useState } from "react";
import type { IngredientRankingOption } from "@/lib/types";
import { rankingHref, type IngredientRankingFilters } from "@/lib/ingredient-ranking";

export function IngredientPicker({ ingredients, filters, basePath, preferredIds }: {
  ingredients: IngredientRankingOption[];
  filters: IngredientRankingFilters;
  basePath: "/" | "/ranking";
  preferredIds: string[];
}) {
  const [query, setQuery] = useState("");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  function closePicker() {
    if (detailsRef.current) detailsRef.current.open = false;
    setQuery("");
  }
  const common = ["hyaluronic-acid", "panthenol", "niacinamide", "ceramide-np", "heartleaf", "birch-sap"];
  const priority = [...new Set([...preferredIds, ...common])];
  const ordered = [...ingredients].sort((a, b) => {
    const left = priority.indexOf(a.id);
    const right = priority.indexOf(b.id);
    return (left < 0 ? priority.length : left) - (right < 0 ? priority.length : right) || a.name.localeCompare(b.name, "ko");
  });
  const primary = ordered.slice(0, 6);
  const selected = ordered.find((item) => item.id === filters.ingredient);
  if (selected && !primary.some((item) => item.id === selected.id)) primary.push(selected);
  const matches = ordered.filter((item) => `${item.name} ${item.englishName} ${item.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));

  function ingredientLink(item: IngredientRankingOption, expanded = false) {
    const active = filters.ingredient === item.id;
    return <Link key={item.id} href={rankingHref(basePath, { ingredient: item.id, sort: filters.sort })} scroll={false} onNavigate={closePicker}
      aria-current={active ? "page" : undefined}
      className={`${expanded ? "flex justify-between rounded-xl px-3 py-3" : "shrink-0 whitespace-nowrap rounded-full px-4 py-2.5"} border text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cf5b7d] ${active ? "border-[#cf5b7d] bg-[#cf5b7d] text-white" : "border-[#eedde3] bg-white text-[#6c5961] hover:border-[#d794a8] hover:bg-[#fff5f8]"}`}>
      <span>{preferredIds.includes(item.id) && <span className="mr-1" aria-label="내 관심 성분">♡</span>}{item.name}</span>
      {expanded && <span className={active ? "text-white/80" : "text-[#9f8b93]"}>{item.productCount}개</span>}
    </Link>;
  }

  return <div>
    <nav aria-label="성분 선택" className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-1">
      <Link href={rankingHref(basePath, { sort: filters.sort })} scroll={false} onNavigate={closePicker} aria-current={!filters.ingredient ? "page" : undefined}
        className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold ${!filters.ingredient ? "border-[#cf5b7d] bg-[#cf5b7d] text-white" : "border-[#eedde3] bg-white text-[#6c5961]"}`}>전체 성분</Link>
      {primary.map((item) => ingredientLink(item))}
    </nav>
    <details ref={detailsRef} className="group mt-1">
      <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 text-[11px] text-[#8e737e] [&::-webkit-details-marker]:hidden">성분 더 보기 <ChevronDown size={13} className="group-open:rotate-180" /></summary>
      <div className="my-2 rounded-2xl border border-[#eedde3] bg-[#fffafb] p-4">
        <label className="flex items-center gap-2 rounded-xl border border-[#eddae1] bg-white px-3 py-2.5"><Search size={15} className="text-[#ae788b]" /><span className="sr-only">랭킹 성분 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="성분명 또는 보습·진정·장벽 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{matches.map((item) => ingredientLink(item, true))}</div>
        {matches.length === 0 && <p className="py-5 text-center text-xs text-[#8b737e]">검색한 성분이 없어요. 다른 이름으로 찾아보세요.</p>}
      </div>
    </details>
  </div>;
}
