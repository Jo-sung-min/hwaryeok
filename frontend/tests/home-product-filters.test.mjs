import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

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

test("home product filter rail exposes four branded axes and their selected values", () => {
  const HomeProductFilters = loadFilterComponent();
  const html = renderToStaticMarkup(React.createElement(HomeProductFilters, {
    filters: { category: "토너", ingredientId: "niacinamide", minReviewScore: 80, minFirepowerScore: 65 },
    categories: [{ name: "토너", productCount: 5 }],
    ingredients: [{ id: "niacinamide", name: "나이아신아마이드", englishName: "Niacinamide", role: "피부 컨디셔닝", tags: [], productCount: 4 }],
    resultCount: 3,
  }));
  const text = html.replace(/<[^>]+>/g, "").replaceAll("&amp;", "&");
  for (const copy of ["제품 유형 · 토너", "주요 성분 · 나이아신아마이드", "리뷰 평점 · 80점+", "화력 점수 · 65점+"]) assert.ok(text.includes(copy));
  assert.match(html, /aria-label="상품 필터, 4개 적용됨"/);
  assert.equal((html.match(/data-active="true"/g) ?? []).length, 4);
  assert.ok((html.match(/filterChipActive/g) ?? []).length >= 4);
});

test("home filter active CSS uses the Hwaryeok pink palette and honors reduced motion", () => {
  const css = readFileSync(new URL("../src/components/home-catalog.module.css", import.meta.url), "utf8");
  assert.match(css, /\.filterChipActive\s*\{[^}]*border-color:\s*#d87896;[^}]*color:\s*#973153;[^}]*background:\s*#fff0f5;/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.filterBackdrop[\s\S]*\.filterSheet/);
});
