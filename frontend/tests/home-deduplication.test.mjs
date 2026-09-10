import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, orderHomeCategories } from "../src/lib/home-catalog.ts";

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(new URL(path, import.meta.url), "utf8"), {
    filename: path, babelrc: false, configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default, [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }]],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, URLSearchParams, require: name => {
    if (name in mocks) return mocks[name];
    if (name === "next/link") return ({ children, scroll, ...props }) => React.createElement("a", props, children);
    if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (["react", "react/jsx-runtime", "lucide-react"].includes(name)) return require(name);
    throw Error("Unexpected dependency: " + name);
  } });
  return module.exports;
}

test("home header removes only the duplicate skin shortcut, keeping login and other routes intact", () => {
  let pathname = "/";
  const { Header } = load("../src/components/navigation.tsx", { "next/navigation": { usePathname: () => pathname } });
  const render = () => renderToStaticMarkup(React.createElement(Header, { authSlot: React.createElement("a", { href: "/login" }, "로그인") }));
  assert.doesNotMatch(render(), /내 피부 맞춤/);
  assert.match(render(), /로그인/);
  pathname = "/products";
  assert.match(render(), /내 피부 맞춤/);
});

for (const personalized of [false, true]) test(`home removes duplicate ranking without losing primary catalog (${personalized ? "member" : "guest"})`, async () => {
  let productQuery;
  const { HomeCatalog } = load("../src/components/home-catalog.tsx", {
    "@/lib/api": {
      getIngredientRankingOptions: async () => ({ categories: [{ name: "앰플", productCount: 1 }] }),
      getProductPage: async query => { productQuery = query; return { content: [], totalElements: 0 }; },
      getRisingProductRanking: async () => ({ content: [] }), getWeeklyRanking: async () => null,
    },
    "@/lib/auth-session": {
      getCurrentSession: async () => personalized ? { nickname: "테스트" } : null,
      getOptionalSkinProfile: async () => personalized ? { configured: true, skinType: "복합성" } : null,
      getFavoriteViewState: async () => ({ favoriteIds: [] }),
    },
    "@/lib/home-catalog": { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, orderHomeCategories },
    "@/components/home-banner": { HomeBanner: () => React.createElement("div", null, "배너 유지") },
    "@/components/home-personalization": { HomePersonalization: () => React.createElement("div", null, "기존 피부 안내 유지") },
    "@/components/home-product-card": { HomeProductCard: () => null },
  });
  const html = renderToStaticMarkup(await HomeCatalog({ category: "앰플" }));
  assert.doesNotMatch(html, /id="personal-ranking"|href="#personal-ranking"|내 피부에 맞는 제품 랭킹|내 피부를 알려주면/);
  assert.match(html, /id="home-products"/);
  assert.match(html, /id="rising-ranking"/);
  assert.match(html, /배너 유지/);
  assert.match(html, /기존 피부 안내 유지/);
  assert.match(html, /아래 급상승 랭킹/);
  assert.equal(productQuery.sort, personalized ? "score" : "name");
});
