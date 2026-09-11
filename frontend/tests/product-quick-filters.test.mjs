import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildProductCatalogHref,
  buildProductQuickFilterHref,
  readProductCatalogState,
} from "../src/lib/product-catalog.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const pageSource = read("../src/app/products/page.tsx");
const quickFilterSource = read("../src/app/products/product-quick-filters.tsx");
const quickFilterCss = read("../src/app/products/product-quick-filters.module.css");

test("catalog uses one compact filter, product type, and concern row", () => {
  assert.match(pageSource, /<ProductQuickFilters filters=\{filters\} ingredients=\{ingredients\} resultCount=\{productPage\.totalElements\} \/>/);
  assert.doesNotMatch(pageSource, /<CategoryNavigation/);
  assert.doesNotMatch(pageSource, /<ConcernNavigation/);
  assert.doesNotMatch(pageSource, /<ProductSort/);
  assert.doesNotMatch(pageSource, /<MobileFilters/);
  assert.match(quickFilterSource, /label: "필터"/);
  assert.match(quickFilterSource, /label: "제품 유형"/);
  assert.match(quickFilterSource, /label: "피부 고민"/);
  assert.ok(quickFilterSource.indexOf('label: "필터"') < quickFilterSource.indexOf('label: "제품 유형"'));
  assert.ok(quickFilterSource.indexOf('label: "제품 유형"') < quickFilterSource.indexOf('label: "피부 고민"'));
  assert.equal((quickFilterSource.match(/aria-expanded=\{expanded\}/g) ?? []).length, 1);
  assert.match(quickFilterSource, /<SlidersHorizontal size=\{15\}/);
  assert.match(quickFilterCss, /grid-template-columns:\s*auto repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(quickFilterCss, /\.trigger\[data-axis="advanced"\][\s\S]*?min-width:\s*69px/);
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

test("sorting lives inside the immediate filter panel without a separate apply control", () => {
  assert.match(quickFilterSource, /openPanel === "advanced"/);
  assert.match(quickFilterSource, /<FilterSection title="정렬"/);
  assert.match(quickFilterSource, /value: "score-desc", label: "내 피부 추천순"/);
  assert.match(quickFilterSource, /value: "price-asc", label: "가격 낮은 순"/);
  assert.match(quickFilterSource, /href=\{filterHref\(filters, filterKey, option\.value\)\}/);
  assert.doesNotMatch(quickFilterSource, /<select/);
  assert.doesNotMatch(quickFilterSource, />적용</);
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

  const defaultSortUrl = new URL(buildProductQuickFilterHref({ ...filters, order: "score-desc" }, "category", "세럼"), "http://hwaryeok.local");
  assert.equal(defaultSortUrl.searchParams.has("order"), false);

  const sortUrl = new URL(buildProductCatalogHref({ ...filters, order: "price-desc" }), "http://hwaryeok.local");
  assert.equal(sortUrl.searchParams.get("order"), "price-desc");
  assert.equal(sortUrl.searchParams.get("query"), "다이브인");
  assert.equal(sortUrl.searchParams.get("category"), "토너");
  assert.equal(sortUrl.searchParams.get("concern"), "붉은기·민감");
  assert.equal(sortUrl.searchParams.get("ingredientId"), "niacinamide");
  assert.equal(sortUrl.searchParams.has("page"), false);
});

test("quick filter opens downward without gradients and honors reduced-motion preferences", () => {
  assert.match(quickFilterCss, /@keyframes quick-filter-open/);
  assert.match(quickFilterCss, /max-height:\s*0/);
  assert.match(quickFilterCss, /--panel-max-height:\s*min\(62dvh,\s*520px\)/);
  assert.match(quickFilterCss, /overflow-y:\s*auto/);
  assert.match(quickFilterCss, /overscroll-behavior:\s*contain/);
  assert.match(quickFilterCss, /@media \(max-width: 420px\)/);
  assert.match(quickFilterCss, /min-height:\s*46px/);
  assert.match(quickFilterCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(quickFilterCss, /animation:\s*none/);
  assert.doesNotMatch(quickFilterCss, /gradient/i);
});
