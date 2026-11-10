"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminProductItem } from "@/app/admin/products/admin-product-item";
import type { AdminMfdsProductMatch, Ingredient, OfficialIngredientList, Product, ProductIngredients, ProductPublicationStatus } from "@/lib/types";

export type AdminProductEntry = {
  product: Product;
  ingredients: ProductIngredients;
  officialIngredientSource?: OfficialIngredientList;
  mfdsMatch?: AdminMfdsProductMatch;
};

type Filter = "ALL" | ProductPublicationStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PUBLISHED", label: "공개" },
  { value: "DRAFT", label: "초안" },
  { value: "HIDDEN", label: "숨김" },
];

export function AdminProductBrowser({ entries, availableIngredients, defaultCheckedAt }: {
  entries: AdminProductEntry[];
  availableIngredients: Ingredient[];
  defaultCheckedAt: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { ALL: entries.length, PUBLISHED: 0, DRAFT: 0, HIDDEN: 0 };
    for (const entry of entries) result[entry.product.publicationStatus] += 1;
    return result;
  }, [entries]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return entries.filter(({ product }) =>
      (filter === "ALL" || product.publicationStatus === filter)
      && (!keyword || `${product.brand} ${product.name} ${product.category} ${product.id}`.toLowerCase().includes(keyword)));
  }, [entries, filter, query]);

  return (
    <section aria-label="등록 상품">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:w-80">
          <span className="sr-only">상품 검색</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="브랜드, 제품명 검색"
            className="h-10 w-full rounded-xl bg-white pl-9 pr-3 text-[14px] text-[#1d1d1f] outline-none ring-1 ring-black/[.06] placeholder:text-[#86868b] focus:ring-2 focus:ring-[#0071e3]/40"
          />
        </label>
        <div role="group" aria-label="공개 상태" className="inline-flex self-start rounded-xl bg-[#e8e8ed] p-1">
          {filters.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.value)}
                className={`h-8 rounded-lg px-3 text-[13px] font-medium transition ${active ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,.1)]" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
              >
                {option.label} <span className="tabular-nums text-[#86868b]">{counts[option.value]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((entry) => (
            <AdminProductItem
              key={entry.product.id}
              product={entry.product}
              availableIngredients={availableIngredients}
              initialIngredients={entry.ingredients}
              officialIngredientSource={entry.officialIngredientSource}
              mfdsMatch={entry.mfdsMatch}
              defaultCheckedAt={defaultCheckedAt}
            />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-[14px] text-[#86868b]">찾는 상품이 없어요.</p>
      )}
    </section>
  );
}
