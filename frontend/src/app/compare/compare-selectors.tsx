"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import type { Product } from "@/lib/types";

export function CompareSelectors({ products, selectedIds }: { products: Product[]; selectedIds: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(index: number, value: string) {
    const nextIds = [...selectedIds];
    const duplicateIndex = nextIds.indexOf(value);
    if (duplicateIndex >= 0 && duplicateIndex !== index) nextIds[duplicateIndex] = selectedIds[index];
    nextIds[index] = value;
    const search = comparisonSearch(nextIds);
    startTransition(() => router.replace(`/compare?${search}`, { scroll: false }));
  }

  return <>
    {selectedIds.map((productId, index) => {
      const product = products.find((item) => item.id === productId) ?? products[index];
      return <div key={productId} aria-busy={isPending} className={`min-w-0 border-b border-[#74513f18] p-2.5 transition sm:p-5 ${index < selectedIds.length - 1 ? "border-r" : ""} ${isPending ? "opacity-60" : ""}`}>
        <div className="relative mb-3 overflow-hidden rounded-xl sm:mb-4"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} compact /></div>
        <div className="relative">
          <select aria-label={`${index + 1}번째 비교 제품`} value={product.id} disabled={isPending} onChange={(event) => select(index, event.target.value)} className="glass-select h-12 w-full min-w-0 appearance-none rounded-xl pl-2.5 pr-7 text-xs font-semibold outline-none focus:border-[#9b4a45] sm:pl-3 sm:pr-8 sm:text-sm">
            {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3.5" size={14} />
        </div>
      </div>;
    })}
  </>;
}

export function comparisonSearch(productIds: string[]) {
  const search = new URLSearchParams();
  if (productIds[0]) search.set("left", productIds[0]);
  if (productIds[1]) search.set("right", productIds[1]);
  if (productIds[2]) search.set("third", productIds[2]);
  return search;
}
