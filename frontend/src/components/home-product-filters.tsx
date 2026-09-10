"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { IngredientRankingCategory, IngredientRankingOption } from "@/lib/types";
import {
  EMPTY_HOME_CATALOG_FILTERS,
  HOME_FIREPOWER_SCORE_OPTIONS,
  HOME_REVIEW_SCORE_OPTIONS,
  homeCatalogHref,
  type HomeCatalogFilters,
} from "@/lib/home-catalog";
import styles from "./home-catalog.module.css";

type FilterTab = "category" | "ingredient" | "review" | "firepower";

type Props = {
  filters: HomeCatalogFilters;
  categories: IngredientRankingCategory[];
  ingredients: IngredientRankingOption[];
  resultCount: number;
};

const tabs: { id: FilterTab; label: string }[] = [
  { id: "category", label: "제품 유형" },
  { id: "ingredient", label: "주요 성분" },
  { id: "review", label: "리뷰 평점" },
  { id: "firepower", label: "화력 점수" },
];

function equalFilters(left: HomeCatalogFilters, right: HomeCatalogFilters) {
  return left.category === right.category
    && left.ingredientId === right.ingredientId
    && left.minReviewScore === right.minReviewScore
    && left.minFirepowerScore === right.minFirepowerScore;
}

export function HomeProductFilters({ filters, categories, ingredients, resultCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("category");
  const [draft, setDraft] = useState<HomeCatalogFilters>(filters);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const selectedIngredient = ingredients.find((item) => item.id === filters.ingredientId);
  const draftIngredient = ingredients.find((item) => item.id === draft.ingredientId);
  const activeCount = Number(Boolean(filters.category))
    + Number(Boolean(filters.ingredientId))
    + Number(filters.minReviewScore != null)
    + Number(filters.minFirepowerScore != null);
  const hasDraftChanges = !equalFilters(draft, filters);
  const visibleIngredients = useMemo(() => {
    const query = ingredientQuery.trim().toLocaleLowerCase("ko-KR");
    if (!query) return ingredients;
    return ingredients.filter((item) => `${item.name} ${item.englishName} ${item.role}`.toLocaleLowerCase("ko-KR").includes(query));
  }, [ingredientQuery, ingredients]);

  useEffect(() => {
    if (!open) setDraft(filters);
  }, [filters, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const appShell = document.querySelector<HTMLElement>(".app-shell");
    const shellWasInert = appShell?.hasAttribute("inert") ?? false;
    document.body.style.overflow = "hidden";
    appShell?.setAttribute("inert", "");
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
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

  function show(tab: FilterTab, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setDraft(filters);
    setIngredientQuery("");
    setActiveTab(tab);
    setOpen(true);
  }

  function close() {
    setDraft(filters);
    setIngredientQuery("");
    setOpen(false);
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

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? tabs.length - 1
      : direction ? (index + direction + tabs.length) % tabs.length
      : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    document.getElementById(`home-filter-tab-${tabs[nextIndex].id}`)?.focus();
  }

  function apply() {
    router.push(homeCatalogHref(draft, "home-products"), { scroll: false });
    setOpen(false);
  }

  const chipDefinitions: { id: FilterTab; label: string; shortLabel: string; value: string; active: boolean }[] = [
    { id: "category", label: "제품 유형", shortLabel: "종류", value: filters.category, active: Boolean(filters.category) },
    { id: "ingredient", label: "주요 성분", shortLabel: "성분", value: selectedIngredient?.name ?? "", active: Boolean(selectedIngredient) },
    { id: "review", label: "리뷰 평점", shortLabel: "리뷰", value: filters.minReviewScore == null ? "" : `${filters.minReviewScore}점+`, active: filters.minReviewScore != null },
    { id: "firepower", label: "화력 점수", shortLabel: "화력", value: filters.minFirepowerScore == null ? "" : `${filters.minFirepowerScore}점+`, active: filters.minFirepowerScore != null },
  ];

  return <>
    <div className={styles.filterRail} role="group" aria-label="상품 필터">
      <div className={styles.filterRailRow}>
        <button type="button" className={`${styles.filterIconButton} ${activeCount ? styles.filterChipActive : ""}`} onClick={(event) => show("category", event)} aria-haspopup="dialog" aria-expanded={open} aria-controls="home-product-filter-sheet" aria-label={`상품 필터${activeCount ? `, ${activeCount}개 적용됨` : " 열기"}`}>
          <SlidersHorizontal size={15} aria-hidden="true" />
          {activeCount > 0 && <span>{activeCount}</span>}
        </button>
        {chipDefinitions.map((chip) => <button key={chip.id} type="button" className={`${styles.filterChip} ${chip.active ? styles.filterChipActive : ""}`} data-active={chip.active || undefined} onClick={(event) => show(chip.id, event)} aria-haspopup="dialog" aria-expanded={open && activeTab === chip.id} aria-controls="home-product-filter-sheet" aria-label={`${chip.label}${chip.value ? ` · ${chip.value}` : ""}`} title={`${chip.label}${chip.value ? ` · ${chip.value}` : ""}`}>
          <span>{chip.shortLabel}{chip.value && <strong> · {chip.value}</strong>}</span><ChevronDown size={12} aria-hidden="true" />
        </button>)}
      </div>
    </div>

    {open && createPortal(<div className={styles.filterBackdrop} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} id="home-product-filter-sheet" className={styles.filterSheet} role="dialog" aria-modal="true" aria-labelledby="home-product-filter-title" onKeyDown={trapFocus}>
        <header className={styles.filterSheetHeader}>
          <h3 id="home-product-filter-title">상품 필터</h3>
          <button type="button" onClick={() => setDraft(EMPTY_HOME_CATALOG_FILTERS)} className={styles.filterReset}><RotateCcw size={15} aria-hidden="true" /> 초기화</button>
          <button ref={closeButtonRef} type="button" onClick={close} className={styles.filterClose} aria-label="필터 닫기"><X size={22} /></button>
        </header>

        <div className={styles.filterTabs} role="tablist" aria-label="필터 항목">
          {tabs.map((tab, index) => <button key={tab.id} id={`home-filter-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls="home-filter-panel" tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => moveTab(event, index)}>{tab.label}</button>)}
        </div>

        <div className={styles.draftSummary} aria-label="선택한 필터">
          {draft.category && <button type="button" aria-label={`제품 유형 ${draft.category} 필터 해제`} onClick={() => setDraft((current) => ({ ...current, category: "" }))}>제품 유형 · {draft.category}<X size={12} aria-hidden="true" /></button>}
          {draftIngredient && <button type="button" aria-label={`주요 성분 ${draftIngredient.name} 필터 해제`} onClick={() => setDraft((current) => ({ ...current, ingredientId: "" }))}>주요 성분 · {draftIngredient.name}<X size={12} aria-hidden="true" /></button>}
          {draft.minReviewScore != null && <button type="button" aria-label={`리뷰 ${draft.minReviewScore}점 이상 필터 해제`} onClick={() => setDraft((current) => ({ ...current, minReviewScore: null }))}>리뷰 · {draft.minReviewScore}점+<X size={12} aria-hidden="true" /></button>}
          {draft.minFirepowerScore != null && <button type="button" aria-label={`화력 ${draft.minFirepowerScore}점 이상 필터 해제`} onClick={() => setDraft((current) => ({ ...current, minFirepowerScore: null }))}>화력 · {draft.minFirepowerScore}점+<X size={12} aria-hidden="true" /></button>}
          {!draft.category && !draftIngredient && draft.minReviewScore == null && draft.minFirepowerScore == null && <span>선택된 조건이 없어요.</span>}
        </div>

        <div id="home-filter-panel" className={styles.filterSheetBody} role="tabpanel" aria-labelledby={`home-filter-tab-${activeTab}`}>
          {activeTab === "category" && <FilterChoiceGroup legend="제품 유형" value={draft.category} options={[{ value: "", label: "전체" }, ...categories.map((item) => ({ value: item.name, label: item.name, count: item.productCount }))]} onChange={(category) => setDraft((current) => ({ ...current, category }))} />}
          {activeTab === "ingredient" && <>
            <label className={styles.ingredientSearch}><Search size={16} aria-hidden="true" /><span className="sr-only">주요 성분 검색</span><input value={ingredientQuery} onChange={(event) => setIngredientQuery(event.target.value)} placeholder="성분 이름 검색" /></label>
            <FilterChoiceGroup legend="주요 성분" value={draft.ingredientId} options={[{ value: "", label: "전체" }, ...visibleIngredients.map((item) => ({ value: item.id, label: item.name, count: item.productCount }))]} onChange={(ingredientId) => setDraft((current) => ({ ...current, ingredientId }))} emptyMessage="검색 결과에 맞는 성분이 없어요." />
          </>}
          {activeTab === "review" && <FilterChoiceGroup legend="리뷰 평점" value={draft.minReviewScore == null ? "" : String(draft.minReviewScore)} options={[{ value: "", label: "전체" }, ...HOME_REVIEW_SCORE_OPTIONS.map((score) => ({ value: String(score), label: `${score}점 이상` }))]} onChange={(value) => setDraft((current) => ({ ...current, minReviewScore: value ? Number(value) : null }))} note="사용자 리뷰 평균은 100점 만점이며, 리뷰가 없는 제품은 평점 조건에서 제외돼요." />}
          {activeTab === "firepower" && <FilterChoiceGroup legend="화력 점수" value={draft.minFirepowerScore == null ? "" : String(draft.minFirepowerScore)} options={[{ value: "", label: "전체" }, ...HOME_FIREPOWER_SCORE_OPTIONS.map((score) => ({ value: String(score), label: `${score}점 이상` }))]} onChange={(value) => setDraft((current) => ({ ...current, minFirepowerScore: value ? Number(value) : null }))} note="로그인 후 피부 설정을 저장하면 나에게 맞춘 화력 점수를 기준으로 골라요." />}
        </div>

        <footer className={styles.filterSheetFooter}>
          <button type="button" className={styles.filterApply} onClick={apply}>{hasDraftChanges ? "선택 적용" : `${resultCount.toLocaleString("ko-KR")}개 상품 보기`}</button>
        </footer>
      </div>
    </div>, document.body)}
  </>;
}

function FilterChoiceGroup({ legend, value, options, onChange, note, emptyMessage }: {
  legend: string;
  value: string;
  options: { value: string; label: string; count?: number }[];
  onChange: (value: string) => void;
  note?: string;
  emptyMessage?: string;
}) {
  return <fieldset className={styles.filterChoices}>
    <legend>{legend}</legend>
    {note && <p>{note}</p>}
    <div>
      {options.map((option) => <label key={`${legend}-${option.value || "all"}`} className={value === option.value ? styles.filterChoiceSelected : undefined}>
        <input type="radio" name={`home-${legend}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span className={styles.filterRadio} aria-hidden="true">{value === option.value && <Check size={12} />}</span>
        <strong>{option.label}</strong>
        {option.count != null && <small>{option.count.toLocaleString("ko-KR")}</small>}
      </label>)}
    </div>
    {options.length === 1 && emptyMessage && <p role="status" className={styles.filterEmpty}>{emptyMessage}</p>}
  </fieldset>;
}
