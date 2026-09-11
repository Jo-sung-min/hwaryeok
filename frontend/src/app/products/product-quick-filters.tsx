"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  buildProductQuickFilterHref,
  getProductConcernOption,
  PRODUCT_CATEGORIES,
  PRODUCT_CONCERN_OPTIONS,
  type ProductFilterValues,
  type ProductQuickFilterAxis,
} from "@/lib/product-catalog";
import styles from "./product-quick-filters.module.css";

type Props = {
  filters: ProductFilterValues;
};

const triggerIds: Record<ProductQuickFilterAxis, string> = {
  category: "product-category-filter-trigger",
  concern: "product-concern-filter-trigger",
};

const panelIds: Record<ProductQuickFilterAxis, string> = {
  category: "product-category-filter-panel",
  concern: "product-concern-filter-panel",
};

export function ProductQuickFilters({ filters }: Props) {
  const [openPanel, setOpenPanel] = useState<ProductQuickFilterAxis | null>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const concernTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedConcern = getProductConcernOption(filters.concern);

  useEffect(() => {
    if (!openPanel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const trigger = openPanel === "category" ? categoryTriggerRef.current : concernTriggerRef.current;
      setOpenPanel(null);
      trigger?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [openPanel]);

  function togglePanel(panel: ProductQuickFilterAxis) {
    setOpenPanel((current) => current === panel ? null : panel);
  }

  const triggerDefinitions: {
    axis: ProductQuickFilterAxis;
    label: string;
    value: string;
    selected: boolean;
    ref: typeof categoryTriggerRef;
  }[] = [
    {
      axis: "category",
      label: "제품 유형",
      value: filters.category,
      selected: filters.category !== "전체",
      ref: categoryTriggerRef,
    },
    {
      axis: "concern",
      label: "피부 고민",
      value: selectedConcern?.label ?? "전체",
      selected: Boolean(selectedConcern),
      ref: concernTriggerRef,
    },
  ];

  const options = openPanel === "category"
    ? PRODUCT_CATEGORIES.map((value) => ({ value, label: value }))
    : openPanel === "concern"
      ? [{ value: "전체 고민", label: "전체" }, ...PRODUCT_CONCERN_OPTIONS.map(({ value, label }) => ({ value, label }))]
      : [];

  return (
    <div className={styles.quickFilters}>
      <div className={styles.triggerRow} role="group" aria-label="빠른 상품 필터">
        {triggerDefinitions.map((trigger) => {
          const expanded = openPanel === trigger.axis;
          return (
            <button
              key={trigger.axis}
              ref={trigger.ref}
              id={triggerIds[trigger.axis]}
              type="button"
              className={styles.trigger}
              data-selected={trigger.selected || undefined}
              aria-expanded={expanded}
              aria-controls={panelIds[trigger.axis]}
              onClick={() => togglePanel(trigger.axis)}
            >
              <span>{trigger.label}</span>
              <strong>{trigger.value}</strong>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {openPanel && (
        <div
          id={panelIds[openPanel]}
          className={styles.panel}
          role="region"
          aria-labelledby={triggerIds[openPanel]}
        >
          <p>{openPanel === "category" ? "제품 유형 선택" : "피부 고민 선택"}</p>
          <nav aria-label={openPanel === "category" ? "제품 유형 선택지" : "피부 고민 선택지"} className={styles.optionGrid}>
            {options.map((option) => {
              const selected = openPanel === "category"
                ? filters.category === option.value
                : filters.concern === option.value;
              return (
                <Link
                  key={`${openPanel}-${option.value}`}
                  href={buildProductQuickFilterHref(filters, openPanel, option.value)}
                  scroll={false}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => setOpenPanel(null)}
                >
                  <span>{option.label}</span>
                  {selected && <Check size={13} aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
