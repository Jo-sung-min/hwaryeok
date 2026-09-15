import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const typesSource = read("../src/lib/types.ts");
const apiSource = read("../src/lib/api.ts");
const seoSource = read("../src/lib/seo.ts");
const sitemapSource = read("../src/app/sitemap.ts");
const adminPageSource = read("../src/app/admin/seo/page.tsx");
const adminErrorSource = read("../src/app/admin/seo/error.tsx");
const adminFormSource = read("../src/app/admin/seo/seo-page-form.tsx");
const adminActionsSource = read("../src/app/admin/seo/actions.ts");
const adminDashboardSource = read("../src/app/admin/page.tsx");

const managedPages = [
  ["../src/app/page.tsx", "HOME"],
  ["../src/app/products/page.tsx", "PRODUCTS"],
  ["../src/app/promotions/page.tsx", "PROMOTIONS"],
  ["../src/app/ranking/page.tsx", "RANKING"],
  ["../src/app/compare/page.tsx", "COMPARE"],
  ["../src/app/ingredients/page.tsx", "INGREDIENTS"],
  ["../src/app/experts/page.tsx", "EXPERTS"],
  ["../src/app/experts/ranking/page.tsx", "EXPERT_RANKING"],
  ["../src/app/questions/page.tsx", "QUESTIONS"],
  ["../src/app/reviewers/page.tsx", "REVIEWERS"],
  ["../src/app/principles/page.tsx", "PRINCIPLES"],
  ["../src/app/skin-check/page.tsx", "SKIN_CHECK"],
  ["../src/app/ranking/rising/page.tsx", "RISING_RANKING"],
];

function loadSeo({ pageResult, pagesResult, rejectPage = false, rejectPages = false } = {}) {
  const filename = fileURLToPath(new URL("../src/lib/seo.ts", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    require: (specifier) => {
      if (specifier === "server-only") return {};
      if (specifier === "@/lib/api") return {
        getSeoPage: async () => rejectPage ? Promise.reject(new Error("offline")) : pageResult,
        getSeoPages: async () => rejectPages ? Promise.reject(new Error("offline")) : pagesResult ?? [],
      };
      throw new Error(`Unexpected SEO dependency: ${specifier}`);
    },
    URL,
    AbortSignal,
    Date,
    Number,
    Map,
    Set,
  }, { filename });
  return localModule.exports;
}

function loadSitemap({ getProductPage, getIngredients, getExperts, resolveSeoPages }) {
  const filename = fileURLToPath(new URL("../src/app/sitemap.ts", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    require: (specifier) => {
      if (specifier === "@/lib/api") return { getProductPage, getIngredients, getExperts };
      if (specifier === "@/lib/seo") return { resolveSeoPages };
      throw new Error(`Unexpected sitemap dependency: ${specifier}`);
    },
    URL,
    AbortSignal,
    Date,
    Number,
    Map,
    process: { env: { NEXT_PUBLIC_SITE_URL: "https://hwaryeok.test" } },
  }, { filename });
  return localModule.exports.default;
}

test("SEO contracts expose the fixed page keys and public/admin API routes", () => {
  for (const [, pageKey] of managedPages) assert.match(typesSource, new RegExp(`\\| \\"${pageKey}\\"`));
  assert.match(typesSource, /export type SeoPageSetting\s*=\s*\{/);
  assert.match(typesSource, /export type SeoPageUpdateInput\s*=\s*Pick/);

  assert.match(apiSource, /requestJson<SeoPageSetting>\(`\/seo\/pages\/\$\{encodeURIComponent\(pageKey\)\}`/);
  assert.match(apiSource, /requestJson<SeoPageSetting\[]>\("\/seo\/pages"/);
  assert.match(apiSource, /requestJson<SeoPageSetting\[]>\("\/admin\/seo\/pages"/);
  assert.match(apiSource, /`\/admin\/seo\/pages\/\$\{encodeURIComponent\(pageKey\)\}`/);
  assert.match(apiSource, /method:\s*"PUT"/);
  assert.match(apiSource, /SEO_PAGES_CACHE_TAG/);
  assert.match(apiSource, /cache:\s*"force-cache"/);
  assert.match(apiSource, /next:\s*\{\s*revalidate:\s*3600,\s*tags:\s*\[SEO_PAGES_CACHE_TAG\]/);
  const publicSeoApiSource = apiSource.slice(apiSource.indexOf("export function getSeoPage"), apiSource.indexOf("export function getAdminSeoPages"));
  assert.equal(publicSeoApiSource.match(/signal:\s*AbortSignal\.timeout\(5000\)/g)?.length, 2);
  assert.match(apiSource, /getIngredients\(query:\s*IngredientQuery\s*=\s*\{\},\s*init\?:\s*RequestInit\)/);
  assert.match(apiSource, /requestJson<IngredientPage>\(`\/ingredients\?\$\{search\}`,\s*init\)/);
  assert.match(apiSource, /getExperts\(topic\?:\s*string,\s*init\?:\s*RequestInit\)/);
  assert.match(apiSource, /requestJson<Expert\[]>\(`\/experts\$\{search\}`,\s*init\)/);
});

test("managed metadata uses exact admin titles, fixed canonical paths, and complete social metadata", async () => {
  const pageResult = {
    pageKey: "PRODUCTS",
    path: "https://untrusted.example/wrong",
    displayName: "변경된 경로 이름",
    title: "관리자가 정한 정확한 제목",
    description: "관리자가 정한 검색 설명",
    keywords: ["성분", "화장품"],
    indexable: false,
    followLinks: false,
    ogTitle: "관리자가 정한 공유 제목",
    ogDescription: "관리자가 정한 공유 설명",
    ogImageUrl: "/seo/products.png",
    includeInSitemap: false,
    changeFrequency: "MONTHLY",
    priority: 0.4,
    updatedAt: "2026-09-13T00:00:00Z",
  };
  const { buildManagedSeoMetadata } = loadSeo({ pageResult });
  const metadata = await buildManagedSeoMetadata("PRODUCTS");

  assert.equal(metadata.title.absolute, pageResult.title);
  assert.equal(metadata.alternates.canonical, "/products");
  assert.equal(metadata.description, pageResult.description);
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.follow, false);
  assert.equal(metadata.openGraph.title, pageResult.ogTitle);
  assert.equal(metadata.openGraph.description, pageResult.ogDescription);
  assert.equal(metadata.openGraph.url, "/products");
  assert.equal(metadata.openGraph.images[0].url, pageResult.ogImageUrl);
  assert.equal(metadata.twitter.title, pageResult.ogTitle);
  assert.equal(metadata.twitter.images[0], pageResult.ogImageUrl);
});

test("metadata and sitemap settings fall back safely when the SEO API is unavailable", async () => {
  const { buildManagedSeoMetadata, resolveSeoPages } = loadSeo({ rejectPage: true, rejectPages: true });
  const metadata = await buildManagedSeoMetadata("PRODUCTS");
  const pages = await resolveSeoPages();

  assert.equal(metadata.title.absolute, "화장품 탐색 | 화력");
  assert.equal(metadata.description, "제품명과 브랜드뿐 아니라 주름, 모공, 트러블 같은 피부 고민으로 성분 근거가 연결된 화장품을 찾아보세요.");
  assert.equal(metadata.alternates.canonical, "/products");
  assert.equal(metadata.openGraph.images[0].url, "/hero-watercolor.png");
  assert.equal(pages.length, 13);
  assert.equal(pages.find((page) => page.pageKey === "HOME").includeInSitemap, true);
  assert.equal(pages.find((page) => page.pageKey === "REVIEWERS").includeInSitemap, false);
  assert.equal(pages.find((page) => page.pageKey === "SKIN_CHECK").changeFrequency, "MONTHLY");
});

test("all thirteen static pages resolve metadata through their fixed SEO key", () => {
  for (const [path, pageKey] of managedPages) {
    const source = read(path);
    assert.match(source, /buildManagedSeoMetadata/);
    assert.match(source, new RegExp(`buildManagedSeoMetadata\\(\\"${pageKey}\\"\\)`));
    assert.doesNotMatch(source, /export const metadata/);
  }
});

test("admin SEO is protected, noindex, editable, and invalidates cached public output", () => {
  assert.match(adminPageSource, /title:\s*\{\s*absolute:\s*"SEO 관리 \| 화력"\s*\}/);
  assert.match(adminPageSource, /canonical:\s*"\/admin\/seo"/);
  assert.match(adminPageSource, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(adminPageSource, /openGraph:\s*\{/);
  assert.match(adminPageSource, /twitter:\s*\{/);
  assert.match(adminPageSource, /requireSession\("\/admin\/seo"\)/);
  assert.match(adminPageSource, /user\.role\s*!==\s*"ADMIN"/);
  assert.match(adminPageSource, /getAdminSeoPages\(accessToken\)/);
  assert.match(adminDashboardSource, /href="\/admin\/seo"/);
  assert.match(adminErrorSource, /^"use client";/);
  assert.match(adminErrorSource, /\{\s*error,\s*retry\s*\}/);
  assert.match(adminErrorSource, /<DataError\s+error=\{error\}\s+reset=\{retry\}/);

  for (const field of ["title", "description", "keywords", "indexable", "followLinks", "ogTitle", "ogDescription", "ogImageUrl", "includeInSitemap", "changeFrequency", "priority"]) {
    assert.match(adminFormSource, new RegExp(`name=\\"${field}\\"`));
  }
  assert.match(adminFormSource, /maxLength=\{100\}/);
  assert.match(adminFormSource, /maxLength=\{300\}/);
  assert.match(adminFormSource, /step=\{0\.01\}/);
  assert.match(adminFormSource, /MAX_KEYWORDS_INPUT_LENGTH\s*=\s*1240/);
  assert.match(adminFormSource, /name="keywords"\s+maxLength=\{MAX_KEYWORDS_INPUT_LENGTH\}/);
  assert.match(adminFormSource, /aria-invalid/);
  assert.match(adminFormSource, /aria-describedby/);
  assert.match(adminFormSource, /disabled=\{!indexable\}/);
  assert.match(adminFormSource, /const \[expanded,\s*setExpanded\]\s*=\s*useState\(page\.pageKey\s*===\s*"HOME"\)/);
  assert.match(adminFormSource, /open=\{expanded\}/);
  assert.match(adminFormSource, /onToggle=\{\(event\)\s*=>\s*setExpanded\(event\.currentTarget\.open\)\}/);
  assert.match(adminFormSource, /role=\{state\.message\s*\?\s*\(state\.success\s*\?\s*"status"\s*:\s*"alert"\)\s*:\s*undefined\}/);

  assert.match(adminActionsSource, /getActionAccessToken\(\)/);
  assert.match(adminActionsSource, /user\.role\s*!==\s*"ADMIN"/);
  assert.match(adminActionsSource, /updateAdminSeoPage\(authorization\.accessToken,\s*pageKey,\s*seoInput\(formData\)\)/);
  assert.match(adminActionsSource, /updateTag\(SEO_PAGES_CACHE_TAG\)/);
  assert.match(adminActionsSource, /revalidatePath\(SEO_PAGE_FALLBACKS\[pageKey\]\.path\)/);
  assert.match(adminActionsSource, /revalidatePath\("\/sitemap\.xml"\)/);
  assert.match(adminActionsSource, /includeInSitemap:\s*indexable\s*&&/);
  assert.match(adminActionsSource, /if \(!rawPriority\)/);
});

test("sitemap includes only indexable opted-in managed pages and uses saved sitemap fields", () => {
  assert.match(sitemapSource, /resolveSeoPages\(\)/);
  assert.match(sitemapSource, /filter\(\(page\)\s*=>\s*page\.indexable\s*&&\s*page\.includeInSitemap\)/);
  assert.match(sitemapSource, /lastModified:\s*page\.updatedAt/);
  assert.match(sitemapSource, /changeFrequency:\s*sitemapFrequency\[page\.changeFrequency\]/);
  assert.match(sitemapSource, /priority:\s*page\.priority/);
  assert.match(sitemapSource, /getAllIngredients\(\)/);
  assert.match(sitemapSource, /getAllProducts\(\)/);
  assert.doesNotMatch(sitemapSource, /getAll(?:Products|Ingredients)\(\)\.catch/);
  assert.doesNotMatch(sitemapSource, /getExperts\(\)\.catch/);
  assert.match(sitemapSource, /SITEMAP_API_TIMEOUT_MS\s*=\s*8000/);
  assert.match(sitemapSource, /getExperts\(undefined,\s*\{\s*signal:\s*AbortSignal\.timeout\(SITEMAP_API_TIMEOUT_MS\)\s*\}\)/);
  assert.equal(sitemapSource.match(/const signal\s*=\s*AbortSignal\.timeout\(SITEMAP_API_TIMEOUT_MS\)/g)?.length, 2);
  assert.match(sitemapSource, /while \(page < 1000\)/);
  assert.match(sitemapSource, /!response\.hasNext\s*\|\|\s*page \+ 1 >= response\.totalPages/);
});

test("sitemap walks every product and ingredient result page", async () => {
  const productPages = [];
  const ingredientPages = [];
  const productSignals = [];
  const ingredientSignals = [];
  let expertSignal;
  const pageResult = (id, hasNext) => ({
    content: [{ id }],
    page: hasNext ? 0 : 1,
    size: 50,
    totalElements: 51,
    totalPages: 2,
    hasNext,
  });
  const sitemap = loadSitemap({
    getProductPage: async ({ page, size }, { signal }) => {
      productPages.push([page, size]);
      productSignals.push(signal);
      return pageResult(page === 0 ? "product-first" : "product-last", page === 0);
    },
    getIngredients: async ({ page, size }, { signal }) => {
      ingredientPages.push([page, size]);
      ingredientSignals.push(signal);
      return pageResult(page === 0 ? "ingredient-first" : "ingredient-last", page === 0);
    },
    getExperts: async (_topic, { signal }) => {
      expertSignal = signal;
      return [];
    },
    resolveSeoPages: async () => [],
  });

  const entries = await sitemap();
  assert.deepEqual(productPages, [[0, 50], [1, 50]]);
  assert.deepEqual(ingredientPages, [[0, 50], [1, 50]]);
  assert.ok(productSignals.every((signal) => signal instanceof AbortSignal));
  assert.ok(ingredientSignals.every((signal) => signal instanceof AbortSignal));
  assert.ok(expertSignal instanceof AbortSignal);
  assert.ok(entries.some(({ url }) => url === "https://hwaryeok.test/products/product-last"));
  assert.ok(entries.some(({ url }) => url === "https://hwaryeok.test/ingredients/ingredient-last"));
});

test("sitemap generation fails when a dynamic source is unavailable", async () => {
  const sitemap = loadSitemap({
    getProductPage: async () => { throw new Error("product catalog unavailable"); },
    getIngredients: async () => ({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0, hasNext: false }),
    getExperts: async () => [],
    resolveSeoPages: async () => [],
  });

  await assert.rejects(sitemap(), /product catalog unavailable/);
});
