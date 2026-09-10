import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

function cssDeclarations(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected a CSS rule for ${selector}`);
  return match[1];
}

function loadFilterComponent() {
  const relativePath = "../src/components/home-product-filters.tsx";
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      require("next/dist/compiled/babel/preset-typescript").default,
      [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }],
    ],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    require: (specifier) => {
      if (specifier === "react" || specifier === "react-dom" || specifier === "react/jsx-runtime" || specifier === "lucide-react") return require(specifier);
      if (specifier === "next/navigation") return { useRouter: () => ({ push() {} }) };
      if (specifier === "@/lib/home-catalog") return require("../src/lib/home-catalog.ts");
      if (specifier.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      throw new Error(`Unexpected filter dependency: ${specifier}`);
    },
  }, { filename });
  return localModule.exports.HomeProductFilters;
}

test("home product filter rail exposes four compact axes and their selected values", () => {
  const HomeProductFilters = loadFilterComponent();
  const html = renderToStaticMarkup(React.createElement(HomeProductFilters, {
    filters: { category: "토너", ingredientId: "niacinamide", minReviewScore: 80, minFirepowerScore: 65 },
    categories: [{ name: "토너", productCount: 5 }],
    ingredients: [{ id: "niacinamide", name: "나이아신아마이드", englishName: "Niacinamide", role: "피부 컨디셔닝", tags: [], productCount: 4 }],
    resultCount: 3,
  }));
  const text = html.replace(/<[^>]+>/g, "").replaceAll("&amp;", "&");
  for (const copy of ["종류 · 토너", "성분 · 나이아신아마이드", "리뷰 · 80점+", "화력 · 65점+"]) assert.ok(text.includes(copy));
  assert.doesNotMatch(text, /제품 유형 ·|주요 성분 ·|리뷰 평점 ·|화력 점수 ·/);
  assert.match(html, /aria-label="상품 필터, 4개 적용됨"/);
  assert.equal((html.match(/data-active="true"/g) ?? []).length, 4);
  assert.ok((html.match(/filterChipActive/g) ?? []).length >= 4);
});

test("home product filters render as one compact rail", () => {
  const HomeProductFilters = loadFilterComponent();
  const html = renderToStaticMarkup(React.createElement(HomeProductFilters, {
    filters: { category: "세럼", ingredientId: "ceramide-np", minReviewScore: null, minFirepowerScore: null },
    categories: [{ name: "세럼", productCount: 5 }],
    ingredients: [{ id: "ceramide-np", name: "세라마이드 NP", englishName: "Ceramide NP", role: "피부 보호", tags: [], productCount: 4 }],
    resultCount: 3,
  }));
  const rows = [...html.matchAll(/<div class="filterRailRow">([\s\S]*?)<\/div>/g)].map((match) => match[1]);

  assert.equal(rows.length, 1);
  assert.equal((rows[0].match(/<button\b/g) ?? []).length, 5);
  const labels = ["종류", "성분", "리뷰", "화력"];
  let previousIndex = -1;
  for (const label of labels) {
    const index = rows[0].indexOf(label);
    assert.ok(index > previousIndex, `${label} should appear in filter-axis order`);
    previousIndex = index;
  }
});

test("home filter rail is compact and cannot create a horizontal scrollbar", () => {
  const css = readFileSync(new URL("../src/components/home-catalog.module.css", import.meta.url), "utf8");
  const rail = cssDeclarations(css, ".filterRail");
  const row = cssDeclarations(css, ".filterRailRow");
  const controls = cssDeclarations(css, ".filterIconButton, .filterChip");
  const chipText = cssDeclarations(css, ".filterChip > span");
  const chipIcon = cssDeclarations(css, ".filterChip > svg");

  assert.match(rail, /min-width:\s*0/);
  assert.match(rail, /overflow:\s*(?:hidden|clip)/);
  assert.doesNotMatch(css, /\.filterRail\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(row, /display:\s*flex/);
  assert.match(row, /min-width:\s*0/);
  assert.doesNotMatch(css, /\.filterRailRow\s*\{[^}]*flex-wrap:\s*(?:wrap|wrap-reverse)/);
  assert.match(controls, /min-width:\s*0/);
  assert.match(controls, /min-height:\s*36px/);
  assert.match(chipText, /min-width:\s*0/);
  assert.match(chipText, /overflow:\s*hidden/);
  assert.match(chipText, /text-overflow:\s*ellipsis/);
  assert.match(chipText, /white-space:\s*nowrap/);
  assert.match(chipIcon, /(?:flex-shrink:\s*0|flex:\s*0\s+0\s+auto)/);
});

test("home filter active CSS uses the Hwaryeok pink palette and honors reduced motion", () => {
  const css = readFileSync(new URL("../src/components/home-catalog.module.css", import.meta.url), "utf8");
  assert.match(css, /\.filterChipActive\s*\{[^}]*border-color:\s*#d87896;[^}]*color:\s*#973153;[^}]*background:\s*#fff0f5;/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.filterBackdrop[\s\S]*\.filterSheet/);
});
