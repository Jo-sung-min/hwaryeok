import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

function compile(path, imports) {
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
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    FormData,
    URLSearchParams,
    require: name => {
      if (name in imports) return imports[name];
      if (name === "react/jsx-runtime" || name === "lucide-react") return require(name);
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return module.exports;
}

const Link = ({ href, children, ...props }) => React.createElement("a", { ...props, href }, children);

const ingredient = {
  id: "test-active",
  name: "테스트 활성 성분",
  englishName: "Test Active",
  role: "보습",
  description: "피부 보습에 도움을 주는 성분이에요.",
  status: "GOOD",
  caution: null,
  tags: ["보습"],
  evidenceLevel: "A",
  featured: true,
  displayOrder: 1,
  concentrationNote: "관리자 메모 77%",
  isKeyIngredient: true,
  regulations: [],
};

const draftAmount = {
  kind: "EXACT",
  minAmount: 77,
  maxAmount: 77,
  unit: "PERCENT",
  basis: "W_W",
  substanceBasis: "PURE_INGREDIENT",
  rawClaimText: "DRAFT RAW SECRET",
  displayValue: "77% DRAFT SECRET",
  amountPerContainer: "38.5 g / 본품",
  sourceType: "BRAND_OFFICIAL",
  sourceUrl: "https://draft.example/secret",
  pageTitle: "DRAFT PAGE SECRET",
  sourceIngredientName: "DRAFT INGREDIENT SECRET",
  checkedAt: "2026-09-01",
  verificationStatus: "DRAFT",
  reviewedAt: null,
  comparisonNote: "DRAFT COMPARISON SECRET",
};

const verifiedAmount = {
  ...draftAmount,
  minAmount: 0.001,
  maxAmount: 0.001,
  unit: "PPB",
  rawClaimText: "Test Active 0.001 ppb",
  displayValue: "0.001ppb",
  amountPerContainer: null,
  sourceUrl: "https://brand.example/evidence",
  pageTitle: "브랜드 공식 제품 페이지",
  verificationStatus: "VERIFIED",
  comparisonNote: "같은 기준끼리만 비교해요.",
};

function loadProductIngredientsPanel() {
  return compile("../src/components/product-ingredients-panel.tsx", {
    react: React,
    "next/link": Link,
  }).ProductIngredientsPanel;
}

function loadIngredientRankingCard() {
  return compile("../src/components/ingredient-ranking-card.tsx", {
    react: React,
    "next/link": Link,
    "@/components/product-ui": {
      ProductVisual: ({ alt }) => React.createElement("span", null, alt),
      FavoriteButton: () => React.createElement("button", { type: "button" }, "찜"),
    },
  }).IngredientRankingCard;
}

function productIngredients(amount) {
  return {
    productId: "test-product",
    totalCount: 1,
    goodCount: 1,
    cautionCount: 0,
    neutralCount: 0,
    verifiedAmountCount: amount?.verificationStatus === "VERIFIED" ? 1 : 0,
    ingredients: [{ ...ingredient, amount }],
    source: null,
  };
}

function rankingItem(amount) {
  return {
    product: {
      id: "test-product",
      brand: "테스트 브랜드",
      name: "테스트 제품",
      category: "앰플",
      benefit: "보습",
      subBenefit: "진정",
      price: "10,000원",
      tone: "rose",
      score: 90,
      publicationStatus: "PUBLISHED",
    },
    rank: 1,
    firepowerScore: 91,
    reviewScore: 88,
    reviewCount: 3,
    concentrationNote: ingredient.concentrationNote,
    amount,
  };
}

test("public ingredient surfaces hide DRAFT amount claims and free-text concentration notes", () => {
  const ProductIngredientsPanel = loadProductIngredientsPanel();
  const IngredientRankingCard = loadIngredientRankingCard();
  const panelHtml = renderToStaticMarkup(React.createElement(ProductIngredientsPanel, { data: productIngredients(draftAmount) }));
  const cardHtml = renderToStaticMarkup(React.createElement(IngredientRankingCard, {
    item: rankingItem(draftAmount),
    ingredientName: ingredient.name,
    sort: "FIREPOWER",
    favorited: false,
    isAuthenticated: false,
    returnTo: "/ranking",
  }));

  for (const html of [panelHtml, cardHtml]) {
    assert.doesNotMatch(html, /77% DRAFT SECRET|DRAFT RAW SECRET|draft\.example|관리자 메모 77%/);
    assert.match(html, /정확 함량 미공개/);
    assert.match(html, /순서는 실제 함량이 아니/);
  }
  assert.match(panelHtml, /미공개 함량을 0으로 보지 않아요/);
});

test("verified 0.001ppb remains precise and exposes its official evidence link", () => {
  const ProductIngredientsPanel = loadProductIngredientsPanel();
  const IngredientRankingCard = loadIngredientRankingCard();
  const panelHtml = renderToStaticMarkup(React.createElement(ProductIngredientsPanel, { data: productIngredients(verifiedAmount) }));
  const cardHtml = renderToStaticMarkup(React.createElement(IngredientRankingCard, {
    item: rankingItem(verifiedAmount),
    ingredientName: ingredient.name,
    sort: "FIREPOWER",
    favorited: false,
    isAuthenticated: false,
    returnTo: "/ranking",
  }));

  assert.match(panelHtml, /0\.001ppb/);
  assert.match(cardHtml, /0\.001ppb/);
  assert.match(panelHtml, /href="https:\/\/brand\.example\/evidence"/);
  assert.match(panelHtml, /새 창에서 확인/);
});

function amountFormData(kind, amount = "0.001") {
  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("amount", amount);
  formData.set("unit", "PPB");
  formData.set("basis", "W_W");
  formData.set("substanceBasis", "PURE_INGREDIENT");
  formData.set("rawClaimText", "Test Active 0.001 ppb");
  formData.set("sourceType", "BRAND_OFFICIAL");
  formData.set("sourceUrl", "https://brand.example/evidence");
  formData.set("pageTitle", "브랜드 공식 제품 페이지");
  formData.set("sourceIngredientName", "Test Active");
  formData.set("checkedAt", "2026-09-01");
  formData.set("verificationStatus", "VERIFIED");
  return formData;
}

function loadActions(captured) {
  class ApiRequestError extends Error {}
  return compile("../src/app/admin/products/actions.ts", {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/auth-session": { getActionAccessToken: async () => "admin-token" },
    "@/lib/api": {
      ApiRequestError,
      getCurrentUser: async () => ({ role: "ADMIN" }),
      updateAdminProductIngredientAmount: async (_token, _productId, _ingredientId, input) => { captured.amount = input; },
      updateAdminProductIngredients: async (_token, _productId, items) => { captured.ingredients = items; },
    },
  });
}

test("amount action maps exact and maximum claims to the backend shape", async () => {
  const exactCapture = {};
  const exactActions = loadActions(exactCapture);
  const exactState = await exactActions.saveProductIngredientAmountAction("product", "ingredient", { success: false, message: "" }, amountFormData("EXACT"));
  assert.equal(exactState.success, true);
  assert.deepEqual(JSON.parse(JSON.stringify(exactCapture.amount)), {
    kind: "EXACT",
    minAmount: 0.001,
    maxAmount: 0.001,
    unit: "PPB",
    basis: "W_W",
    substanceBasis: "PURE_INGREDIENT",
    rawClaimText: "Test Active 0.001 ppb",
    sourceType: "BRAND_OFFICIAL",
    sourceUrl: "https://brand.example/evidence",
    pageTitle: "브랜드 공식 제품 페이지",
    sourceIngredientName: "Test Active",
    checkedAt: "2026-09-01",
    verificationStatus: "VERIFIED",
  });

  const maximumCapture = {};
  const maximumActions = loadActions(maximumCapture);
  const maximumState = await maximumActions.saveProductIngredientAmountAction("product", "ingredient", { success: false, message: "" }, amountFormData("MAXIMUM"));
  assert.equal(maximumState.success, true);
  assert.equal(maximumCapture.amount.minAmount, undefined);
  assert.equal(maximumCapture.amount.maxAmount, 0.001);
  assert.doesNotMatch(JSON.stringify(maximumCapture.amount), /minAmount/);
});

test("amount action rejects zero, while ingredient relationship saves its key flag", async () => {
  const captured = {};
  const actions = loadActions(captured);
  const invalidState = await actions.saveProductIngredientAmountAction("product", "ingredient", { success: false, message: "" }, amountFormData("EXACT", "0"));
  assert.equal(invalidState.success, false);
  assert.match(invalidState.message, /0보다 큰/);
  assert.equal(captured.amount, undefined);

  const relationships = new FormData();
  relationships.set("ingredients", JSON.stringify([{ ingredientId: "test-active", concentrationNote: "공식 강조", isKeyIngredient: true }]));
  const relationshipState = await actions.saveProductIngredientsAction("product", { success: false, message: "" }, relationships);
  assert.equal(relationshipState.success, true);
  assert.deepEqual(JSON.parse(JSON.stringify(captured.ingredients)), [{ ingredientId: "test-active", concentrationNote: "공식 강조", isKeyIngredient: true }]);
});

function fakeActionReact() {
  return { ...React, useActionState: (_action, initialState) => [initialState, "/noop", false] };
}

test("admin ingredient and amount forms are siblings instead of nested forms", () => {
  const ReactWithAction = fakeActionReact();
  const ProductIngredientsForm = compile("../src/app/admin/products/product-ingredients-form.tsx", {
    react: ReactWithAction,
    "@/app/admin/products/actions": { saveProductIngredientsAction: () => {} },
    "@/app/admin/products/product-ingredient-amount-form": {
      ProductIngredientAmountForm: () => React.createElement("form", { "data-testid": "amount-form" }),
    },
  }).ProductIngredientsForm;
  const relationshipHtml = renderToStaticMarkup(React.createElement(ProductIngredientsForm, {
    productId: "product",
    availableIngredients: [ingredient],
    initialIngredients: productIngredients(verifiedAmount),
  }));
  assert.equal((relationshipHtml.match(/<form/g) ?? []).length, 2);
  assert.ok(relationshipHtml.indexOf("</form>") < relationshipHtml.indexOf('data-testid="amount-form"'));

  const ProductIngredientAmountForm = compile("../src/app/admin/products/product-ingredient-amount-form.tsx", {
    react: ReactWithAction,
    "@/app/admin/products/actions": {
      saveProductIngredientAmountAction: () => {},
      deleteProductIngredientAmountAction: () => {},
    },
  }).ProductIngredientAmountForm;
  const amountHtml = renderToStaticMarkup(React.createElement(ProductIngredientAmountForm, {
    productId: "product",
    ingredient: { ...ingredient, amount: { ...verifiedAmount, kind: "MAXIMUM", minAmount: null, maxAmount: 0.001, displayValue: "0.001ppb 이하" } },
  }));
  const formStarts = [...amountHtml.matchAll(/<form/g)].map(match => match.index);
  const firstFormEnd = amountHtml.indexOf("</form>");
  assert.equal(formStarts.length, 2);
  assert.ok(firstFormEnd < formStarts[1]);
  assert.match(amountHtml, /name="amount"[^>]*value="0\.001"/);
  assert.doesNotMatch(amountHtml, /name="isKeyIngredient"/);
});

test("frontend response types follow the amount-evidence backend contract", () => {
  const types = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");
  const api = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../src/app/admin/products/actions.ts", import.meta.url), "utf8");
  const amountForm = readFileSync(new URL("../src/app/admin/products/product-ingredient-amount-form.tsx", import.meta.url), "utf8");
  assert.match(types, /formulationClue:\s*number/);
  assert.match(types, /amountEvidence:\s*number/);
  assert.doesNotMatch(types, /\n\s*concentration:\s*number/);
  assert.match(types, /minAmount:\s*number\s*\|\s*null/);
  assert.match(api, /updateAdminProductIngredientAmount[\s\S]*Promise<IngredientAmount>/);
  assert.match(actions, /saveProductIngredientAmountAction\([\s\S]*_previousState:[\s\S]*formData:\s*FormData/);
  assert.match(amountForm, /saveProductIngredientAmountAction\.bind\(null, productId, ingredient\.id\)/);
  assert.match(amountForm, /deleteProductIngredientAmountAction\.bind\(null, productId, ingredient\.id\)/);
  assert.match(amountForm, /useActionState\(saveAction, initialState\)/);
  assert.match(amountForm, /useActionState\(deleteAction, initialState\)/);
});
