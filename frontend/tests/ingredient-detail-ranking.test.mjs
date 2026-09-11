import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

function renderHref(href) {
  if (typeof href === "string") return href;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(href.query ?? {})) search.set(key, String(value));
  return search.size ? `${href.pathname}?${search}` : href.pathname;
}

function loadIngredientPage(api, favoriteState = { favoriteIds: [], isAuthenticated: false }) {
  const path = "../src/app/ingredients/[id]/page.tsx";
  const filename = new URL(path, import.meta.url);
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename: filename.pathname,
    babelrc: false,
    configFile: false,
    presets: [
      require("next/dist/compiled/babel/preset-typescript").default,
      [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }],
    ],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  class ApiRequestError extends Error {}
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    URLSearchParams,
    require: name => {
      if (name === "react/jsx-runtime") return require(name);
      if (name === "next/link") return ({ href, children, ...props }) => React.createElement("a", { ...props, href: renderHref(href) }, children);
      if (name === "next/navigation") return { notFound: () => { throw new Error("not-found"); } };
      if (name === "lucide-react") return require(name);
      if (name === "@/lib/api") return { ...api, ApiRequestError };
      if (name === "@/lib/auth-session") return { getFavoriteViewState: async () => favoriteState };
      if (name === "@/components/ingredient-ranking-card") return {
        IngredientRankingCard: ({ item, ingredientName, returnTo }) => React.createElement(
          "article",
          { "data-return-to": returnTo },
          `${item.rank}위 ${ingredientName} ${item.product.name}`,
        ),
      };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return module.exports.default;
}

const ingredient = {
  id: "hyaluronic-acid",
  name: "히알루론산",
  englishName: "Hyaluronic Acid",
  role: "보습",
  description: "수분을 끌어당겨 피부가 촉촉함을 유지하도록 돕는 성분이에요.",
  status: "GOOD",
  caution: null,
  tags: ["수분"],
  skinTypeFeatures: {},
  concernFeatures: {},
};

test("ingredient details render the canonical DB ranking and link to its selected ranking tab", async () => {
  let rankingQuery;
  const Page = loadIngredientPage({
    getIngredient: async () => ingredient,
    getIngredientRegulations: async () => [],
    getIngredientRanking: async query => {
      rankingQuery = query;
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        category: null,
        sort: "FIREPOWER",
        content: [{ product: { id: "water-serum", name: "수분 세럼" }, rank: 1, firepowerScore: 91, reviewScore: 88, reviewCount: 4, concentrationNote: null }],
        page: 0,
        size: 4,
        totalElements: 5,
        totalPages: 2,
        hasNext: true,
        categories: [],
      };
    },
  });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: ingredient.id }) }));

  assert.deepEqual(JSON.parse(JSON.stringify(rankingQuery)), { ingredientId: ingredient.id, sort: "FIREPOWER", page: 0, size: 4 });
  assert.match(html, /id="ingredient-ranking"/);
  assert.match(html, /히알루론산 제품 랭킹/);
  assert.match(html, /총 5개/);
  assert.match(html, /1위 히알루론산 수분 세럼/);
  assert.match(html, /href="\/ranking\?ingredient=hyaluronic-acid"/);
  assert.match(html, /성분 랭킹 탭에서 전체 보기/);
  assert.match(html, /data-return-to="\/ingredients\/hyaluronic-acid#ingredient-ranking"/);
  assert.doesNotMatch(html, /INGREDIENT ANALYSIS|성분 분석/);
});

test("ingredient details explain what the ingredient is, how it helps, and what users can expect without medical overclaim", async () => {
  const niacinamide = {
    ...ingredient,
    id: "niacinamide",
    name: "나이아신아마이드",
    englishName: "Niacinamide",
    role: "피부 톤 · 장벽",
    description: "피부 톤과 장벽, 유분 균형을 폭넓게 관리하는 비타민 B3 성분이에요.",
    caution: "고함량 제품은 피부 상태를 살피며 천천히 적응해보세요.",
    tags: ["피부톤", "장벽", "유분균형"],
    skinTypeFeatures: {
      지성: "유분 균형과 피부 톤을 함께 관리하기 좋아요.",
    },
    concernFeatures: {
      칙칙함: "고르지 않은 피부 톤을 맑게 관리하는 데 도움을 줘요.",
      모공: "유분 균형을 관리해 모공이 도드라져 보이는 것을 줄이는 데 도움을 줘요.",
    },
  };
  const Page = loadIngredientPage({
    getIngredient: async () => niacinamide,
    getIngredientRegulations: async () => [],
    getIngredientRanking: async () => ({
      ingredientId: niacinamide.id,
      ingredientName: niacinamide.name,
      category: null,
      sort: "FIREPOWER",
      content: [],
      page: 0,
      size: 4,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      categories: [],
    }),
  });

  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: niacinamide.id }) }));

  assert.match(html, /어떤 성분인가요\?/);
  assert.match(html, /비타민 B3 성분/);
  assert.match(html, /어떻게 피부에 도움을 주나요\?/);
  assert.match(html, /피부 톤|장벽|유분 균형/);
  assert.match(html, /어떤 효과를 기대할 수 있나요\?/);
  assert.match(html, /칙칙함|모공/);
  assert.match(html, /도움(?:을)? 줄 수|기대할 수/);
  assert.doesNotMatch(html, /치료합니다|완치|즉시 제거|효과를 보장/);
});
