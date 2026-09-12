import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const typescript = require("next/dist/compiled/babel/preset-typescript").default;
const react = require("next/dist/compiled/babel/preset-react").default;
const commonjs = require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default;
const moduleCache = new Map();
const realModules = new Map([
  ["@/components/favorite-heart-icon", "../src/components/favorite-heart-icon.tsx"],
]);

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
    if (specifier === "next/image") return ({ fill: _fill, ...props }) => React.createElement("img", props);
    if (specifier === "next/navigation") return { useRouter: () => ({ push: () => {} }) };
    if (specifier === "lucide-react") return new Proxy({}, {
      get: (_, name) => name === "__esModule" ? true : ({ size, ...props }) => React.createElement("svg", { ...props, "data-icon": name }),
    });
    if (specifier.endsWith(".module.css")) return {
      __esModule: true,
      default: new Proxy({}, { get: (_, name) => String(name) }),
    };
    if (specifier === "@/app/favorites/actions") return {
      setFavoriteAction: async (_productId, favorited) => ({ success: true, favorited, requiresLogin: false, message: "저장됨" }),
    };
    if (specifier === "@/lib/media") return { resolveProductImageUrl: (value) => value };
    throw new Error(`Unapproved favorite render-test dependency: ${specifier}`);
  };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    require: isolatedRequire,
  }, { filename });
  moduleCache.set(relativePath, localModule.exports);
  return localModule.exports;
}

const { FavoriteHeartIcon } = loadSource("../src/components/favorite-heart-icon.tsx");
const { FavoriteButton } = loadSource("../src/components/product-ui.tsx");
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const favoriteHeartCss = readFileSync(new URL("../src/components/favorite-heart-icon.module.css", import.meta.url), "utf8");
const favoriteButtonCss = readFileSync(new URL("../src/components/favorite-button.module.css", import.meta.url), "utf8");
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

function buttonClass(markup) {
  const button = markup.match(/<button\b[^>]*>/)?.[0] ?? "";
  const className = button.match(/\bclass="([^"]*)"/)?.[1] ?? "";
  assert.ok(button, "FavoriteButton should render a native button");
  return { button, className, classes: new Set(className.split(/\s+/).filter(Boolean)) };
}

function assertCleanFortyFourPixelButton(markup) {
  const { button, className, classes } = buttonClass(markup);
  assert.ok(classes.has("button"), `FavoriteButton should use its clean artwork-only CSS module: ${className}`);
  assert.doesNotMatch(className, /(?:^|\s)glass-choice(?:\s|$)/, "favorite artwork must not inherit the bordered glass control");
  assert.doesNotMatch(button, /\bstyle="[^"]*(?:border|background|box-shadow)\s*:/, "call sites should not override the shared clean button visuals inline");
}

test("watercolor favorite icon maps saved and unsaved state to the supplied sprite frames", () => {
  const outline = render(FavoriteHeartIcon, { favorited: false });
  assert.match(outline, /data-favorite-heart="outline"/);
  assert.match(outline, /aria-hidden="true"/);
  assert.doesNotMatch(outline, /<svg|찜하기|찜 취소/);

  const filled = render(FavoriteHeartIcon, { favorited: true });
  assert.match(filled, /data-favorite-heart="filled"/);
  assert.match(filled, /aria-hidden="true"/);
  assert.doesNotMatch(filled, /<svg|찜하기|찜 취소/);
});

test("every FavoriteButton defaults to the watercolor artwork while keeping its accessible state", () => {
  const outline = render(FavoriteButton, {
    productId: "toner",
    initialFavorited: false,
    isAuthenticated: true,
    small: true,
  });
  assert.match(outline, /aria-label="찜하기"/);
  assert.match(outline, /aria-pressed="false"/);
  assert.match(outline, /aria-busy="false"/);
  assert.match(outline, /data-favorite-heart="outline"/);
  assert.doesNotMatch(outline, /data-icon="Heart"/);

  const filled = render(FavoriteButton, {
    productId: "toner",
    initialFavorited: true,
    isAuthenticated: true,
  });
  assert.match(filled, /aria-label="찜 취소"/);
  assert.match(filled, /aria-pressed="true"/);
  assert.match(filled, /aria-busy="false"/);
  assert.match(filled, /data-favorite-heart="filled"/);
  assert.doesNotMatch(filled, /data-icon="Heart"/);

  assertCleanFortyFourPixelButton(outline);
  assertCleanFortyFourPixelButton(filled);
});

test("all FavoriteButton call sites rely on watercolor artwork and cannot opt back into the old glyph", () => {
  const usageFiles = sourceFiles(sourceRoot).filter((path) => [".tsx", ".jsx"].includes(extname(path)));
  const usages = usageFiles.flatMap((path) => {
    const source = readFileSync(path, "utf8");
    return [...source.matchAll(/<FavoriteButton\b[\s\S]*?\/>/g)].map((match) => ({ path, tag: match[0] }));
  });

  assert.ok(usages.length >= 7, `expected to inspect every FavoriteButton call site, found ${usages.length}`);
  for (const usage of usages) {
    assert.doesNotMatch(usage.tag, /\bartwork\s*=\s*(?:"standard"|'standard'|\{\s*["']standard["']\s*\})/, `${usage.path} must not select the old heart glyph`);
  }
});

test("FavoriteButton CSS removes the old circle chrome without shrinking the click target", () => {
  const baseRule = favoriteButtonCss.match(/(?:^|\n)\.button\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.notEqual(baseRule, "", "FavoriteButton should have a shared base rule");

  for (const property of ["width", "min-width", "height", "min-height"]) {
    const pixels = Number(baseRule.match(new RegExp(`(?:^|;)\\s*${property}:\\s*([\\d.]+)px`))?.[1]);
    assert.ok(Number.isFinite(pixels) && pixels >= 44, `${property} must preserve a 44px or larger click target`);
  }
  assert.match(baseRule, /(?:^|;)\s*border:\s*(?:0|none)\s*;/);
  assert.match(baseRule, /(?:^|;)\s*background:\s*transparent\s*;/);
  assert.match(baseRule, /(?:^|;)\s*box-shadow:\s*none\s*;/);

  for (const match of favoriteButtonCss.matchAll(/\.button[^{}]*\{([^}]*)\}/g)) {
    const declarations = match[1];
    for (const property of declarations.matchAll(/(?:^|;)\s*(background|box-shadow)\s*:\s*([^;]+)/g)) {
      const [, name, value] = property;
      if (name === "background") assert.equal(value.trim(), "transparent", "FavoriteButton states must not restore a visible background");
      if (name === "box-shadow") assert.equal(value.trim(), "none", "FavoriteButton states must not restore a shadow");
    }
  }
});

test("favorite placement styles never restore a visible button border, background, or shadow", () => {
  const cssFiles = sourceFiles(sourceRoot).filter((path) => extname(path) === ".css");
  const rules = cssFiles.flatMap((path) => {
    const css = readFileSync(path, "utf8");
    return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((match) => /\.favorite\b/.test(match[1]) && /button/.test(match[1]))
      .map((match) => ({ path, selector: match[1].trim(), declarations: match[2] }));
  });

  assert.ok(rules.length > 0, "expected favorite button placement styles to be inspected");
  for (const { path, selector, declarations } of rules) {
    for (const match of declarations.matchAll(/(?:^|;)\s*(background(?:-color)?|border(?:-(?:color|width))?|box-shadow)\s*:\s*([^;]+)/g)) {
      const [, property, rawValue] = match;
      const value = rawValue.replace(/\s*!important\s*$/, "").trim();
      if (property.startsWith("background")) assert.match(value, /^(?:none|transparent)$/i, `${path} ${selector} must keep the favorite background transparent`);
      if (property === "box-shadow") assert.match(value, /^none$/i, `${path} ${selector} must not add a favorite shadow`);
      if (property.startsWith("border")) assert.match(value, /^(?:0(?:px)?|none|transparent)$/i, `${path} ${selector} must not add a visible favorite border`);
    }
  }
});

test("favorite heart CSS crops both sprite frames around their alpha-weighted visual centers without distortion", () => {
  assert.match(favoriteHeartCss, /background-image:\s*url\("\/favorites\/favorite-hearts\.png"\)/);
  assert.match(favoriteHeartCss, /background-repeat:\s*no-repeat/);
  assert.match(favoriteHeartCss, /background-size:\s*250%\s+auto/);
  assert.match(favoriteHeartCss, /\.filled\s*\{[^}]*background-position:\s*13\.2%\s+52%/s);
  assert.match(favoriteHeartCss, /\.outline\s*\{[^}]*background-position:\s*86\.8%\s+52%/s);
  assert.match(favoriteHeartCss, /\.small\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px/s);
  assert.match(favoriteHeartCss, /\.regular\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px/s);
});

test("favorite hearts use the supplied two-frame transparent RGBA PNG", () => {
  const png = readFileSync(new URL("../public/favorites/favorite-hearts.png", import.meta.url));
  assert.deepEqual(Array.from(png.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(png.readUInt32BE(16), 1536);
  assert.equal(png.readUInt32BE(20), 1024);
  assert.equal(png.readUInt32BE(16) / 2, 768, "sprite should contain two equal-width frames");
  assert.equal(png[24], 8, "sprite should use 8-bit channels");
  assert.equal(png[25], 6, "sprite should include an RGBA alpha channel");
  assert.equal(png[28], 0, "sprite should not require interlaced decoding");
  assert.ok(png.byteLength > 100_000);
  assert.ok(png.byteLength < 2_500_000);
});
