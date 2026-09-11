import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  comparisonSearch,
  filterCompareProducts,
  replaceComparisonProduct,
} from "../src/lib/compare-products.ts";

const products = [
  {
    id: "heartleaf-toner",
    brand: "아누아",
    name: "어성초 77 수딩 토너",
    category: "토너",
  },
  {
    id: "birch-cream",
    brand: "라운드랩",
    name: "자작나무 수분 크림",
    category: "크림",
  },
  {
    id: "niacinamide-serum",
    brand: "COSRX",
    name: "The Niacinamide 15 Serum",
    category: "세럼",
  },
];

test("compare picker searches product name and brand within the selected category", () => {
  assert.deepEqual(
    filterCompareProducts(products, "어성초", "").map((product) => product.id),
    ["heartleaf-toner"],
  );
  assert.deepEqual(
    filterCompareProducts(products, "cosrx", "").map((product) => product.id),
    ["niacinamide-serum"],
  );
  assert.deepEqual(
    filterCompareProducts(products, "serum", "세럼").map((product) => product.id),
    ["niacinamide-serum"],
  );
  assert.deepEqual(filterCompareProducts(products, "어성초", "크림"), []);
  assert.equal(filterCompareProducts(products, "", "").length, products.length);
});

test("choosing an already compared product swaps positions without duplicates", () => {
  const selectedIds = ["heartleaf-toner", "birch-cream", "niacinamide-serum"];

  assert.deepEqual(
    replaceComparisonProduct(selectedIds, 0, "niacinamide-serum"),
    ["niacinamide-serum", "birch-cream", "heartleaf-toner"],
  );
  assert.deepEqual(
    replaceComparisonProduct(selectedIds, 1, "new-product"),
    ["heartleaf-toner", "new-product", "niacinamide-serum"],
  );
  assert.deepEqual(selectedIds, ["heartleaf-toner", "birch-cream", "niacinamide-serum"]);
});

test("comparison query preserves left, right, and optional third order", () => {
  assert.equal(
    comparisonSearch(["heartleaf-toner", "birch-cream"]).toString(),
    "left=heartleaf-toner&right=birch-cream",
  );
  assert.equal(
    comparisonSearch(["heartleaf-toner", "birch-cream", "niacinamide-serum"]).toString(),
    "left=heartleaf-toner&right=birch-cream&third=niacinamide-serum",
  );
});

test("compare selector exposes a searchable, accessible bottom-sheet dialog", () => {
  const selector = readFileSync(new URL("../src/app/compare/compare-selectors.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/app/compare/compare-selectors.module.css", import.meta.url), "utf8");

  assert.match(selector, /createPortal/);
  assert.match(selector, /role="dialog"/);
  assert.match(selector, /aria-modal="true"/);
  assert.match(selector, /aria-haspopup="dialog"/);
  assert.match(selector, /제품[^"']*검색/);
  assert.match(selector, /검색 결과[^"']*없/);
  assert.match(selector, /Escape/);
  assert.doesNotMatch(selector, /<select\b/);
  assert.match(styles, /position:\s*fixed/);
  assert.match(styles, /inset:\s*(?:auto\s+)?0\s+0|bottom:\s*0/);
});
