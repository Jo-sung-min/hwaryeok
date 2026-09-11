"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import styles from "./ranking-filter-sheet.module.css";

export type RankingFilterVariant = "ingredients" | "personal" | "rising" | "reviewers";

export type RankingFilterOption = {
  value: string;
  label: string;
  chipLabel?: string;
  count?: number;
  keywords?: string;
};

export type RankingFilterAxis = {
  id: string;
  param: string;
  label: string;
  shortLabel: string;
  value: string;
  defaultValue?: string;
  options: RankingFilterOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  note?: string;
};

type Props = {
  variant: RankingFilterVariant;
  basePath: string;
  axes: RankingFilterAxis[];
  resultCount: number;
};

function valuesFromAxes(axes: RankingFilterAxis[]) {
  return Object.fromEntries(axes.map((axis) => [axis.id, axis.value]));
}

function equalValues(left: Record<string, string>, right: Record<string, string>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => left[key] === right[key]);
}

function filterHref(basePath: string, axes: RankingFilterAxis[], values: Record<string, string>) {
  const search = new URLSearchParams();
  axes.forEach((axis) => {
    const value = values[axis.id] ?? axis.defaultValue ?? "";
    if (value && value !== (axis.defaultValue ?? "")) search.set(axis.param, value);
  });
  return search.size ? `${basePath}?${search}` : basePath;
}

export function RankingFilterSheet({ variant, basePath, axes, resultCount }: Props) {
  const router = useRouter();
  const currentValues = useMemo(() => valuesFromAxes(axes), [axes]);
  const [draft, setDraft] = useState<Record<string, string>>(currentValues);
  const [activeAxisId, setActiveAxisId] = useState(axes[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const dialogId = `${variant}-ranking-filter-sheet`;
  const activeAxis = axes.find((axis) => axis.id === activeAxisId) ?? axes[0];
  const activeCount = axes.filter((axis) => axis.value !== (axis.defaultValue ?? "")).length;
  const hasDraftChanges = !equalValues(draft, currentValues);

  useEffect(() => {
    if (!open) setDraft(currentValues);
  }, [currentValues, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const appShell = document.querySelector<HTMLElement>(".app-shell");
    const shellWasInert = appShell?.hasAttribute("inert") ?? false;
    document.body.style.overflow = "hidden";
    appShell?.setAttribute("inert", "");
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchQuery("");
        setOpen(false);
      }
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

  if (!axes.length || !activeAxis) return null;

  function show(axisId: string, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setDraft(currentValues);
    setActiveAxisId(axisId);
    setSearchQuery("");
    setOpen(true);
  }

  function close() {
    setDraft(currentValues);
    setSearchQuery("");
    setOpen(false);
  }

  function reset() {
    setDraft(Object.fromEntries(axes.map((axis) => [axis.id, axis.defaultValue ?? ""])));
    setSearchQuery("");
  }

  function apply() {
    router.push(filterHref(basePath, axes, draft), { scroll: false });
    setOpen(false);
  }

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
    ) ?? [])].filter((element) => element.offsetParent !== null);
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
      : event.key === "End" ? axes.length - 1
      : direction ? (index + direction + axes.length) % axes.length
      : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    setActiveAxisId(axes[nextIndex].id);
    setSearchQuery("");
    document.getElementById(`${variant}-ranking-filter-tab-${axes[nextIndex].id}`)?.focus();
  }

  const query = searchQuery.trim().toLocaleLowerCase("ko-KR");
  const visibleOptions = activeAxis.options.filter((option) => !query
    || `${option.label} ${option.keywords ?? ""}`.toLocaleLowerCase("ko-KR").includes(query));

  return <div className={styles.root} data-ranking-filter={variant}>
    <div className={styles.rail} role="group" aria-label="랭킹 필터">
      <button type="button" className={`${styles.iconButton} ${activeCount ? styles.active : ""}`} onClick={(event) => show(axes[0].id, event)} aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} aria-label={`랭킹 필터${activeCount ? `, ${activeCount}개 적용됨` : " 열기"}`}>
        <SlidersHorizontal size={15} aria-hidden="true" />
        {activeCount > 0 && <span>{activeCount}</span>}
      </button>
      {axes.map((axis) => {
        const defaultValue = axis.defaultValue ?? "";
        const selected = axis.options.find((option) => option.value === axis.value);
        const isActive = axis.value !== defaultValue;
        const selectedLabel = isActive ? selected?.chipLabel ?? selected?.label ?? axis.value : "";
        return <button key={axis.id} type="button" className={`${styles.chip} ${isActive ? styles.active : ""}`} data-active={isActive || undefined} onClick={(event) => show(axis.id, event)} aria-haspopup="dialog" aria-expanded={open && activeAxisId === axis.id} aria-controls={dialogId} aria-label={`${axis.label}${selectedLabel ? ` · ${selectedLabel}` : ""}`} title={`${axis.label}${selectedLabel ? ` · ${selectedLabel}` : ""}`}>
          <span>{axis.shortLabel}{selectedLabel && <strong> · {selectedLabel}</strong>}</span><ChevronDown size={12} aria-hidden="true" />
        </button>;
      })}
    </div>

    {open && createPortal(<div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} id={dialogId} className={styles.sheet} data-multi-axis={axes.length > 1 || undefined} data-ranking-filter={variant} role="dialog" aria-modal="true" aria-labelledby={`${dialogId}-title`} onKeyDown={trapFocus}>
        <header className={styles.header}>
          <h3 id={`${dialogId}-title`}>랭킹 필터</h3>
          <button type="button" onClick={reset} className={styles.reset}><RotateCcw size={15} aria-hidden="true" /> 초기화</button>
          <button ref={closeButtonRef} type="button" onClick={close} className={styles.close} aria-label="필터 닫기"><X size={22} /></button>
        </header>

        {axes.length > 1 && <div className={styles.tabs} role="tablist" aria-label="필터 항목">
          {axes.map((axis, index) => <button key={axis.id} id={`${variant}-ranking-filter-tab-${axis.id}`} type="button" role="tab" aria-selected={activeAxis.id === axis.id} aria-controls={`${dialogId}-panel`} tabIndex={activeAxis.id === axis.id ? 0 : -1} onClick={() => { setActiveAxisId(axis.id); setSearchQuery(""); }} onKeyDown={(event) => moveTab(event, index)}>{axis.label}</button>)}
        </div>}

        <div className={styles.summary} aria-label="선택한 필터">
          {axes.flatMap((axis) => {
            const value = draft[axis.id] ?? axis.defaultValue ?? "";
            if (value === (axis.defaultValue ?? "")) return [];
            const selected = axis.options.find((option) => option.value === value);
            return <button key={axis.id} type="button" aria-label={`${axis.label} ${selected?.label ?? value} 필터 해제`} onClick={() => setDraft((current) => ({ ...current, [axis.id]: axis.defaultValue ?? "" }))}>{axis.label} · {selected?.chipLabel ?? selected?.label ?? value}<X size={12} aria-hidden="true" /></button>;
          })}
          {axes.every((axis) => (draft[axis.id] ?? axis.defaultValue ?? "") === (axis.defaultValue ?? "")) && <span>선택된 조건이 없어요.</span>}
        </div>

        <div id={`${dialogId}-panel`} className={styles.body} role={axes.length > 1 ? "tabpanel" : undefined} aria-labelledby={axes.length > 1 ? `${variant}-ranking-filter-tab-${activeAxis.id}` : undefined}>
          {activeAxis.searchable && <label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">{activeAxis.label} 검색</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={activeAxis.searchPlaceholder ?? `${activeAxis.label} 검색`} /></label>}
          <fieldset className={styles.choices}>
            <legend>{activeAxis.label}</legend>
            {activeAxis.note && <p>{activeAxis.note}</p>}
            <div>
              {visibleOptions.map((option) => {
                const selected = (draft[activeAxis.id] ?? activeAxis.defaultValue ?? "") === option.value;
                return <label key={`${activeAxis.id}-${option.value || "all"}`} className={selected ? styles.choiceSelected : undefined}>
                  <input type="radio" name={`${variant}-${activeAxis.id}`} value={option.value} checked={selected} onChange={() => setDraft((current) => ({ ...current, [activeAxis.id]: option.value }))} />
                  <span className={styles.radio} aria-hidden="true">{selected && <Check size={12} />}</span>
                  <strong>{option.label}</strong>
                  {option.count != null && <small>{option.count.toLocaleString("ko-KR")}</small>}
                </label>;
              })}
            </div>
            {visibleOptions.length === 0 && <p role="status" className={styles.empty}>검색 결과가 없어요.</p>}
          </fieldset>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.apply} onClick={apply}>{hasDraftChanges ? "선택 적용" : `${resultCount.toLocaleString("ko-KR")}개 결과 보기`}</button>
        </footer>
      </div>
    </div>, document.body)}
  </div>;
}
