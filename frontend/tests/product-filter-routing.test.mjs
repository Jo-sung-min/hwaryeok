import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
    return React.createElement("div", { [`data-${name}`]: "true" });
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
      if (specifier === "lucide-react") return new Proxy({}, { get: (_, key) => key === "__esModule" ? true : (props) => React.createElement("svg", { ...props, "data-icon": key }) });
      if (specifier === "@/components/product-ui") return { ProductCard: ({ returnTo }) => React.createElement("div", { "data-product-return": returnTo }) };
      if (specifier === "@/lib/auth-session") return {
        getFavoriteViewState: async () => ({ favoriteIds: [], isAuthenticated: false }),
        getOptionalSkinProfile: async () => null,
      };
      if (specifier === "@/lib/api") return {
        getIngredientRankingOptions: async () => ({ ingredients: [{ id: "niacinamide", name: "나이아신아마이드", productCount: 3 }], categories: [] }),
        getProductPage: async (query) => {
          captures.query = query;
          return { content: [{ id: "toner", name: "토너", brand: "화력", category: "토너", publicationStatus: "PUBLISHED" }], page: 1, size: 6, totalElements: 9, totalPages: 3, hasNext: true };
        },
      };
      if (specifier === "./product-filters") return {
        AppliedProductFilters: passthrough("applied"),
        CategoryNavigation: passthrough("categories"),
        DesktopFilters: passthrough("desktop"),
        MobileFilters: passthrough("mobile"),
        ProductSearch: passthrough("search"),
        ProductSort: passthrough("sort"),
      };
      throw new Error(`Unexpected products-page dependency: ${specifier}`);
    },
  }, { filename });
  return localModule.exports.default;
}

test("products page sends and retains the four catalog filters through paging and card return paths", async () => {
  const captures = {};
  const ProductsPage = loadProductsPage(captures);
  const searchParams = {
    category: "토너",
    ingredientId: "niacinamide",
    minReviewScore: "80",
    minFirepowerScore: "65",
    page: "2",
  };
  const html = renderToStaticMarkup(await ProductsPage({ searchParams: Promise.resolve(searchParams) }));
  assert.equal(captures.query.category, "토너");
  assert.equal(captures.query.ingredientId, "niacinamide");
  assert.equal(captures.query.minReviewScore, 80);
  assert.equal(captures.query.minFirepowerScore, 65);
  assert.equal(captures.query.page, 1);
  assert.equal(captures.applied.filters.ingredientId, "niacinamide");
  assert.equal(captures.mobile.ingredients[0].name, "나이아신아마이드");
  for (const key of ["category=%ED%86%A0%EB%84%88", "ingredientId=niacinamide", "minReviewScore=80", "minFirepowerScore=65"]) assert.ok(html.includes(key));
  assert.match(html, /data-product-return="\/products\?[^\"]*ingredientId=niacinamide[^\"]*minReviewScore=80[^\"]*minFirepowerScore=65[^\"]*page=2"/);
});
