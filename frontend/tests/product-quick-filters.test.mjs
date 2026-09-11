import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildProductQuickFilterHref,
  readProductCatalogState,
} from "../src/lib/product-catalog.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const pageSource = read("../src/app/products/page.tsx");
const quickFilterSource = read("../src/app/products/product-quick-filters.tsx");
const quickFilterCss = read("../src/app/products/product-quick-filters.module.css");

test("catalog uses one compact two-button quick filter instead of two permanent option rows", () => {
  assert.match(pageSource, /<ProductQuickFilters filters=\{filters\} \/>/);
  assert.doesNotMatch(pageSource, /<CategoryNavigation/);
  assert.doesNotMatch(pageSource, /<ConcernNavigation/);
  assert.match(quickFilterSource, /label: "제품 유형"/);
  assert.match(quickFilterSource, /label: "피부 고민"/);
  assert.equal((quickFilterSource.match(/aria-expanded=\{expanded\}/g) ?? []).length, 1);
  assert.match(quickFilterCss, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test("quick filter disclosure exposes only the chosen inline panel with accessible relationships", () => {
  assert.match(quickFilterSource, /setOpenPanel\(\(current\) => current === panel \? null : panel\)/);
  assert.match(quickFilterSource, /\{openPanel && \(/);
  assert.match(quickFilterSource, /role="region"/);
  assert.match(quickFilterSource, /aria-labelledby=\{triggerIds\[openPanel\]\}/);
  assert.match(quickFilterSource, /aria-controls=\{panelIds\[trigger\.axis\]\}/);
  assert.match(quickFilterSource, /event\.key !== "Escape"/);
  assert.match(quickFilterSource, /trigger\?\.focus\(\)/);
  assert.match(quickFilterSource, /aria-current=\{selected \? "page" : undefined\}/);
});

test("quick filter links preserve other catalog settings and only concern selection clears free text", () => {
  const filters = readProductCatalogState({
    query: "다이브인",
    category: "토너",
    grade: "2",
    ingredientId: "niacinamide",
    minReviewScore: "80",
    minFirepowerScore: "65",
    concern: "붉은기·민감",
    maxPrice: "30000",
    confidence: "HIGH",
    order: "price-asc",
  }).filters;

  const categoryUrl = new URL(buildProductQuickFilterHref(filters, "category", "세럼"), "http://hwaryeok.local");
  assert.equal(categoryUrl.searchParams.get("category"), "세럼");
  assert.equal(categoryUrl.searchParams.get("query"), "다이브인");
  assert.equal(categoryUrl.searchParams.get("concern"), "붉은기·민감");
  assert.equal(categoryUrl.searchParams.get("ingredientId"), "niacinamide");
  assert.equal(categoryUrl.searchParams.get("order"), "price-asc");
  assert.equal(categoryUrl.searchParams.has("page"), false);

  const concernUrl = new URL(buildProductQuickFilterHref(filters, "concern", "탄력·잔주름"), "http://hwaryeok.local");
  assert.equal(concernUrl.searchParams.get("concern"), "탄력·잔주름");
  assert.equal(concernUrl.searchParams.has("query"), false);
  assert.equal(concernUrl.searchParams.get("category"), "토너");
  assert.equal(concernUrl.searchParams.get("minReviewScore"), "80");
  assert.equal(concernUrl.searchParams.get("maxPrice"), "30000");
});

test("quick filter opens downward without gradients and honors reduced-motion preferences", () => {
  assert.match(quickFilterCss, /@keyframes quick-filter-open/);
  assert.match(quickFilterCss, /max-height:\s*0/);
  assert.match(quickFilterCss, /max-height:\s*420px/);
  assert.match(quickFilterCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(quickFilterCss, /animation:\s*none/);
  assert.doesNotMatch(quickFilterCss, /gradient/i);
});
