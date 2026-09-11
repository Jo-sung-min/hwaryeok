import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as productCatalog from "../src/lib/product-catalog.ts";

const require = createRequire(import.meta.url);

function loadProductsPage(captures) {
  const filename = fileURLToPath(new URL("../src/app/products/page.tsx", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default, [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }]],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };
  const passthrough = (name) => (props) => {
    captures[name] = props;
    return React.createElement("div", { ["data-" + name]: "true" });
  };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    URLSearchParams,
    Object,
    Number,
    require: (specifier) => {
      if (specifier === "react/jsx-runtime") return require(specifier);
      if (specifier === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (specifier === "next/server") return { connection: async () => {} };
      if (specifier === "@/lib/auth-session") return {
        getFavoriteViewState: async () => ({ favoriteIds: ["toner"], isAuthenticated: true }),
        getOptionalSkinProfile: async () => captures.profile ?? null,
      };
      if (specifier === "@/lib/api") return {
        getIngredientRankingOptions: async () => ({ ingredients: [{ id: "niacinamide", name: "나이아신아마이드", productCount: 3 }], categories: [] }),
        getProductPage: async (query) => {
          captures.query = query;
          return { content: [{ id: "toner", name: "토너", brand: "화력", category: "토너", publicationStatus: "PUBLISHED" }], page: 1, size: 9, totalElements: 18, totalPages: 2, hasNext: false };
        },
      };
      if (specifier === "@/lib/product-catalog") return productCatalog;
      if (specifier === "./product-catalog-grid") return { ProductCatalogGrid: passthrough("catalog-grid") };
      if (specifier === "./product-quick-filters") return { ProductQuickFilters: passthrough("quick-filters") };
      if (specifier === "./product-filters") return {
        AppliedProductFilters: passthrough("applied"),
        MobileFilters: passthrough("mobile"),
        ProductSearch: passthrough("search"),
        ProductSort: passthrough("sort"),
      };
      throw new Error("Unexpected products-page dependency: " + specifier);
    },
  }, { filename });
  return localModule.exports.default;
}

test("products page sends every catalog filter through the shared state and catalog grid", async () => {
  const captures = {};
  const ProductsPage = loadProductsPage(captures);
  const searchParams = {
    query: " 진정 토너 ",
    category: "토너",
    grade: "2",
    ingredientId: "niacinamide",
    minReviewScore: "80",
    minFirepowerScore: "65",
    concern: "붉은기·민감",
    maxPrice: "30000",
    confidence: "high",
    order: "price-asc",
    page: "2",
  };

  renderToStaticMarkup(await ProductsPage({ searchParams: Promise.resolve(searchParams) }));

  assert.deepEqual(
    JSON.parse(JSON.stringify(captures.query)),
    {
      query: "진정 토너",
      category: "토너",
      grade: 2,
      ingredientId: "niacinamide",
      minReviewScore: 80,
      minFirepowerScore: 65,
      concern: "붉은기·민감",
      maxPrice: 30000,
      confidence: "HIGH",
      sort: "price",
      direction: "asc",
      page: 1,
      size: productCatalog.PRODUCT_PAGE_SIZE,
    },
  );
  assert.equal(captures.applied.filters.ingredientId, "niacinamide");
  assert.equal(captures["quick-filters"].filters.concern, "붉은기·민감");
  assert.equal(captures.mobile.ingredients[0].name, "나이아신아마이드");
  assert.equal(captures["catalog-grid"].initialPage.size, productCatalog.PRODUCT_PAGE_SIZE);
  assert.deepEqual(captures["catalog-grid"].favoriteIds, ["toner"]);
  assert.equal(captures["catalog-grid"].isAuthenticated, true);

  const retainedKeys = [
    "query=%EC%A7%84%EC%A0%95+%ED%86%A0%EB%84%88",
    "category=%ED%86%A0%EB%84%88",
    "grade=2",
    "ingredientId=niacinamide",
    "minReviewScore=80",
    "minFirepowerScore=65",
    "concern=%EB%B6%89%EC%9D%80%EA%B8%B0",
    "maxPrice=30000",
    "confidence=HIGH",
    "order=price-asc",
  ];
  for (const key of retainedKeys) {
    assert.ok(captures["catalog-grid"].returnTo.includes(key), "return path should retain " + key);
    assert.ok(captures["catalog-grid"].feedUrl.includes(key), "feed path should retain " + key);
  }
  assert.ok(captures["catalog-grid"].returnTo.endsWith("page=2"));
  assert.doesNotMatch(captures["catalog-grid"].feedUrl, /[?&]page=/);
});

test("products page applies the same saved skin profile to the initial personalized batch", async () => {
  const captures = { profile: { skinType: "COMBINATION", concerns: ["REDNESS"] } };
  const ProductsPage = loadProductsPage(captures);

  renderToStaticMarkup(await ProductsPage({ searchParams: Promise.resolve({ category: "세럼" }) }));

  assert.deepEqual(captures.query.profile, captures.profile);
  assert.equal(captures["catalog-grid"].scoreLabel, "내 피부 적합도");
});

test("products page turns a wrinkle search into an evidence-based concern search", async () => {
  const captures = {};
  const ProductsPage = loadProductsPage(captures);

  renderToStaticMarkup(await ProductsPage({ searchParams: Promise.resolve({ query: "주름" }) }));

  assert.equal(captures.query.query, undefined);
  assert.equal(captures.query.concern, "탄력·잔주름");
  assert.equal(captures.applied.filters.concern, "탄력·잔주름");
  assert.equal(captures["catalog-grid"].activeConcern, "탄력·잔주름");
  assert.equal(captures["catalog-grid"].scoreLabel, "주름·탄력 반영 화력");
  assert.match(captures["catalog-grid"].feedUrl, /concern=/);
  assert.doesNotMatch(captures["catalog-grid"].feedUrl, /query=/);
});
