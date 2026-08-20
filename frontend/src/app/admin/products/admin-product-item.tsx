"use client";

import { ChevronDown, CircleAlert, FileCheck2, FlaskConical, ImagePlus, PencilLine } from "lucide-react";
import { useState } from "react";
import { ProductDeleteForm } from "@/app/admin/products/product-delete-form";
import { ProductForm } from "@/app/admin/products/product-form";
import { ProductImageForm } from "@/app/admin/products/product-image-form";
import { ProductIngredientsForm } from "@/app/admin/products/product-ingredients-form";
import { ProductVisual } from "@/components/product-ui";
import type { Ingredient, Product, ProductIngredients, ProductPublicationStatus } from "@/lib/types";

export function AdminProductItem({
  product,
  availableIngredients,
  initialIngredients,
}: {
  product: Product;
  availableIngredients: Ingredient[];
  initialIngredients: ProductIngredients;
}) {
  const [open, setOpen] = useState(false);
  const ingredientCount = initialIngredients.totalCount;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#dca9b63d] bg-[#fffafc] shadow-[0_14px_34px_rgba(151,76,96,.06)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`admin-product-${product.id}`}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-24 w-full items-center gap-4 p-4 text-left sm:gap-5 sm:p-5"
      >
        <span className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} compact /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-bold uppercase tracking-[.12em] text-[#9a7d86]">{product.brand} · {product.category}</span>
          <span className="mt-1 line-clamp-2 block font-myeongjo text-lg font-semibold sm:text-xl">{product.name}</span>
          <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#89747c]">
            <StatusBadge status={product.publicationStatus} />
            <span className="rounded-full bg-[#f5eff1] px-2 py-1">{product.score}점</span>
            <span className="rounded-full bg-[#f5eff1] px-2 py-1">성분 {ingredientCount}개</span>
            {!isReady(product, ingredientCount) && <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1df] px-2 py-1 text-[#936626]"><CircleAlert size={11} /> 정보 보완 필요</span>}
          </span>
        </span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff0f3] text-[#a65066]"><ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} /></span>
      </button>

      {open && (
        <div id={`admin-product-${product.id}`} className="border-t border-[#dca9b62f] bg-white/55 p-4 sm:p-6 md:p-7">
          <div className="mb-5 flex items-center gap-2 text-xs font-bold text-[#8f5262]"><PencilLine size={15} /> 기본 정보 수정</div>
          <ProductForm product={product} />
          <div className="mt-7 border-t border-[#74513f18] pt-6">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf2e9] text-[#60755c]"><FlaskConical size={17} /></span>
              <div><div className="text-xs font-bold text-[#6c665b]">제품 성분 연결</div><p className="mt-1 text-[11px] leading-5 text-[#897d78]">확인된 성분만 연결하고 표시 순서와 역할 메모를 저장해 주세요.</p></div>
            </div>
            <ProductIngredientsForm productId={product.id} availableIngredients={availableIngredients} initialIngredients={initialIngredients} />
          </div>
          <div className="mt-7 grid gap-5 border-t border-[#74513f18] pt-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div><div className="flex items-center gap-2 text-xs font-bold text-[#8f5262]"><ImagePlus size={15} /> 제품 이미지</div><ProductImageForm productId={product.id} /></div>
            <div className="space-y-3">
              <Readiness product={product} ingredientCount={ingredientCount} />
              <ProductDeleteForm productId={product.id} productName={product.name} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const statusLabels: Record<ProductPublicationStatus, string> = {
  DRAFT: "초안",
  PUBLISHED: "공개",
  HIDDEN: "숨김",
};

function StatusBadge({ status }: { status: ProductPublicationStatus }) {
  const color = status === "PUBLISHED" ? "bg-[#e8f2e9] text-[#55735e]" : status === "DRAFT" ? "bg-[#fff0d9] text-[#906425]" : "bg-[#eee9eb] text-[#75676c]";
  return <span className={`rounded-full px-2 py-1 font-bold ${color}`}>{statusLabels[status]}</span>;
}

function isReady(product: Product, ingredientCount: number) {
  return Boolean(product.imageUrl && product.sourceUrl && product.sourceCheckedAt && ingredientCount > 0);
}

function Readiness({ product, ingredientCount }: { product: Product; ingredientCount: number }) {
  const checks = [
    { label: "이미지", done: Boolean(product.imageUrl) },
    { label: "출처", done: Boolean(product.sourceUrl) },
    { label: "확인일", done: Boolean(product.sourceCheckedAt) },
    { label: `성분 ${ingredientCount}개`, done: ingredientCount > 0 },
  ];
  const complete = checks.every((check) => check.done);
  return (
    <div className={`rounded-2xl border px-4 py-3 text-xs ${complete ? "border-[#9ebea64d] bg-[#f1f7f2] text-[#55735e]" : "border-[#e5be8259] bg-[#fff9ed] text-[#866129]"}`}>
      <p className="flex items-center gap-2 font-bold"><FileCheck2 size={15} /> {complete ? "공개 정보 준비 완료" : "공개 전 정보 점검"}</p>
      <div className="mt-2 flex max-w-[17rem] flex-wrap gap-1.5">
        {checks.map((check) => <span key={check.label} className={`rounded-full px-2 py-1 ${check.done ? "bg-white/80" : "bg-[#f8e3bd]"}`}>{check.done ? "✓" : "!"} {check.label}</span>)}
      </div>
    </div>
  );
}
