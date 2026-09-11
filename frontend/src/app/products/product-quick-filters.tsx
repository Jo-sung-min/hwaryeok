"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  buildProductCatalogHref,
  buildProductQuickFilterHref,
  getProductConcernOption,
  PRODUCT_CATEGORIES,
  PRODUCT_CONCERN_OPTIONS,
  type ProductFilterValues,
  type ProductQuickFilterAxis,
} from "@/lib/product-catalog";
import type { IngredientRankingOption } from "@/lib/types";
import styles from "./product-quick-filters.module.css";

type Props = {
  filters: ProductFilterValues;
  ingredients: IngredientRankingOption[];
  resultCount: number;
};

type FilterPanel = "advanced" | ProductQuickFilterAxis;
type FilterOption = { label: string; value: string };

const triggerIds: Record<FilterPanel, string> = {
  advanced: "product-advanced-filter-trigger",
  category: "product-category-filter-trigger",
  concern: "product-concern-filter-trigger",
};

const panelIds: Record<FilterPanel, string> = {
  advanced: "product-advanced-filter-panel",
  category: "product-category-filter-panel",
  concern: "product-concern-filter-panel",
};

const sortOptions: FilterOption[] = [
  { value: "score-desc", label: "내 피부 추천순" },
  { value: "ingredient-desc", label: "성분 구성 높은 순" },
  { value: "price-asc", label: "가격 낮은 순" },
  { value: "price-desc", label: "가격 높은 순" },
  { value: "name-asc", label: "이름순" },
];

function filterHref(current: ProductFilterValues, key: keyof ProductFilterValues, value: string) {
  return buildProductCatalogHref({ ...current, [key]: value });
}

function advancedFilterCount(filters: ProductFilterValues) {
  return Number(Boolean(filters.ingredientId))
    + Number(Boolean(filters.minReviewScore))
    + Number(Boolean(filters.minFirepowerScore))
    + Number(filters.grade !== "전체 등급")
    + Number(Boolean(filters.maxPrice))
    + Number(filters.confidence !== "전체 근거")
    + Number(filters.order !== "score-desc");
}

export function ProductQuickFilters({ filters, ingredients, resultCount }: Props) {
  const [openPanel, setOpenPanel] = useState<FilterPanel | null>(null);
  const advancedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const concernTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedConcern = getProductConcernOption(filters.concern);
  const appliedAdvancedCount = advancedFilterCount(filters);

  useEffect(() => {
    if (!openPanel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const trigger = openPanel === "advanced"
        ? advancedTriggerRef.current
        : openPanel === "category"
          ? categoryTriggerRef.current
          : concernTriggerRef.current;
      setOpenPanel(null);
      trigger?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [openPanel]);

  function togglePanel(panel: FilterPanel) {
    setOpenPanel((current) => current === panel ? null : panel);
  }

  const triggerDefinitions: {
    axis: FilterPanel;
    label: string;
    shortLabel: string;
    value: string;
    selected: boolean;
    ref: typeof categoryTriggerRef;
  }[] = [
    {
      axis: "advanced",
      label: "필터",
      shortLabel: "필터",
      value: appliedAdvancedCount ? `${appliedAdvancedCount}개` : "",
      selected: appliedAdvancedCount > 0,
      ref: advancedTriggerRef,
    },
    {
      axis: "category",
      label: "제품 유형",
      shortLabel: "유형",
      value: filters.category,
      selected: filters.category !== "전체",
      ref: categoryTriggerRef,
    },
    {
      axis: "concern",
      label: "피부 고민",
      shortLabel: "고민",
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
      <div className={styles.toolbarRow}>
        <p className={styles.resultCount}><strong>{resultCount}</strong>개 제품</p>
        <div className={styles.triggerRow} role="group" aria-label="상품 탐색 필터">
          {triggerDefinitions.map((trigger) => {
            const expanded = openPanel === trigger.axis;
            return (
              <button
                key={trigger.axis}
                ref={trigger.ref}
                id={triggerIds[trigger.axis]}
                type="button"
                className={styles.trigger}
                data-axis={trigger.axis}
                data-has-value={Boolean(trigger.value) || undefined}
                data-selected={trigger.selected || undefined}
                aria-label={`${trigger.label}${trigger.value ? ` · ${trigger.value}` : ""}`}
                aria-expanded={expanded}
                aria-controls={panelIds[trigger.axis]}
                onClick={() => togglePanel(trigger.axis)}
              >
                {trigger.axis === "advanced" && <SlidersHorizontal size={15} aria-hidden="true" />}
                <span><span className={styles.fullLabel}>{trigger.label}</span><span className={styles.shortLabel}>{trigger.shortLabel}</span></span>
                <strong>{trigger.axis === "advanced" ? trigger.value.replace("개", "") : trigger.value}</strong>
                {trigger.axis !== "advanced" && <ChevronDown size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {openPanel && (
        <div
          id={panelIds[openPanel]}
          className={`${styles.panel} ${openPanel === "advanced" ? styles.advancedPanel : ""}`}
          role="region"
          aria-labelledby={triggerIds[openPanel]}
        >
          {openPanel === "advanced" ? (
            <div className={styles.advancedFilterList}>
              <FilterSection title="정렬" options={sortOptions} selected={filters.order} filters={filters} filterKey="order" onSelect={() => setOpenPanel(null)} />
              <FilterSection title="주요 성분" options={[{ label: "전체", value: "" }, ...ingredients.map((item) => ({ label: item.name, value: item.id }))]} selected={filters.ingredientId} filters={filters} filterKey="ingredientId" onSelect={() => setOpenPanel(null)} />
              <FilterSection title="리뷰 평점" options={[{ label: "전체", value: "" }, ...[70, 80, 90].map((score) => ({ label: `${score}점 이상`, value: String(score) }))]} selected={filters.minReviewScore} filters={filters} filterKey="minReviewScore" onSelect={() => setOpenPanel(null)} />
              <FilterSection title="화력 점수" options={[{ label: "전체", value: "" }, ...[50, 65, 80, 90].map((score) => ({ label: `${score}점 이상`, value: String(score) }))]} selected={filters.minFirepowerScore} filters={filters} filterKey="minFirepowerScore" onSelect={() => setOpenPanel(null)} />
              <FilterSection title="성분·적합 등급" options={["전체 등급", "1등급", "2등급", "3등급"].map((value) => ({ label: value, value }))} selected={filters.grade} filters={filters} filterKey="grade" onSelect={() => setOpenPanel(null)} />
              <FilterSection title="가격" options={[{ label: "전체", value: "" }, { label: "2만원 이하", value: "20000" }, { label: "3만원 이하", value: "30000" }, { label: "4만원 이하", value: "40000" }]} selected={filters.maxPrice} filters={filters} filterKey="maxPrice" onSelect={() => setOpenPanel(null)} />
              <FilterSection title="성분 자료 신뢰" options={[{ label: "전체", value: "전체 근거" }, { label: "높음", value: "HIGH" }, { label: "보통", value: "MEDIUM" }]} selected={filters.confidence} filters={filters} filterKey="confidence" onSelect={() => setOpenPanel(null)} />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, options, selected, filters, filterKey, onSelect }: {
  title: string;
  options: FilterOption[];
  selected: string;
  filters: ProductFilterValues;
  filterKey: keyof ProductFilterValues;
  onSelect: () => void;
}) {
  return (
    <section className={styles.filterSection} aria-labelledby={`product-filter-${filterKey}`}>
      <h3 id={`product-filter-${filterKey}`}>{title}</h3>
      <div className={styles.filterOptionGrid}>
        {options.map((option) => (
          <Link
            key={`${filterKey}-${option.value || "all"}`}
            href={filterHref(filters, filterKey, option.value)}
            scroll={false}
            aria-current={selected === option.value ? "page" : undefined}
            onClick={onSelect}
          >
            <span>{option.label}</span>
            {selected === option.value && <Check size={13} aria-hidden="true" />}
          </Link>
        ))}
      </div>
    </section>
  );
}
