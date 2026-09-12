import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const typescript = require("next/dist/compiled/babel/preset-typescript").default;
const react = require("next/dist/compiled/babel/preset-react").default;
const commonjs = require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default;
const homeCatalogCss = readFileSync(new URL("../src/components/home-catalog.module.css", import.meta.url), "utf8");
const homePersonalizationCss = readFileSync(new URL("../src/components/home-personalization.module.css", import.meta.url), "utf8");
const moduleCache = new Map();
const realModules = new Map([
  ["@/lib/home-catalog", "../src/lib/home-catalog.ts"],
  ["@/lib/home-personalization", "../src/lib/home-personalization.ts"],
  ["@/lib/skin-check", "../src/lib/skin-check.ts"],
  ["@/lib/skin-tendency-assets", "../src/lib/skin-tendency-assets.ts"],
  ["@/components/review-petal-rating", "../src/components/review-petal-rating.tsx"],
]);

// Render the actual component JSX and pure helpers without a Next server or account.
// Only framework UI boundaries are replaced; no filesystem output or API calls occur.
function loadSource(relativePath) {
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath);
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { code } = transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [typescript, [react, { runtime: "automatic" }]],
    plugins: [commonjs],
  });
  const localModule = { exports: {} };
  const isolatedRequire = (specifier) => {
    if (realModules.has(specifier)) return loadSource(realModules.get(specifier));
    if (specifier === "react") return require(specifier);
    if (specifier === "react/jsx-runtime") return require(specifier);
    if (specifier === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
    if (specifier === "lucide-react") return new Proxy({}, {
      get: (_, name) => name === "__esModule" ? true : ({ size, ...props }) => React.createElement("svg", { ...props, "data-icon": name }),
    });
    if (specifier.endsWith(".module.css")) return {
      __esModule: true,
      default: new Proxy({}, { get: (_, name) => String(name) }),
    };
    if (specifier === "@/components/product-ui") return {
      ProductVisual: ({ alt }) => React.createElement("span", { role: "img", "aria-label": alt }),
      FavoriteButton: ({ productId, initialFavorited, isAuthenticated, returnTo }) => React.createElement("button", {
        "aria-label": "찜",
        "data-product-id": productId,
        "data-favorited": initialFavorited,
        "data-authenticated": isAuthenticated,
        "data-return-to": returnTo,
      }),
    };
    throw new Error(`Unapproved render-test dependency: ${specifier}`);
  };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    require: isolatedRequire,
    URLSearchParams,
  }, { filename });
  moduleCache.set(relativePath, localModule.exports);
  return localModule.exports;
}

const { HomePersonalization } = loadSource("../src/components/home-personalization.tsx");
const { HomeProductCard } = loadSource("../src/components/home-product-card.tsx");
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const visibleText = (html) => html.replace(/<[^>]+>/g, "");
const user = { id: "private-user-id", email: "private@example.invalid", nickname: "테스트 사용자", role: "USER", authMethod: "LOCAL" };
const savedProfile = {
  configured: true, skinType: "수부지", hydrationLevel: "LOW", oilinessLevel: "HIGH", sensitivityLevel: "MEDIUM",
  concerns: ["private-concern"], reactionTriggers: ["private-trigger"], createdAt: "private-created-at",
};
const product = (extra = {}) => ({
  id: "ampoule", brand: "테스트 브랜드", name: "수분 앰플", category: "앰플", tone: "blue",
  score: 87, price: "23,000원", publicationStatus: "PUBLISHED", confidenceLevel: "HIGH",
  matchReasons: ["부족한 수분을 고려한 성분 조합이에요.", "두 번째 내부 근거"], ...extra,
});

test("guest panel keeps the main message and a single skin-check action without revealing orphaned profile answers", () => {
  for (const profile of [null, savedProfile]) {
    const html = render(HomePersonalization, { user: null, profile });
    const text = visibleText(html);
    assert.match(html, /data-personalization="guest"/);
    assert.match(html, /href="\/skin-check"[^>]*>나의 성분찾기/);
    assert.match(text, /다른 사람의 1위보다,.*내 피부에 맞는 1위/);
    assert.match(text, /피부 답변으로 내 피부 타입과 성분/);
    assert.doesNotMatch(html, /성분 직접 고르기|수부지|수분 부족|유분 많음/);
  }
});

test("logged-in but unconfigured users get the save prompt, never a personalized claim", () => {
  const html = render(HomePersonalization, { user, profile: { ...savedProfile, configured: false } });
  assert.match(html, /data-personalization="needs-profile"/);
  assert.match(visibleText(html), /나의 성분찾기 결과를 계정에 저장할 수 있어요/);
  assert.match(html, /href="\/skin-check"/);
  assert.doesNotMatch(html, /저장된 피부 타입|수부지|수분 부족/);
});

test("personalized panel shows a compact saved skin type and opens editing directly", () => {
  const html = render(HomePersonalization, { user, profile: savedProfile });
  const text = visibleText(html);
  assert.match(html, /data-personalization="personalized"/);
  assert.match(html, /aria-label="수부지 경향 설정 수정"/);
  for (const copy of ["다른 사람의 1위보다", "내 피부에 맞는 1위", "저장된 피부 타입", "수부지 경향", "수정"]) assert.ok(text.includes(copy));
  assert.match(html, /href="\/skin-check"/);
  assert.doesNotMatch(text, /수분 부족|유분 많음|민감도 보통|맞춤 화력은 어떻게/);
  assert.doesNotMatch(html, /private-user-id|private@example|private-concern|private-trigger|private-created-at/);
});

test("personalized panel selects the watercolor board asset for every saved skin tendency", () => {
  const tendencies = [
    ["건성", "dry"],
    ["지성", "oily"],
    ["복합성", "combination"],
    ["수부지", "dehydrated-oily"],
    ["중성", "balanced"],
    ["민감", "sensitive"],
  ];

  for (const [skinType, asset] of tendencies) {
    const html = render(HomePersonalization, { user, profile: { ...savedProfile, skinType } });
    assert.match(html, new RegExp(`data-skin-asset="${asset}"`), skinType);
    assert.match(visibleText(html), new RegExp(`${skinType} 경향`), skinType);
    assert.match(html, new RegExp(`<span class="emblem" aria-hidden="true"><span class="tendencyAsset" data-skin-asset="${asset}"></span></span>`), skinType);
    assert.doesNotMatch(html, /data-icon="(?:Flower2|Droplets)"/, skinType);
  }
});

test("skin tendency asset aliases and unknown values resolve without a broken board cell", () => {
  const { skinTendencyAssetKey } = loadSource("../src/lib/skin-tendency-assets.ts");
  assert.equal(skinTendencyAssetKey("민감성"), "sensitive");
  assert.equal(skinTendencyAssetKey(" 민감성 "), "sensitive");
  assert.equal(skinTendencyAssetKey("알 수 없음"), "default");
  assert.equal(skinTendencyAssetKey(null), "default");
  assert.equal(skinTendencyAssetKey(undefined), "default");

  const alias = render(HomePersonalization, { user, profile: { ...savedProfile, skinType: "민감성" } });
  assert.match(alias, /data-skin-asset="sensitive"/);
  assert.match(visibleText(alias), /민감성 경향/);

  const unknown = render(HomePersonalization, { user, profile: { ...savedProfile, skinType: "알 수 없음" } });
  assert.match(unknown, /data-skin-asset="default"/);
  assert.match(visibleText(unknown), /알 수 없음 경향/);
});

test("skin tendency board CSS keeps every sprite position, fallback, and mobile motion rules", () => {
  const { SKIN_TENDENCY_ASSET_BOARD_SRC } = loadSource("../src/lib/skin-tendency-assets.ts");
  assert.equal(SKIN_TENDENCY_ASSET_BOARD_SRC, "/skin/skin-tendency-board.png");
  const assetRule = homePersonalizationCss.match(/(?:^|\n)\.tendencyAsset\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.notEqual(assetRule, "");
  assert.ok(assetRule.includes(`url("${SKIN_TENDENCY_ASSET_BOARD_SRC}")`));
  assert.match(assetRule, /background-repeat:\s*no-repeat/);
  assert.match(assetRule, /background-size:\s*300%\s+200%/);

  for (const [asset, position] of [
    ["dry", "0% 0%"],
    ["oily", "50% 0%"],
    ["combination", "100% 0%"],
    ["dehydrated-oily", "0% 100%"],
    ["balanced", "50% 100%"],
    ["sensitive", "100% 100%"],
  ]) {
    const escapedPosition = position.replaceAll("%", "\\%").replace(" ", "\\s+");
    assert.match(homePersonalizationCss, new RegExp(`\\.tendencyAsset\\[data-skin-asset="${asset}"\\]\\s*\\{[^}]*background-position:\\s*${escapedPosition}`), asset);
  }

  const fallbackRule = homePersonalizationCss.match(/\.tendencyAsset\[data-skin-asset="default"\]\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(fallbackRule, /url\("\/brand\/hwaryeok-flower-mark\.png"\)/);
  assert.match(fallbackRule, /background-position:\s*center/);
  assert.match(fallbackRule, /background-size:\s*contain/);
  assert.match(homePersonalizationCss, /@media\s*\(max-width:\s*430px\)[\s\S]*?\.tendencyAsset\s*\{[^}]*width:\s*34px;[^}]*height:\s*34px;/);
  assert.match(homePersonalizationCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.profileSummary,\s*\.tendencyAsset\s*\{[^}]*transition:\s*none;/);
});

test("incomplete saved settings do not invent a missing skin type", () => {
  const partial = render(HomePersonalization, { user, profile: { configured: true, oilinessLevel: "BALANCED" } });
  assert.match(partial, /피부 설정 완료/);
  assert.doesNotMatch(partial, /유분 균형|수분 부족|민감도 낮음|건성/);
  const empty = render(HomePersonalization, { user, profile: { configured: true } });
  assert.match(empty, /피부 설정 완료/);
  assert.doesNotMatch(empty, /<ul|<li>/);
});

test("saved text remains escaped text instead of executable markup", () => {
  const html = render(HomePersonalization, { user, profile: { configured: true, skinType: "<script>alert(1)</script>" } });
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("personalized product card renders score, first recommendation reason, and rank", () => {
  const html = render(HomeProductCard, { product: product(), rank: 2, scoreLabel: "맞춤 화력" });
  const text = visibleText(html);
  assert.match(html, /aria-label="2위"/);
  assert.match(text, /맞춤 화력87 \/ 100/);
  assert.match(text, /추천 이유부족한 수분을 고려한 성분 조합이에요/);
  assert.match(text, /23,000원/);
  assert.doesNotMatch(text, /두 번째 내부 근거|성분 근거가 충분하지 않아/);
});

test("home product card keeps brand and product name inside the image card", () => {
  const html = render(HomeProductCard, { product: product() });
  const imageCard = html.match(/<div class="productImage">([\s\S]*?)<\/div><div class="productText">/)?.[1] ?? "";
  assert.notEqual(imageCard, "");
  assert.match(imageCard, /class="imageInfo"/);
  assert.match(imageCard, /테스트 브랜드 · 앰플/);
  assert.match(imageCard, /<h3>수분 앰플<\/h3>/);
});

test("recommendation reason reserves two text lines so adjacent home cards stay aligned", () => {
  const rule = homeCatalogCss.match(/(?:^|\n)\.matchReason p \{([^}]*)\}/)?.[1] ?? "";
  assert.notEqual(rule, "");
  assert.match(rule, /-webkit-line-clamp:\s*2/);
  assert.match(rule, /min-height:\s*3\.3em/);
  assert.match(rule, /overflow:\s*hidden/);
});

test("LOW and LEGACY confidence show a caution and missing reasons use honest fallback copy", () => {
  for (const confidenceLevel of ["LOW", "LEGACY"]) {
    const html = render(HomeProductCard, { product: product({ confidenceLevel, matchReasons: [] }), scoreLabel: "맞춤 화력" });
    const text = visibleText(html);
    assert.match(text, /상세 페이지에서 성분 자료와 점수 기준을 확인/);
    assert.match(text, /성분 근거가 충분하지 않아 추가 확인이 필요/);
  }
});

test("ordinary product cards do not present a personalized score or reason", () => {
  const html = render(HomeProductCard, { product: product({ confidenceLevel: "LOW" }) });
  assert.match(html, /수분 앰플/);
  assert.doesNotMatch(visibleText(html), /맞춤 화력|87 \/ 100|추천 이유|부족한 수분|성분 근거가 충분하지 않아/);
});

test("product details are safely encoded and favorite state and return location are forwarded", () => {
  const html = render(HomeProductCard, {
    product: product({ id: "a/b ?" }), favorited: true, isAuthenticated: true, returnTo: "/?category=앰플",
  });
  assert.match(html, /href="\/products\/a%2Fb%20%3F"/);
  assert.match(html, /data-product-id="a\/b \?"/);
  assert.match(html, /data-favorited="true"/);
  assert.match(html, /data-authenticated="true"/);
  assert.match(html, /data-return-to="\/\?category=앰플"/);
});

test("rising cards distinguish recent review score and count growth from personalized score", () => {
  const html = render(HomeProductCard, {
    product: product(), growth: { recentReviewCount: 5, previousReviewCount: 2, reviewGrowth: 3 }, review: { score: 82.25, count: 5 },
  });
  const text = visibleText(html);
  assert.match(text, /\+3 리뷰 증가/);
  assert.match(text, /이전 7일 2 → 최근 7일 5개/);
  assert.match(text, /최근 7일 리뷰 82\.3 \/ 100 \(5\)/);
  assert.match(html, /data-petal-count="4"/);
  assert.doesNotMatch(text, /맞춤 화력|추천 이유/);
  const pending = render(HomeProductCard, { product: product(), review: { score: null, count: 0 } });
  assert.match(visibleText(pending), /리뷰 0개 · 점수 집계 중/);
});
