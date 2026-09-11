"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import { comparisonSearch, filterCompareProducts, replaceComparisonProduct } from "@/lib/compare-products";
import type { Product } from "@/lib/types";
import styles from "./compare-selectors.module.css";

export function CompareSelectors({ products, selectedIds }: { products: Product[]; selectedIds: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [draftProductId, setDraftProductId] = useState("");
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const open = pickerIndex !== null;

  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "ko-KR")), [products]);
  const visibleProducts = useMemo(
    () => filterCompareProducts(products, query, category),
    [category, products, query],
  );
  const draftProduct = products.find((product) => product.id === draftProductId);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const appShell = document.querySelector<HTMLElement>(".app-shell");
    const shellWasInert = appShell?.hasAttribute("inert") ?? false;
    document.body.style.overflow = "hidden";
    appShell?.setAttribute("inert", "");
    const focusFrame = requestAnimationFrame(() => searchInputRef.current?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closePicker();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (!shellWasInert) appShell?.removeAttribute("inert");
      openerRef.current?.focus();
    };
  }, [open]);

  function showPicker(index: number, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setQuery("");
    setCategory("");
    setDraftProductId(selectedIds[index]);
    setPickerIndex(index);
  }

  function closePicker() {
    setPickerIndex(null);
    setQuery("");
    setCategory("");
    setDraftProductId("");
  }

  function applySelection() {
    if (pickerIndex === null || !draftProductId) return;
    const nextIds = replaceComparisonProduct(selectedIds, pickerIndex, draftProductId);
    const changed = nextIds.some((id, index) => id !== selectedIds[index]);
    closePicker();
    if (!changed) return;
    startTransition(() => router.replace(`/compare?${comparisonSearch(nextIds)}`, { scroll: false }));
  }

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
    ) ?? [])].filter((item) => item.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <>
    {selectedIds.map((productId, index) => {
      const product = products.find((item) => item.id === productId) ?? products[index];
      return <div key={`${index}-${productId}`} aria-busy={isPending} className={`${styles.selectorCell} ${index < selectedIds.length - 1 ? styles.selectorCellBorder : ""} ${isPending ? styles.pending : ""}`}>
        <div className={styles.productVisual}><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} variant="comparison" /></div>
        <button type="button" disabled={isPending} onClick={(event) => showPicker(index, event)} className={styles.selectorButton} aria-label={`${index + 1}번째 비교 제품 검색: ${product.brand} ${product.name}`} aria-haspopup="dialog" aria-expanded={pickerIndex === index} aria-controls="compare-product-picker">
          <span><small>{product.brand}</small><strong>{product.name}</strong></span>
          <span className={styles.changeLabel}>검색 <ChevronDown size={13} aria-hidden="true" /></span>
        </button>
      </div>;
    })}

    {open && createPortal(<div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget) closePicker(); }}>
      <div ref={dialogRef} id="compare-product-picker" className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="compare-product-picker-title" onKeyDown={trapFocus}>
        <header className={styles.sheetHeader}>
          <h2 id="compare-product-picker-title">{pickerIndex + 1}번째 비교 제품</h2>
          <button type="button" className={styles.resetButton} onClick={() => { setQuery(""); setCategory(""); }}><RotateCcw size={15} aria-hidden="true" /> 초기화</button>
          <button type="button" className={styles.closeButton} onClick={closePicker} aria-label="제품 검색 닫기"><X size={22} aria-hidden="true" /></button>
        </header>

        <div className={styles.searchArea}>
          <label className={styles.searchField}>
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">비교 제품 검색</span>
            <input ref={searchInputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="브랜드 또는 제품명 검색" autoComplete="off" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기"><X size={16} aria-hidden="true" /></button>}
          </label>
          <div className={styles.categoryRail} role="group" aria-label="제품 유형 필터">
            {["", ...categories].map((item) => <button key={item || "all"} type="button" data-active={category === item || undefined} onClick={() => setCategory(item)}>{item || "전체"}</button>)}
          </div>
        </div>

        <div className={styles.resultMeta} aria-live="polite"><strong>{visibleProducts.length.toLocaleString("ko-KR")}</strong>개 제품</div>
        <div className={styles.resultBody}>
          {visibleProducts.length > 0 ? <ul className={styles.productList}>
            {visibleProducts.map((product) => {
              const selectedIndex = selectedIds.indexOf(product.id);
              const isDraft = product.id === draftProductId;
              const isSelectedElsewhere = selectedIndex >= 0 && selectedIndex !== pickerIndex;
              return <li key={product.id}>
                <button type="button" className={isDraft ? styles.productSelected : undefined} aria-pressed={isDraft} onClick={() => setDraftProductId(product.id)}>
                  <span className={styles.resultVisual}><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt="" variant="comparison" /></span>
                  <span className={styles.resultText}><small>{product.brand} · {product.category}</small><strong>{product.name}</strong><span>{product.price}</span>{isSelectedElsewhere && <em>비교 중 · 선택하면 위치가 바뀌어요</em>}</span>
                  <span className={styles.radioMark} aria-hidden="true">{isDraft && <Check size={13} />}</span>
                </button>
              </li>;
            })}
          </ul> : <div className={styles.emptyState} role="status"><Search size={24} aria-hidden="true" /><strong>검색 결과가 없어요.</strong><p>제품명이나 브랜드를 짧게 검색해 보세요.</p><button type="button" onClick={() => { setQuery(""); setCategory(""); }}>전체 제품 보기</button></div>}
        </div>

        <footer className={styles.sheetFooter}>
          <button type="button" className={styles.applyButton} onClick={applySelection} disabled={!draftProduct}>{draftProduct ? `${draftProduct.name} 선택` : "비교 제품을 선택해 주세요"}</button>
        </footer>
      </div>
    </div>, document.body)}
  </>;
}
