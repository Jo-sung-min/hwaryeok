"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookmarkCheck, LogIn, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { saveComparisonAction } from "./actions";
import { comparisonSearch } from "./compare-selectors";

export function ComparisonToolbar({
  products,
  selectedIds,
  savedIds,
  isAuthenticated,
}: {
  products: Product[];
  selectedIds: string[];
  savedIds: string[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [confirmedIds, setConfirmedIds] = useState(savedIds);
  const isSaved = sameIds(selectedIds, confirmedIds);

  useEffect(() => setConfirmedIds(savedIds), [savedIds]);

  function navigate(nextIds: string[]) {
    setMessage("");
    startTransition(() => router.replace(`/compare?${comparisonSearch(nextIds)}`, { scroll: false }));
  }

  function addThird() {
    const nextProduct = products.find((product) => !selectedIds.includes(product.id));
    if (nextProduct) navigate([...selectedIds, nextProduct.id]);
  }

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await saveComparisonAction(selectedIds);
      if (result.success) setConfirmedIds(result.productIds);
      setMessage(result.message);
    });
  }

  return (
    <div className="mb-5 rounded-[22px] border border-[#e4afbb45] bg-white/72 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold"><BookmarkCheck size={17} className="text-[#a44f64]" /> 비교 바구니 {selectedIds.length}/3</div>
        <p className="mt-1.5 text-xs leading-5 text-[#82736a]">로그인하면 선택한 순서까지 저장되어 다음 방문에도 그대로 이어집니다.</p>
        {message && <p role="status" className="mt-2 text-xs font-semibold text-[#9b4a55]">{message}</p>}
      </div>
      <div className="mt-4 flex flex-col gap-2 min-[380px]:flex-row sm:mt-0 sm:shrink-0">
        {selectedIds.length < 3 ? (
          <button type="button" onClick={addThird} disabled={pending || selectedIds.length >= products.length} className="line-btn w-full px-4 sm:w-auto"><Plus size={15} /> 세 번째 제품</button>
        ) : (
          <button type="button" onClick={() => navigate(selectedIds.slice(0, 2))} disabled={pending} className="line-btn w-full px-4 sm:w-auto"><Trash2 size={15} /> 세 번째 빼기</button>
        )}
        {isAuthenticated ? (
          <button type="button" onClick={save} disabled={pending || isSaved} className="ink-btn w-full px-4 disabled:cursor-default disabled:opacity-55 sm:w-auto">{pending ? "반영 중…" : isSaved ? "저장됨" : "비교 저장"}</button>
        ) : (
          <Link href={`/login?returnTo=${encodeURIComponent(`/compare?${comparisonSearch(selectedIds)}`)}`} className="ink-btn w-full px-4 sm:w-auto"><LogIn size={15} /> 로그인하고 저장</Link>
        )}
      </div>
    </div>
  );
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}
