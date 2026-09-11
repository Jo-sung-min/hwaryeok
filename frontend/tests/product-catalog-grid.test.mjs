import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import {
  appendUniqueProducts,
  buildProductCatalogFeedUrl,
  buildProductCatalogHref,
  PRODUCT_PAGE_SIZE,
  productCatalogBackendFilters,
  readProductCatalogState,
  resolveProductConcernSearch,
} from "../src/lib/product-catalog.ts";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const gridSource = read("../src/app/products/product-catalog-grid.tsx");
const gridCss = read("../src/app/products/product-catalog-grid.module.css");
const loadingSource = read("../src/app/products/loading.tsx");
const pageSource = read("../src/app/products/page.tsx");
const filtersSource = read("../src/app/products/product-filters.tsx");
const quickFiltersSource = read("../src/app/products/product-quick-filters.tsx");
const navigationSource = read("../src/components/navigation.tsx");
const routeSource = read("../src/app/api/catalog/products/route.ts");
const apiSource = read("../src/lib/api.ts");

function declarations(css, selector) {
  const start = css.indexOf(selector + " {");
  assert.notEqual(start, -1, "Expected a CSS rule for " + selector);
  const end = css.indexOf("}", start);
  assert.notEqual(end, -1, "Expected the CSS rule to close for " + selector);
  return css.slice(start, end);
}

function loadCatalogRoute(captures) {
  const filename = fileURLToPath(new URL("../src/app/api/catalog/products/route.ts", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };

  class ApiRequestError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }

  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    URL,
    URLSearchParams,
    Object,
    Number,
    Response,
    require: (specifier) => {
      if (specifier === "@/lib/api") return {
        ApiRequestError,
        getProductPage: async (query, init) => {
          captures.calls.push({ query, init });
          return {
            content: [{ id: "next-product" }],
            page: query.page,
            size: query.size,
            totalElements: 27,
            totalPages: 3,
            hasNext: false,
          };
        },
      };
      if (specifier === "@/lib/auth-session") return {
        getOptionalSkinProfile: async () => {
          captures.profileReads += 1;
          return captures.profile;
        },
      };
      if (specifier === "@/lib/product-catalog") {
        return {
          PRODUCT_PAGE_SIZE,
          productCatalogBackendFilters,
          readProductCatalogState,
        };
      }
      throw new Error("Unexpected catalog-route dependency: " + specifier);
    },
  }, { filename });
  return localModule.exports.GET;
}

test("catalog grid stays full-bleed with exactly three image columns", () => {
  const frame = declarations(gridCss, ".gridFrame");
  const grid = declarations(gridCss, ".grid");
  const image = declarations(gridCss, ".imageBox");
  const productImage = declarations(gridCss, ".productImage");

  assert.match(frame, /margin-inline:\s*-12px/);
  assert.match(grid, /display:\s*grid/);
  assert.match(grid, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(grid, /column-gap:\s*(?:0|1px)/);
  assert.match(grid, /padding:\s*0/);
  assert.match(image, /aspect-ratio:\s*3\s*\/\s*4/);
  assert.match(image, /overflow:\s*hidden/);
  assert.match(productImage, /object-fit:\s*cover/);
  assert.equal((gridCss.match(/grid-template-columns:/g) ?? []).length, 1, "responsive rules must not collapse the catalog back to one column");
});

test("initial, loading, and continuation requests share a nine-product batch", () => {
  assert.equal(PRODUCT_PAGE_SIZE, 9);
  assert.match(pageSource, /size:\s*PRODUCT_PAGE_SIZE/);
  assert.match(routeSource, /size:\s*PRODUCT_PAGE_SIZE/);
  assert.match(loadingSource, /Array\.from\(\{\s*length:\s*9\s*\}/);
  assert.match(gridSource, /eager=\{index\s*<\s*3\}/);
});

test("catalog URLs round-trip every supported filter without leaking a page into the feed key", () => {
  const filters = {
    query: "진정 토너",
    category: "마스크팩",
    grade: "2등급",
    ingredientId: "niacinamide",
    minReviewScore: "80",
    minFirepowerScore: "65",
    concern: "붉은기·민감",
    maxPrice: "30000",
    confidence: "HIGH",
    order: "ingredient-desc",
  };
  const pageHref = buildProductCatalogHref(filters, 2);
  const pageUrl = new URL(pageHref, "http://hwaryeok.local");
  const replayed = readProductCatalogState(
    Object.fromEntries(pageUrl.searchParams.entries()),
    new Set(["niacinamide"]),
  );

  assert.deepEqual(replayed.filters, filters);
  assert.equal(replayed.requestedPage, 2);
  assert.equal(pageUrl.searchParams.get("page"), "3");

  const feedUrl = new URL(buildProductCatalogFeedUrl(filters), "http://hwaryeok.local");
  assert.equal(feedUrl.pathname, "/api/catalog/products");
  assert.equal(feedUrl.searchParams.has("page"), false);
  for (const [key, value] of Object.entries(filters)) {
    const expected = key === "grade" ? "2" : value;
    assert.equal(feedUrl.searchParams.get(key), expected, "feed URL should retain " + key);
  }
});

test("backend filters preserve the selected sort and convert numeric catalog fields", () => {
  assert.deepEqual(
    productCatalogBackendFilters({
      query: "토너",
      category: "토너",
      grade: "3등급",
      ingredientId: "niacinamide",
      minReviewScore: "90",
      minFirepowerScore: "80",
      concern: "속건조·당김",
      maxPrice: "20000",
      confidence: "MEDIUM",
      order: "price-asc",
    }),
    {
      query: "토너",
      category: "토너",
      grade: 3,
      ingredientId: "niacinamide",
      minReviewScore: 90,
      minFirepowerScore: 80,
      concern: "속건조·당김",
      maxPrice: 20000,
      confidence: "MEDIUM",
      sort: "price",
      direction: "asc",
    },
  );
});

test("concern aliases become canonical filters while ordinary product words stay searchable", () => {
  const wrinkle = resolveProductConcernSearch("주름 크림");
  assert.equal(wrinkle.option.value, "탄력·잔주름");
  assert.equal(wrinkle.remainingQuery, "크림");

  const state = readProductCatalogState({ query: "눈가 주름" });
  assert.equal(state.filters.query, "");
  assert.equal(state.filters.concern, "탄력·잔주름");
  assert.equal(state.concernSearch.option.label, "주름·탄력");

  const categoryState = readProductCatalogState({ query: "주름 크림" });
  assert.equal(categoryState.filters.query, "");
  assert.equal(categoryState.filters.category, "크림");
  assert.equal(categoryState.filters.concern, "탄력·잔주름");

  const multiWordState = readProductCatalogState({ query: "눈가 주름 크림" });
  assert.equal(multiWordState.concernSearch.matchedKeyword, "눈가 주름");
  assert.equal(multiWordState.filters.category, "크림");

  const ordinary = readProductCatalogState({ query: "다이브인 토너" });
  assert.equal(ordinary.filters.query, "다이브인 토너");
  assert.equal(ordinary.filters.concern, "전체 고민");
  assert.equal(ordinary.concernSearch, undefined);
});

test("product search visibly offers concern discovery and explains the matching reason", () => {
  assert.match(filtersSource, /제품명·브랜드·피부 고민 검색/);
  assert.match(quickFiltersSource, /피부 고민/);
  assert.match(quickFiltersSource, /PRODUCT_CONCERN_OPTIONS\.map/);
  assert.match(navigationSource, /제품명·브랜드·피부 고민/);
  assert.match(pageSource, /함께 살펴볼 성분/);
  assert.match(gridSource, /product\.matchReasons\?\.find/);
  assert.match(gridSource, /reason\.includes\(activeConcern\)/);
});

test("continuation pages append in order while removing already rendered products", () => {
  const current = [{ id: "a" }, { id: "b" }];
  const incoming = [{ id: "b" }, { id: "c" }, { id: "d" }];
  const combined = appendUniqueProducts(current, incoming);

  assert.deepEqual(combined.map((product) => product.id), ["a", "b", "c", "d"]);
  assert.deepEqual(current.map((product) => product.id), ["a", "b"]);
  assert.deepEqual(incoming.map((product) => product.id), ["b", "c", "d"]);
});

test("infinite loading keeps observer, cancellation, stale-response, and duplicate-request guards", () => {
  assert.match(gridSource, /new\s+IntersectionObserver\s*\(/);
  assert.match(gridSource, /entries\[0\]\?\.isIntersecting/);
  assert.match(gridSource, /observer\.observe\(sentinel\)/);
  assert.match(gridSource, /observer\.disconnect\(\)/);
  assert.match(gridSource, /rootMargin:\s*"120px 0px"/);

  assert.match(gridSource, /new\s+AbortController\s*\(\)/);
  assert.match(gridSource, /abortRef\.current\?\.abort\(\)/);
  assert.match(gridSource, /signal:\s*controller\.signal/);
  assert.match(gridSource, /controller\.signal\.aborted/);
  assert.match(gridSource, /requestKeyRef\.current\s*!==\s*requestKey/);
  assert.match(gridSource, /inFlightPageRef\.current\s*!==\s*null/);
  assert.match(gridSource, /loadedPagesRef\.current\.has\(pageIndex\)/);
  assert.match(pageSource, /key=\{\x60\$\{feedUrl\}:\$\{productPage\.page\}\x60\}/);
});

test("manual load fallback and loading announcements remain usable without IntersectionObserver", () => {
  assert.match(gridSource, /typeof\s+IntersectionObserver\s*===\s*"undefined"/);
  assert.match(gridSource, /<Link[\s\S]*?href=\{fallbackHref\}[\s\S]*?prefetch=\{false\}[\s\S]*?onClick=\{handleLoadMore\}/);
  assert.match(gridSource, /event\.preventDefault\(\)/);
  assert.match(gridSource, /"제품 더 보기"/);
  assert.match(gridSource, /role="status"\s+aria-live="polite"/);
  assert.match(gridSource, /role="alert"/);
  assert.match(gridSource, /aria-busy=\{isLoading\}/);
  assert.match(gridSource, /cache:\s*"no-store"/);
  assert.match(gridSource, /credentials:\s*"same-origin"/);
});

test("catalog BFF reapplies the saved profile and returns private no-store pages", async () => {
  const captures = {
    calls: [],
    profileReads: 0,
    profile: { skinType: "COMBINATION", concerns: ["REDNESS"] },
  };
  const GET = loadCatalogRoute(captures);
  const request = new Request(
    "http://hwaryeok.local/api/catalog/products?cursor=2&query=%EC%A7%84%EC%A0%95&category=%ED%86%A0%EB%84%88&grade=2&ingredientId=niacinamide&minReviewScore=80&minFirepowerScore=65&concern=%EB%B6%89%EC%9D%80%EA%B8%B0%C2%B7%EB%AF%BC%EA%B0%90&maxPrice=30000&confidence=HIGH&order=ingredient-desc",
  );

  const response = await GET(request);
  const body = await response.json();
  const call = captures.calls[0];

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(body.page, 2);
  assert.equal(captures.profileReads, 1);
  assert.equal(captures.calls.length, 1);
  assert.deepEqual(call.query.profile, captures.profile);
  assert.equal(call.query.page, 2);
  assert.equal(call.query.size, PRODUCT_PAGE_SIZE);
  assert.equal(call.query.category, "토너");
  assert.equal(call.query.grade, 2);
  assert.equal(call.query.ingredientId, "niacinamide");
  assert.equal(call.query.minReviewScore, 80);
  assert.equal(call.query.minFirepowerScore, 65);
  assert.equal(call.query.concern, "붉은기·민감");
  assert.equal(call.query.maxPrice, 30000);
  assert.equal(call.query.confidence, "HIGH");
  assert.equal(call.query.sort, "ingredient");
  assert.equal(call.query.direction, "desc");
  assert.equal(call.init.signal, request.signal);
});

test("catalog BFF rejects invalid cursors before profile or backend work", async () => {
  const captures = { calls: [], profileReads: 0, profile: null };
  const GET = loadCatalogRoute(captures);

  const response = await GET(new Request("http://hwaryeok.local/api/catalog/products?cursor=-1"));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.message, /위치/);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(captures.profileReads, 0);
  assert.equal(captures.calls.length, 0);
});

test("both BFF hops are explicitly uncached", () => {
  const requestJsonStart = apiSource.indexOf("async function requestJson");
  const requestJsonEnd = apiSource.indexOf("export type SignupInput", requestJsonStart);
  const requestJsonSource = apiSource.slice(requestJsonStart, requestJsonEnd);

  assert.match(routeSource, /"Cache-Control":\s*"private, no-store, max-age=0"/);
  assert.match(requestJsonSource, /fetch\([\s\S]*?cache:\s*"no-store"/);
  assert.match(routeSource, /getOptionalSkinProfile\(\)/);
  assert.match(routeSource, /profile:\s*profile\s*\?\?\s*undefined/);
});
