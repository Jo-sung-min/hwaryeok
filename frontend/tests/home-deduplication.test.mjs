import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, homeProductListHref, orderHomeCategories } from "../src/lib/home-catalog.ts";

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

test("header keeps utility routes only and leaves primary journeys to the bottom navigation", () => {
  let pathname = "/";
  const { Header } = load("../src/components/navigation.tsx", { "next/navigation": { usePathname: () => pathname } });
  const render = () => renderToStaticMarkup(React.createElement(Header, { authSlot: React.createElement("a", { href: "/login" }, "로그인") }));
  const html = render();
  assert.match(html, /aria-label="보조 메뉴"/);
  assert.match(html, /href="\/ingredients"[^>]*>성분 사전/);
  assert.match(html, /href="\/promotions"[^>]*>화력 추천/);
  assert.match(html, /href="\/login"[^>]*>로그인/);
  assert.doesNotMatch(html, /href="\/(?:ranking(?:\/personal)?|products|reviewers|skin-check|my)"/);
  pathname = "/ingredients";
  assert.match(render(), /href="\/ingredients" aria-current="page"/);
});

test("bottom navigation retains every primary mobile journey", () => {
  const { BottomNav } = load("../src/components/navigation.tsx", {
    "next/navigation": { usePathname: () => "/", useRouter: () => ({ push() {} }) },
  });
  const html = renderToStaticMarkup(React.createElement(BottomNav));
  for (const href of ["/", "/ranking", "/skin-check", "/my"]) assert.match(html, new RegExp(`href="${href.replaceAll("/", "\\/")}"`));
  assert.match(html, /aria-controls="mobile-product-search"[^>]*>.*탐색/s);
});

for (const personalized of [false, true]) test(`home removes duplicate ranking without losing primary catalog (${personalized ? "member" : "guest"})`, async () => {
  let productQuery;
  let filterProps;
  const { HomeCatalog } = load("../src/components/home-catalog.tsx", {
    "@/lib/api": {
      getIngredientRankingOptions: async () => ({ categories: [{ name: "앰플", productCount: 1 }], ingredients: [{ id: "hyaluronic", name: "히알루론산", productCount: 1 }, { id: "unused", name: "미사용", productCount: 0 }] }),
      getProductPage: async query => { productQuery = query; return { content: [], totalElements: 0 }; },
      getRisingProductRanking: async () => ({ content: [] }), getWeeklyRanking: async () => null,
    },
    "@/lib/auth-session": {
      getCurrentSession: async () => personalized ? { nickname: "테스트" } : null,
      getOptionalSkinProfile: async () => personalized ? { configured: true, skinType: "복합성" } : null,
      getFavoriteViewState: async () => ({ favoriteIds: [] }),
    },
    "@/lib/home-catalog": { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, homeProductListHref, orderHomeCategories },
    "@/components/home-banner": { HomeBanner: () => React.createElement("div", null, "배너 유지") },
    "@/components/home-product-filters": { HomeProductFilters: props => { filterProps = props; return React.createElement("div", null, "상품 필터 유지"); } },
    "@/components/home-personalization": { HomePersonalization: () => React.createElement("div", null, "기존 피부 안내 유지") },
    "@/components/home-product-card": { HomeProductCard: () => null },
  });
  const requestedFilters = { category: "앰플", ingredientId: "hyaluronic", minReviewScore: 80, minFirepowerScore: 65 };
  const html = renderToStaticMarkup(await HomeCatalog({ requestedFilters }));
  assert.doesNotMatch(html, /id="personal-ranking"|href="#personal-ranking"|내 피부에 맞는 제품 랭킹|내 피부를 알려주면/);
  assert.match(html, /id="home-products"/);
  assert.match(html, /id="rising-ranking"/);
  assert.doesNotMatch(html, /aria-label="홈 상품 주제"|href="#home-products"|href="#rising-ranking"/);
  assert.match(html, /배너 유지/);
  assert.match(html, /기존 피부 안내 유지/);
  assert.match(html, /상품 필터 유지/);
  assert.ok(html.indexOf("기존 피부 안내 유지") < html.indexOf("배너 유지"));
  assert.doesNotMatch(html, /role="search"|home-product-search|제품명·브랜드 검색/);
  assert.doesNotMatch(html, /href="\/promotions"|새로운 브랜드를 만나는 화력 추천/);
  assert.match(html, /href="\/principles"/);
  assert.match(html, /아래 급상승 랭킹/);
  assert.equal(productQuery.sort, personalized ? "score" : "name");
  assert.equal(productQuery.ingredientId, "hyaluronic");
  assert.equal(productQuery.minReviewScore, 80);
  assert.equal(productQuery.minFirepowerScore, 65);
  assert.deepEqual(JSON.parse(JSON.stringify(filterProps.filters)), requestedFilters);
  assert.deepEqual(filterProps.ingredients.map(item => item.id), ["hyaluronic"]);
});

test("footer does not repeat the two utility destinations owned by the header", () => {
  const { Footer } = load("../src/components/footer.tsx", {});
  const html = renderToStaticMarkup(React.createElement(Footer));
  assert.doesNotMatch(html, /href="\/(?:ingredients|promotions)"/);
  assert.match(html, /href="\/compare"/);
  assert.match(html, /href="\/principles"/);
});
