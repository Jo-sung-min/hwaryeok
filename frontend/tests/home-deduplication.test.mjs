import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, homeProductListHref, orderHomeCategories } from "../src/lib/home-catalog.ts";
import { rankingHref } from "../src/lib/ingredient-ranking.ts";

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

for (const personalized of [false, true]) test(`home keeps the primary catalog and adds compact ranking previews (${personalized ? "member" : "guest"})`, async () => {
  const productQueries = [];
  let filterProps;
  const { HomeCatalog } = load("../src/components/home-catalog.tsx", {
    "@/lib/api": {
      getIngredientRankingOptions: async () => ({ categories: [{ name: "앰플", productCount: 1 }], ingredients: [{ id: "hyaluronic", name: "히알루론산", productCount: 1 }, { id: "unused", name: "미사용", productCount: 0 }] }),
      getProductPage: async query => { productQueries.push(query); return { content: [], totalElements: 0 }; },
      getRisingProductRanking: async () => ({ content: [] }), getWeeklyRanking: async () => null,
      getIngredientRanking: async () => ({ content: [], categories: [], totalElements: 0, page: 0, size: 4, totalPages: 0, hasNext: false }),
      getReviewerRanking: async () => ({ content: [], totalElements: 0, page: 0, size: 4, totalPages: 0, hasNext: false }),
    },
    "@/lib/auth-session": {
      getCurrentSession: async () => personalized ? { nickname: "테스트" } : null,
      getOptionalSkinProfile: async () => personalized ? { configured: true, skinType: "복합성" } : null,
      getFavoriteViewState: async () => ({ favoriteIds: [] }),
    },
    "@/lib/home-catalog": { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, homeProductListHref, orderHomeCategories },
    "@/lib/ingredient-ranking": { rankingHref },
    "@/components/home-banner": { HomeBanner: () => React.createElement("div", null, "배너 유지") },
    "@/components/home-ranking-carousel": { HomeRankingCarousel: ({ children }) => React.createElement("div", { "data-ranking-carousel": true }, children) },
    "@/components/home-product-filters": { HomeProductFilters: props => { filterProps = props; return React.createElement("div", null, "상품 필터 유지"); } },
    "@/components/home-personalization": { HomePersonalization: () => React.createElement("div", null, "기존 피부 안내 유지") },
    "@/components/home-product-card": { HomeProductCard: () => null },
    "@/components/ingredient-ranking-card": { IngredientRankingCard: () => null },
    "@/components/reviewer-firepower": { ReviewerFirepower: () => null },
  });
  const requestedFilters = { category: "앰플", ingredientId: "hyaluronic", minReviewScore: 80, minFirepowerScore: 65 };
  const html = renderToStaticMarkup(await HomeCatalog({ requestedFilters }));
  assert.match(html, /id="home-products"/);
  for (const kind of ["personal", "ingredients", "rising", "reviewers"]) assert.match(html, new RegExp(`data-ranking-preview="${kind}"`));
  for (const href of ["/ranking/personal", "/ranking", "/ranking/rising", "/reviewers"]) assert.match(html, new RegExp(`href="${href.replaceAll("/", "\\/")}`));
  assert.doesNotMatch(html, /aria-label="홈 상품 주제"|href="#home-products"|href="#rising-ranking"/);
  assert.match(html, /배너 유지/);
  assert.match(html, /기존 피부 안내 유지/);
  assert.match(html, /상품 필터 유지/);
  assert.ok(html.indexOf("기존 피부 안내 유지") < html.indexOf("배너 유지"));
  assert.doesNotMatch(html, /role="search"|home-product-search|제품명·브랜드 검색/);
  assert.doesNotMatch(html, /href="\/promotions"|새로운 브랜드를 만나는 화력 추천/);
  assert.match(html, /href="\/principles"/);
  const catalogQuery = productQueries.find(query => query.ingredientId === "hyaluronic" && query.minReviewScore === 80);
  assert.ok(catalogQuery);
  assert.equal(catalogQuery.sort, personalized ? "score" : "name");
  assert.equal(catalogQuery.minFirepowerScore, 65);
  assert.deepEqual(JSON.parse(JSON.stringify(filterProps.filters)), requestedFilters);
  assert.deepEqual(filterProps.ingredients.map(item => item.id), ["hyaluronic"]);
});

test("footer does not repeat the two utility destinations owned by the header", () => {
  const { Footer } = load("../src/components/footer.tsx", {});
  const html = renderToStaticMarkup(React.createElement(Footer));
  assert.doesNotMatch(html, /href="\/(?:ingredients|promotions)"/);
  assert.match(html, /href="\/compare"/);
  assert.match(html, /href="\/principles"/);
  assert.match(html, /<details/);
  assert.match(html, /사업자·고객센터 정보/);
  assert.doesNotMatch(html, /시작하기|알아보기|실제 사용자 리뷰와 함께 비교/);
  assert.doesNotMatch(html, /href="\/(?:ranking|products|reviewers)/);
  assert.doesNotMatch(html, /의료적 진단/);
  assert.equal((html.match(/HWA:RYEOK/g) ?? []).length, 1);
});
