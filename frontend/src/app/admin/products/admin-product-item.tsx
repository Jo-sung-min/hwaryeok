"use client";

import { FlaskConical, ImagePlus, Landmark, Link2, ListChecks, PencilLine, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { adminCardClass } from "@/app/admin/admin-ui";
import { ProductDeleteForm } from "@/app/admin/products/product-delete-form";
import { CoupangPartnersForm } from "@/app/admin/products/coupang-partners-form";
import { ProductForm } from "@/app/admin/products/product-form";
import { ProductImageForm } from "@/app/admin/products/product-image-form";
import { ProductIngredientsForm } from "@/app/admin/products/product-ingredients-form";
import { MfdsProductMatchForm } from "@/app/admin/products/mfds-product-match-form";
import { OfficialIngredientForm } from "@/app/admin/products/official-ingredient-form";
import { ProductVisual } from "@/components/product-ui";
import type { AdminMfdsProductMatch, Ingredient, OfficialIngredientList, Product, ProductIngredients, ProductPublicationStatus } from "@/lib/types";

export function AdminProductItem({
  product,
  availableIngredients,
  initialIngredients,
  officialIngredientSource,
  mfdsMatch,
  defaultCheckedAt,
}: {
  product: Product;
  availableIngredients: Ingredient[];
  initialIngredients: ProductIngredients;
  officialIngredientSource?: OfficialIngredientList;
  mfdsMatch?: AdminMfdsProductMatch;
  defaultCheckedAt: string;
}) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const ingredientCount = initialIngredients.totalCount;
  const verifiedAmountCount = initialIngredients.verifiedAmountCount ?? initialIngredients.ingredients.filter((item) => item.amount?.verificationStatus === "VERIFIED").length;
  const ready = isReady(product, ingredientCount);
  const editorId = `admin-product-${product.id}`;

  useEffect(() => {
    if (open) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  if (!open) {
    return (
      <section ref={cardRef} className={`${adminCardClass} overflow-hidden`}>
        <button
          type="button"
          aria-expanded={false}
          aria-controls={editorId}
          onClick={() => setOpen(true)}
          className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0071e3]"
        >
          <span className="block aspect-square overflow-hidden bg-white">
            <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} variant="catalog" />
          </span>
          <span className="block border-t border-black/[.05] p-3.5">
            <span className="block truncate text-[12px] text-[#86868b]">{product.brand}</span>
            <span className="mt-0.5 line-clamp-2 block min-h-[2.6em] text-[14px] font-medium leading-[1.3]">{product.name}</span>
            <span className="mt-2.5 flex items-center gap-2 text-[12px]">
              <StatusLabel status={product.publicationStatus} />
              <span className="text-[#86868b]">성분 {ingredientCount}</span>
              {!ready && <span className="ml-auto font-medium text-[#c25e00]">보완</span>}
            </span>
          </span>
        </button>
      </section>
    );
  }

  return (
    <section ref={cardRef} className={`${adminCardClass} col-span-full scroll-mt-4 overflow-hidden`}>
      <div className="flex items-center gap-4 border-b border-black/[.06] p-4 sm:p-5">
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/[.05]">
          <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} variant="thumbnail" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-[#86868b]">{product.brand} · {product.category}</p>
          <h2 className="mt-0.5 line-clamp-2 text-[17px] font-semibold leading-snug">{product.name}</h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6e6e73]">
            <StatusLabel status={product.publicationStatus} />
            <span>{product.score}점</span>
            <span>성분 {ingredientCount}</span>
            {verifiedAmountCount > 0 && <span>함량 검증 {verifiedAmountCount}</span>}
            {mfdsMatch?.matchStatus === "ADMIN_VERIFIED" && <span>식약처 연결</span>}
            {mfdsMatch?.matchStatus === "NO_MATCH" && <span>식약처 해당 없음</span>}
            {product.coupangPartnersUrl && <span>파트너스</span>}
          </p>
        </div>
        <button
          type="button"
          aria-expanded
          aria-controls={editorId}
          aria-label="편집 닫기"
          onClick={() => setOpen(false)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5f5f7] text-[#6e6e73] transition hover:bg-[#e8e8ed] hover:text-[#1d1d1f]"
        >
          <X size={16} />
        </button>
      </div>

      <div id={editorId} className="px-4 py-2 sm:px-6">
        <EditorSection icon={PencilLine} title="기본 정보"><ProductForm product={product} /></EditorSection>
        <EditorSection icon={ImagePlus} title="이미지"><ProductImageForm productId={product.id} /></EditorSection>
        <EditorSection icon={FlaskConical} title="성분"><ProductIngredientsForm productId={product.id} availableIngredients={availableIngredients} initialIngredients={initialIngredients} /></EditorSection>
        <EditorSection icon={ListChecks} title="공식 전성분"><OfficialIngredientForm productId={product.id} initialSource={officialIngredientSource} defaultCheckedAt={defaultCheckedAt} /></EditorSection>
        <EditorSection icon={Landmark} title="식약처 품목"><MfdsProductMatchForm productId={product.id} productName={product.name} initialMatch={mfdsMatch} /></EditorSection>
        <EditorSection icon={Link2} title="쿠팡 파트너스"><CoupangPartnersForm productId={product.id} initialUrl={product.coupangPartnersUrl} /></EditorSection>
        <div className="flex flex-col gap-4 border-t border-black/[.06] py-6 sm:flex-row sm:items-center sm:justify-between">
          <Readiness product={product} ingredientCount={ingredientCount} />
          <ProductDeleteForm productId={product.id} productName={product.name} />
        </div>
      </div>
    </section>
  );
}

function EditorSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-black/[.06] py-6 first:border-t-0">
      <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold"><Icon size={16} className="text-[#86868b]" />{title}</h3>
      {children}
    </section>
  );
}

const statusLabels: Record<ProductPublicationStatus, string> = {
  DRAFT: "초안",
  PUBLISHED: "공개",
  HIDDEN: "숨김",
};

const statusDots: Record<ProductPublicationStatus, string> = {
  DRAFT: "bg-[#ff9f0a]",
  PUBLISHED: "bg-[#34c759]",
  HIDDEN: "bg-[#8e8e93]",
};

function StatusLabel({ status }: { status: ProductPublicationStatus }) {
  return <span className="inline-flex items-center gap-1.5 font-medium text-[#1d1d1f]"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${statusDots[status]}`} />{statusLabels[status]}</span>;
}

function isReady(product: Product, ingredientCount: number) {
  return Boolean(product.imageUrl && product.sourceUrl && product.sourceCheckedAt && ingredientCount > 0);
}

function Readiness({ product, ingredientCount }: { product: Product; ingredientCount: number }) {
  const checks = [
    { label: "이미지", done: Boolean(product.imageUrl) },
    { label: "출처", done: Boolean(product.sourceUrl) },
    { label: "확인일", done: Boolean(product.sourceCheckedAt) },
    { label: "성분", done: ingredientCount > 0 },
  ];
  return (
    <ul aria-label="공개 전 점검" className="flex flex-wrap gap-1.5 text-[12px]">
      {checks.map((check) => (
        <li key={check.label} className={`rounded-full px-2.5 py-1 font-medium ${check.done ? "bg-[#f5f5f7] text-[#1d1d1f]" : "bg-[#fff4e5] text-[#c25e00]"}`}>
          {check.done ? "✓" : "!"} {check.label}
        </li>
      ))}
    </ul>
  );
}
