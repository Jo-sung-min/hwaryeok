import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const home = read("../src/components/home-catalog.tsx");
const homeCarousel = read("../src/components/home-ranking-carousel.tsx");
const homeCarouselCss = read("../src/components/home-ranking-carousel.module.css");
const rankingFilter = read("../src/components/ranking-filter-sheet.tsx");
const rankingFilterCss = read("../src/components/ranking-filter-sheet.module.css");
const ingredientRanking = read("../src/components/ingredient-ranking-explorer.tsx");
const personalRanking = read("../src/app/ranking/personal/page.tsx");
const risingRanking = read("../src/app/ranking/rising/page.tsx");
const reviewerRanking = read("../src/app/reviewers/page.tsx");

function declarations(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected a CSS rule for ${selector}`);
  return match[1];
}

function loadHomeRankingCarousel() {
  const filename = fileURLToPath(new URL("../src/components/home-ranking-carousel.tsx", import.meta.url));
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
      if (["react", "react/jsx-runtime", "lucide-react"].includes(specifier)) return require(specifier);
      if (specifier.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      throw new Error(`Unexpected carousel dependency: ${specifier}`);
    },
  }, { filename });
  return localModule.exports.HomeRankingCarousel;
}

function previewSource(kind) {
  const marker = `data-ranking-preview="${kind}"`;
  const start = home.indexOf(marker);
  assert.notEqual(start, -1, `Expected the ${kind} ranking preview on home`);
  const next = home.indexOf("data-ranking-preview=", start + marker.length);
  return home.slice(start, next === -1 ? home.length : next);
}

test("home exposes every ranking tab as an honest four-item preview", () => {
  assert.match(home, /HOME_RANKING_PREVIEW_LIMIT\s*=\s*4/);

  const expected = {
    personal: /href=\{personalRankingHref\}/,
    ingredients: /href=\{ingredientRankingHref\}/,
    rising: /href=\{risingRankingHref\}/,
    reviewers: /href=["']\/reviewers["']/,
  };

  for (const [kind, href] of Object.entries(expected)) {
    const source = previewSource(kind);
    assert.match(source, /(?:data-preview-limit="4"|previewLimit=\{HOME_RANKING_PREVIEW_LIMIT\})/, `${kind} needs an explicit four-item list contract`);
    assert.match(source, /<PreviewHeading\b/, `${kind} needs a compact full-ranking heading`);
    assert.match(source, href, `${kind} full-ranking action should open the matching ranking tab`);
  }

  assert.match(home, /function PreviewHeading[\s\S]*?>전체보기\s*</);
  for (const path of ["/ranking/personal", "/ranking", "/ranking/rising", "/reviewers"]) assert.ok(home.includes(path));
  const limitUsages = home.match(/HOME_RANKING_PREVIEW_LIMIT/g) ?? [];
  assert.ok(limitUsages.length >= 5, "The shared top-four limit should be applied, not merely declared");
  assert.match(previewSource("personal"), /\{profile\s*\?/);
  assert.match(previewSource("personal"), /피부 답변을 저장하면/);
  assert.doesNotMatch(previewSource("personal"), /가짜 점수|샘플 점수|임시 점수/);
});

test("home ranking previews show two items per page across exactly two slides", () => {
  assert.match(home, /HomeRankingCarousel/);
  assert.equal((home.match(/<HomeRankingCarousel\b/g) ?? []).length, 4);
  assert.equal((home.match(/itemCount=\{/g) ?? []).length, 4);
  assert.equal((home.match(/previewLimit=\{HOME_RANKING_PREVIEW_LIMIT\}/g) ?? []).length, 4);
  assert.match(homeCarousel, /ITEMS_PER_PAGE\s*=\s*2/);
  assert.match(homeCarousel, /Math\.ceil\((?:visibleItemCount|itemCount)\s*\/\s*ITEMS_PER_PAGE\)/);
  assert.match(homeCarousel, /data-ranking-carousel/);
  assert.match(homeCarousel, /data-items-per-page="2"/);
  assert.match(homeCarousel, /role="region"/);
  assert.match(homeCarousel, /aria-label=/);

  const viewport = declarations(homeCarouselCss, ".viewport");
  assert.match(viewport, /overflow-x:\s*auto/);
  assert.match(viewport, /scroll-snap-type:\s*x\s+mandatory/);
  assert.match(viewport, /grid-auto-flow:\s*column/);
  assert.match(viewport, /grid-auto-columns:\s*calc\(\(100%\s*-\s*var\(--carousel-gap\)\)\s*\/\s*2\)/);
  assert.match(homeCarouselCss, /scroll-snap-align:\s*start/);
});

test("home ranking carousel has labelled navigation, page state, and motion safeguards", () => {
  assert.match(homeCarousel, /aria-label=[^\n]*(?:이전|앞)/);
  assert.match(homeCarousel, /aria-label=[^\n]*(?:다음|뒤)/);
  assert.match(homeCarousel, /disabled=\{[^}]*(?:(?:currentPage|page)\s*===\s*0|!canGoPrevious)/);
  assert.match(homeCarousel, /disabled=\{[^}]*(?:(?:currentPage|page)\s*(?:>=|===)\s*pageCount\s*-\s*1|!canGoNext)/);
  assert.match(homeCarousel, /(?:currentPage|page)\s*\+\s*1/);
  assert.match(homeCarousel, /pageCount/);
  assert.match(homeCarousel, /useId\(\)/);
  assert.equal((homeCarousel.match(/aria-controls=\{trackId\}/g) ?? []).length, 2);
  assert.match(homeCarousel, /aria-live="polite"/);
  assert.match(homeCarouselCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(homeCarouselCss, /scroll-behavior:\s*auto/);
});

test("four rendered items expose two pages while short and ordered lists keep correct semantics", () => {
  const HomeRankingCarousel = loadHomeRankingCarousel();
  const items = Array.from({ length: 4 }, (_, index) => React.createElement("article", { key: index }, `상품 ${index + 1}`));
  const html = renderToStaticMarkup(React.createElement(HomeRankingCarousel, {
    label: "급상승 랭킹",
    itemCount: items.length,
    previewLimit: 4,
    children: items,
  }));
  assert.match(html, /role="region"[^>]*aria-roledescription="carousel"[^>]*aria-label="급상승 랭킹"/);
  assert.match(html, /data-items-per-page="2"/);
  assert.match(html, /data-preview-limit="4"/);
  const previousButton = html.match(/<button[^>]*aria-label="급상승 랭킹 이전 2개"[^>]*>/)?.[0] ?? "";
  const nextButton = html.match(/<button[^>]*aria-label="급상승 랭킹 다음 2개"[^>]*>/)?.[0] ?? "";
  assert.match(previousButton, /disabled/);
  assert.ok(nextButton);
  assert.doesNotMatch(nextButton, /disabled/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html.replace(/<[^>]+>/g, ""), /1\s*\/\s*2.*총 2페이지 중 1페이지/);

  const short = renderToStaticMarkup(React.createElement(HomeRankingCarousel, {
    label: "내 피부 랭킹",
    itemCount: 2,
    previewLimit: 4,
    children: items.slice(0, 2),
  }));
  assert.doesNotMatch(short, /이전 2개|다음 2개|aria-live/);

  const ordered = renderToStaticMarkup(React.createElement(HomeRankingCarousel, {
    label: "리뷰어 랭킹",
    itemCount: 4,
    previewLimit: 4,
    ordered: true,
    children: items,
  }));
  assert.match(ordered, /<ol\b/);
  assert.doesNotMatch(ordered, /<div[^>]*role="list"/);
});

test("all ranking tabs use the common minimal filter sheet with the right axes", () => {
  const routes = [
    [ingredientRanking, "ingredients", ["성분", "종류", "정렬"]],
    [personalRanking, "personal", ["성분", "종류", "리뷰", "맞춤화력"]],
    [risingRanking, "rising", ["종류"]],
    [reviewerRanking, "reviewers", ["피부타입"]],
  ];

  for (const [source, variant, axes] of routes) {
    assert.match(source, /RankingFilterSheet/);
    assert.match(source, new RegExp(`variant=["']${variant}["']`));
    for (const axis of axes) assert.ok(source.includes(axis), `${variant} filter needs the ${axis} axis`);
  }

  assert.match(rankingFilter, /data-ranking-filter=\{variant\}/);
  assert.match(rankingFilter, /(?:const\s+dialogId\s*=\s*`\$\{variant\}-ranking-filter-sheet`[\s\S]*id=\{dialogId\}|id=\{`\$\{variant\}-ranking-filter-sheet`\})/);
  assert.match(rankingFilter, /role="dialog"/);
  assert.match(rankingFilter, /aria-modal="true"/);
  assert.match(rankingFilter, />랭킹 필터</);
  assert.match(rankingFilter, /aria-haspopup="dialog"/);
  assert.match(rankingFilter, /data-active=/);
  for (const action of ["초기화", "필터 닫기", "적용"]) assert.ok(rankingFilter.includes(action));
});

test("ranking filter sheet preserves modal keyboard and scroll behavior", () => {
  assert.match(rankingFilter, /event\.key\s*===\s*["']Escape["']/);
  assert.match(rankingFilter, /document\.body\.style\.overflow\s*=\s*["']hidden["']/);
  assert.match(rankingFilter, /previousOverflow/);
  assert.match(rankingFilter, /querySelectorAll<HTMLElement>/);
  assert.match(rankingFilter, /event\.key\s*!==\s*["']Tab["']/);
  assert.match(rankingFilter, /event\.target\s*===\s*event\.currentTarget/);

  const rail = declarations(rankingFilterCss, ".rail");
  const sheet = declarations(rankingFilterCss, ".sheet");
  assert.match(rail, /min-width:\s*0/);
  assert.match(rail, /overflow:\s*(?:hidden|clip)/);
  assert.match(sheet, /(?:position:\s*(?:fixed|absolute)[^}]*inset:[^;}]*auto[^;}]*0|bottom:\s*0)/s);
  assert.match(sheet, /max-height:\s*min\([^)]*dvh/);
  assert.match(sheet, /background:\s*#fff/);
});

test("ranking routes keep only their supported filter query keys", () => {
  for (const key of ["ingredientId", "category", "minReviewScore", "minFirepowerScore"]) {
    assert.ok(personalRanking.includes(key), `personal ranking should retain ${key}`);
  }
  const filterCall = (source, variant) => {
    const start = source.indexOf("<RankingFilterSheet");
    const variantAt = source.indexOf(`variant="${variant}"`, start);
    assert.notEqual(start, -1, `Expected ${variant} filter sheet usage`);
    assert.notEqual(variantAt, -1, `Expected the ${variant} filter variant`);
    const end = source.indexOf("/>", variantAt);
    assert.notEqual(end, -1, `Expected ${variant} filter sheet to close`);
    return source.slice(start, end);
  };
  const ingredientCall = filterCall(ingredientRanking, "ingredients");
  for (const key of ["ingredient", "category", "sort"]) assert.match(ingredientCall, new RegExp(`param:\\s*["']${key}["']`));
  const risingCall = filterCall(risingRanking, "rising");
  assert.match(risingCall, /param:\s*["']category["']/);
  assert.doesNotMatch(risingCall, /minReviewScore|minFirepowerScore/);
  const reviewerCall = filterCall(reviewerRanking, "reviewers");
  assert.match(reviewerCall, /param:\s*["']skinType["']/);
});
