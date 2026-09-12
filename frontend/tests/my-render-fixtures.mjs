// Isolated synthetic rendering of real page components; no credentials, DB or network.
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

export const product = { id: "qa-ampoule", name: "화면 확인용 히알루론산 앰플", brand: "가상 브랜드", category: "앰플", imageUrl: "must-not-render.jpg" };
export const profile = { configured: true, skinType: "복합성", hydrationLevel: "LOW", oilinessLevel: "HIGH", sensitivityLevel: "MEDIUM", breakoutFrequency: null, concerns: ["속당김", "붉어짐"], updatedAt: "2026-09-10T00:00:00Z" };
export function harness(overrides = {}) {
  const api = {
    getUserSkinProfile: async () => profile,
    getUserFavorites: async () => ({ content: Array.from({ length: 4 }, (_, i) => ({ product: { ...product, id: `qa-${i}` } })), totalElements: 4 }),
    getUserPreferredIngredients: async () => ({ content: [], totalElements: 0 }),
    getUserRecentProducts: async () => ({ content: [{ product }], totalElements: 1 }),
    getUserComparisonProducts: async () => ({ content: [{ product }, { product: { ...product, id: "qa-cream", name: "화면 확인용 세라마이드 크림", category: "크림" } }], totalElements: 2 }),
    getReviewerProfile: async () => ({ reviewCount: 12, reviewFirepower: 72.4, receivedRatingCount: 8 }),
    getFeaturedIngredients: async () => [],
    ...overrides,
  };
  function load(relative) {
    const filename = fileURLToPath(new URL(relative, import.meta.url));
    const { code } = transformSync(readFileSync(filename, "utf8"), { filename, babelrc: false, configFile: false, presets: [typescript, [react, { runtime: "automatic" }]], plugins: [commonjs] });
    const module = { exports: {} };
    const isolatedRequire = specifier => {
      if (specifier === "react" || specifier === "react/jsx-runtime") return require(specifier);
      if (specifier === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (specifier === "next/image") return ({ fill: _fill, priority: _priority, unoptimized: _unoptimized, ...props }) => React.createElement("img", props);
      if (specifier === "lucide-react") return require(specifier);
      if (specifier === "@/lib/api") return api;
      if (specifier === "@/lib/skin-check") return { SKIN_CHECK_DRAFT_KEY: "test-skin-check-draft", restoreSkinDraftSummary: () => null };
      if (specifier === "@/lib/auth-session") return { requireSession: async () => ({ id: "qa-user", email: "qa@example.invalid", nickname: "가상 피부기록", role: "USER", authMethod: "password", passwordChangeAvailable: true }), readAuthTokens: async () => ({ accessToken: "test-only" }), getActionAccessToken: async () => "test-only", ...overrides.auth };
      if (specifier === "@/app/login/actions") return { logoutAction: "/test-logout" };
      if (specifier.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (specifier === "./ingredient-preferences-form") return { IngredientPreferencesForm: () => React.createElement("p", {}, "관심 성분 편집 폼") };
      if (specifier === "@/components/product-ui") return { FavoriteButton: () => React.createElement("button", { "aria-label": "찜 해제", style: { padding: "10px", color: "#b43f6a" } }, "♥") };
      if (specifier === "./my-skin-summary") return load("../src/app/my/my-skin-summary.tsx");
      if (specifier === "./my-tabs") return load("../src/app/my/my-tabs.tsx");
      if (specifier === "./password-change-form") return { PasswordChangeForm: () => React.createElement("div", { "data-password-change-form": true }, "비밀번호 입력 폼") };
      if (specifier === "@/lib/skin-photo") return load("../src/lib/skin-photo.ts");
      if (specifier === "./actions") return { analyzePhotoAction: () => { throw new Error("Fixture must never submit"); } };
      throw new Error(`Unexpected dependency: ${specifier}`);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: isolatedRequire, URLSearchParams, FormData, File });
    return module.exports;
  }
  return { load, api };
}
export async function dashboard(overrides = {}) { return renderToStaticMarkup(await harness(overrides).load("../src/app/my/page.tsx").default()); }
export function photoForm(status) { return renderToStaticMarkup(React.createElement(harness().load("../src/app/my/photo-analysis/skin-photo-form.tsx").SkinPhotoForm, { initialStatus: status })); }
