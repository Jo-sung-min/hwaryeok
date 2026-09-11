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
const pageSource = read("../src/app/ingredients/page.tsx");
const loadingSource = read("../src/app/ingredients/loading.tsx");
const css = read("../src/app/ingredients/ingredients.module.css");

const ingredients = [
  {
    id: "niacinamide/a ?",
    name: "나이아신아마이드",
    englishName: "Niacinamide",
    role: "피부톤 케어",
    status: "GOOD",
    description: "목록에서 숨겨야 하는 첫 번째 설명",
    tags: ["숨김태그-보습", "숨김태그-피부톤"],
  },
  {
    id: "retinol",
    name: "레티놀",
    englishName: "Retinol",
    role: "피부결 케어",
    status: "CAUTION",
    description: "목록에서 숨겨야 하는 두 번째 설명",
    tags: ["숨김태그-탄력"],
  },
  {
    id: "water",
    name: "정제수",
    englishName: "",
    role: "",
    status: "NEUTRAL",
    description: "목록에서 숨겨야 하는 세 번째 설명",
    tags: ["숨김태그-기본"],
  },
];

const resultFixture = {
  content: ingredients,
  page: 2,
  size: 12,
  totalElements: 51,
  totalPages: 5,
  hasNext: true,
};

function compile(relativePath, isolatedRequire) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
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
    require: isolatedRequire,
    URLSearchParams,
    encodeURIComponent,
  }, { filename });
  return localModule.exports;
}

function cssModule() {
  return {
    __esModule: true,
    default: new Proxy({}, { get: (_, name) => String(name) }),
  };
}

function iconModule() {
  return new Proxy({ __esModule: true }, {
    get: (target, name) => name in target
      ? target[name]
      : (props) => React.createElement("svg", { ...props, "data-icon": String(name) }),
  });
}

function loadIngredientsPage(captures, result = resultFixture) {
  const Link = ({ children, ...props }) => React.createElement("a", props, children);
  return compile("../src/app/ingredients/page.tsx", (specifier) => {
    if (specifier === "react/jsx-runtime") return require(specifier);
    if (specifier === "next/link") return { __esModule: true, default: Link };
    if (specifier === "next/server") return { connection: async () => {} };
    if (specifier === "lucide-react") return iconModule();
    if (specifier === "@/lib/api") return {
      getIngredients: async (query) => {
        captures.queries.push(query);
        return result;
      },
    };
    if (specifier.endsWith(".module.css")) return cssModule();
    throw new Error(`Unexpected ingredients-page dependency: ${specifier}`);
  }).default;
}

function loadIngredientsLoading() {
  return compile("../src/app/ingredients/loading.tsx", (specifier) => {
    if (specifier === "react/jsx-runtime") return require(specifier);
    if (specifier.endsWith(".module.css")) return cssModule();
    throw new Error(`Unexpected ingredients-loading dependency: ${specifier}`);
  }).default;
}

async function renderPage(params = {}, result = resultFixture) {
  const captures = { queries: [] };
  const IngredientsPage = loadIngredientsPage(captures, result);
  const tree = await IngredientsPage({ searchParams: Promise.resolve(params) });
  return { html: renderToStaticMarkup(tree), captures };
}

function ingredientList(html) {
  const match = html.match(/<ul\b[^>]*data-ingredient-list[^>]*>[\s\S]*?<\/ul>/);
  assert.ok(match, "Expected the ingredient result list");
  return match[0];
}

function listItems(list) {
  return list.match(/<li\b[^>]*>[\s\S]*?<\/li>/g) ?? [];
}

function region(html, tag, ariaLabel) {
  const escaped = ariaLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<${tag}\\b[^>]*aria-label="${escaped}"[^>]*>[\\s\\S]*?<\\/${tag}>`));
  assert.ok(match, `Expected ${tag} labelled ${ariaLabel}`);
  return match[0];
}

function decodedHref(href) {
  return href.replaceAll("&amp;", "&");
}

function cssDeclarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected a CSS rule for ${selector}`);
  return match[1];
}

test("ingredient results use a semantic single list with one full-row detail link per item", async () => {
  const { html } = await renderPage();
  const list = ingredientList(html);
  const items = listItems(list);

  assert.equal((list.match(/<ul\b/g) ?? []).length, 1);
  assert.equal(items.length, ingredients.length);

  items.forEach((item, index) => {
    const anchors = item.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? [];
    assert.equal(anchors.length, 1, `${ingredients[index].name} should expose one row action`);
    assert.match(item, /^<li\b[^>]*><a\b[^>]*data-ingredient-detail-link="true"[^>]*>[\s\S]*<\/a><\/li>$/);
    const href = anchors[0].match(/\shref="([^"]+)"/)?.[1];
    assert.equal(href, `/ingredients/${encodeURIComponent(ingredients[index].id)}`);
  });

  assert.doesNotMatch(list, /href="\/ranking|랭킹(?:\s*보기)?/);
  for (const ingredient of ingredients) {
    assert.doesNotMatch(list, new RegExp(ingredient.description));
    for (const tag of ingredient.tags) assert.doesNotMatch(list, new RegExp(tag));
  }
});

test("rows show only Korean name, English name, role, and a caution-only badge", async () => {
  const { html } = await renderPage();
  const items = listItems(ingredientList(html));

  assert.match(items[0], /<h3>나이아신아마이드<\/h3>/);
  assert.match(items[0], /<span\s+lang="en"\s+class="englishName">Niacinamide<\/span>/);
  assert.match(items[0], /<span\s+class="role">피부톤 케어<\/span>/);
  assert.doesNotMatch(items[0], /class="caution"/);

  assert.match(items[1], /<h3>레티놀<\/h3>/);
  assert.match(items[1], /<span\s+lang="en"\s+class="englishName">Retinol<\/span>/);
  assert.match(items[1], /<span\s+class="caution">주의<\/span>/);

  assert.match(items[2], /<h3>정제수<\/h3>/);
  assert.doesNotMatch(items[2], /class="englishName"/);
  assert.match(items[2], /<span\s+class="role">역할 정보 확인 중<\/span>/);
  assert.doesNotMatch(items[2], /class="caution"/);
  assert.equal((ingredientList(html).match(/class="caution"/g) ?? []).length, 1);
  assert.doesNotMatch(ingredientList(html), /피부에 도움|기본 성분/);
});

test("GET search retains supported filter state while resetting pagination", async () => {
  const { html, captures } = await renderPage({
    query: ["  나이아신  ", "ignored"],
    status: "caution",
    tag: "  보습  ",
    page: "3",
    sort: "englishName",
    direction: "desc",
  });

  assert.deepEqual({ ...captures.queries[0] }, {
    query: "나이아신",
    status: "CAUTION",
    tag: "보습",
    page: 2,
    sort: "englishName",
    direction: "desc",
    size: 12,
  });
  assert.equal(captures.queries.length, 1);

  const formMatch = html.match(/<form\b[^>]*role="search"[^>]*>[\s\S]*?<\/form>/);
  assert.ok(formMatch, "Expected the GET ingredient search form");
  const form = formMatch[0];
  assert.match(form, /action="\/ingredients#ingredient-list"/);
  assert.match(form, /role="search"/);
  assert.doesNotMatch(form, /\smethod=/i);
  assert.match(form, /type="search"[^>]*name="query"[^>]*value="나이아신"/);
  for (const [name, value] of [["status", "CAUTION"], ["tag", "보습"], ["sort", "englishName"], ["direction", "desc"]]) {
    assert.match(form, new RegExp(`type="hidden"[^>]*name="${name}"[^>]*value="${value}"`));
  }
  assert.doesNotMatch(form, /name="page"/);

  const activeFilters = [
    ["성분 상태 필터", "주의해서 보기", ["전체 성분", "피부에 도움", "주의해서 보기", "기본 성분"]],
    ["성분 기능 필터", "보습", ["전체 기능", "보습", "진정", "장벽", "피부톤"]],
    ["성분 목록 정렬", "영문명순", ["가나다순", "영문명순", "역할순", "상태순"]],
    ["성분 정렬 방향", "내림차순", ["오름차순", "내림차순"]],
  ];
  for (const [label, selected, options] of activeFilters) {
    const nav = region(html, "nav", label);
    assert.equal((nav.match(/aria-current="page"/g) ?? []).length, 1);
    assert.match(nav, new RegExp(`aria-current="page"[^>]*>${selected}<\\/a>`));
    for (const option of options) assert.ok(nav.includes(option), `${label} should retain ${option}`);
  }
});

test("unsupported URL values fall back to the established query defaults", async () => {
  const { captures } = await renderPage({
    query: "  검색어  ",
    status: "unknown",
    tag: "  진정  ",
    page: "-2",
    sort: "popularity",
    direction: "sideways",
  });

  assert.deepEqual({ ...captures.queries[0] }, {
    query: "검색어",
    status: undefined,
    tag: "진정",
    page: 0,
    sort: "name",
    direction: "asc",
    size: 12,
  });
  assert.equal(captures.queries.length, 1);
});

test("filter and pagination URLs preserve state, reset changed-filter pages, and keep the list anchor", async () => {
  const { html } = await renderPage({
    query: "나이아신",
    status: "CAUTION",
    tag: "보습",
    page: "3",
    sort: "englishName",
    direction: "desc",
  });

  const statusNav = region(html, "nav", "성분 상태 필터");
  const goodHref = statusNav.match(/href="([^"]+)"[^>]*>피부에 도움<\/a>/)?.[1];
  assert.ok(goodHref);
  const filtered = new URL(decodedHref(goodHref), "https://example.test");
  assert.equal(filtered.pathname, "/ingredients");
  assert.equal(filtered.hash, "#ingredient-list");
  assert.deepEqual(Object.fromEntries(filtered.searchParams), {
    query: "나이아신",
    status: "GOOD",
    tag: "보습",
    sort: "englishName",
    direction: "desc",
  });

  const pagination = region(html, "nav", "성분 목록 페이지");
  for (const [label, expectedPage] of [["이전 페이지", "2"], ["다음 페이지", "4"]]) {
    const href = pagination.match(new RegExp(`href="([^"]+)"[^>]*aria-label="${label}"`))?.[1];
    assert.ok(href, `Expected ${label} link`);
    const target = new URL(decodedHref(href), "https://example.test");
    assert.equal(target.pathname, "/ingredients");
    assert.equal(target.hash, "#ingredient-list");
    assert.deepEqual(Object.fromEntries(target.searchParams), {
      query: "나이아신",
      status: "CAUTION",
      tag: "보습",
      page: expectedPage,
      sort: "englishName",
      direction: "desc",
    });
  }
});

test("ingredient rows keep a 72px minimum target, active and focus states, and reduced motion", () => {
  const rowRules = [...css.matchAll(/\.ingredientLink\s*\{([^}]*)\}/g)];
  assert.ok(rowRules.length >= 2, "Expected base and mobile ingredient row rules");
  for (const [, declarations] of rowRules) {
    const minHeight = declarations.match(/min-height:\s*([\d.]+)px/);
    if (minHeight) assert.ok(Number(minHeight[1]) >= 72, "ingredient rows must stay at least 72px high");
  }
  assert.match(cssDeclarations(".ingredientLink"), /display:\s*grid/);
  assert.match(cssDeclarations(".ingredientLink:active"), /background:\s*#[\da-f]+/i);
  assert.match(cssDeclarations(".ingredientLink:focus-visible"), /outline:\s*2px\s+solid/i);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.ingredientLink[\s\S]*?transition:\s*none[\s\S]*?\.skeleton\s*\{[^}]*animation:\s*none/);
});

test("loading state mirrors the compact row list instead of returning card placeholders", () => {
  const IngredientsLoading = loadIngredientsLoading();
  const html = renderToStaticMarkup(React.createElement(IngredientsLoading));

  assert.match(html, /aria-busy="true"[^>]*role="status"/);
  assert.equal((html.match(/class="skeleton skeletonRow"/g) ?? []).length, 7);
  assert.match(html, /성분 목록을 불러오는 중이에요/);
  assert.doesNotMatch(loadingSource, /grid-cols|aspect-\[|skeletonCard/);
  assert.match(cssDeclarations(".skeletonList"), /overflow:\s*hidden/);
  assert.match(cssDeclarations(".skeletonRow"), /height:\s*76px/);
  assert.match(cssDeclarations(".skeletonRow"), /border-radius:\s*0/);
});

test("the minimal page source does not reintroduce descriptions, tags, or ranking actions inside result rows", () => {
  const listStart = pageSource.indexOf("<ul className={styles.list}");
  const emptyStart = pageSource.indexOf(": <div className={styles.empty}", listStart);
  assert.notEqual(listStart, -1);
  assert.notEqual(emptyStart, -1);
  const listSource = pageSource.slice(listStart, emptyStart);

  assert.doesNotMatch(listSource, /ingredient\.description|ingredient\.tags|matchReasons|Ranking|rankingHref|\/ranking/);
  assert.equal((listSource.match(/<Link\b/g) ?? []).length, 1);
  assert.match(listSource, /href=\{`\/ingredients\/\$\{encodeURIComponent\(ingredient\.id\)\}`\}/);
});
