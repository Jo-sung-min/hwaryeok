"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import type { Product } from "@/lib/types";

export function CompareSelectors({ products, leftId, rightId }: { products: Product[]; leftId: string; rightId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(side: "left" | "right", value: string) {
    let nextLeft = side === "left" ? value : leftId;
    let nextRight = side === "right" ? value : rightId;

    if (nextLeft === nextRight) {
      if (side === "left") nextRight = leftId;
      else nextLeft = rightId;
    }

    const search = new URLSearchParams({ left: nextLeft, right: nextRight });
    startTransition(() => router.replace(`/compare?${search}`, { scroll: false }));
  }

  return <>
    {[leftId, rightId].map((productId, index) => {
      const product = products.find((item) => item.id === productId) ?? products[index];
      return <div key={index} aria-busy={isPending} className={`border-b border-[#74513f18] p-3 transition sm:p-6 ${index === 0 ? "border-r" : ""} ${isPending ? "opacity-60" : ""}`}>
        <div className="relative mb-4 overflow-hidden rounded-xl"><ProductVisual tone={product.tone} compact/></div>
        <div className="relative">
          <select aria-label={`${index + 1}번째 비교 제품`} value={product.id} disabled={isPending} onChange={(event) => select(index === 0 ? "left" : "right", event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#74513f20] bg-[#fffdf7] pl-3 pr-8 text-xs font-semibold outline-none focus:border-[#9b4a45] sm:text-sm">
            {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3.5" size={14}/>
        </div>
      </div>;
    })}
  </>;
}
