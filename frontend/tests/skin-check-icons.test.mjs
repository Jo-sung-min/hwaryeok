import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const typescript = require("next/dist/compiled/babel/preset-typescript").default;
const commonjs = require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default;

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function compile(relativePath) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { code } = transformSync(readFileSync(filename, "utf8"), {
    filename, babelrc: false, configFile: false, presets: [typescript], plugins: [commonjs],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    Math,
    require: (specifier) => { throw new Error(`Unexpected dependency: ${specifier}`); },
  });
  return module.exports;
}

const icons = compile("../src/lib/skin-check-icons.ts");
const { skinQuestions } = compile("../src/lib/skin-check.ts");

test("every skin-check option has its own picture on the sheet", () => {
  const keys = Array.from(icons.SKIN_CHECK_ICON_KEYS);
  assert.equal(new Set(keys).size, keys.length, "an icon key is listed twice");
  const expected = skinQuestions.flatMap((question) => question.options.map((option) => `${question.key}:${option.value}`));
  assert.deepEqual([...keys].sort(), [...expected].sort());
  assert.equal(icons.SKIN_CHECK_ICON_ROWS, Math.ceil(keys.length / icons.SKIN_CHECK_ICON_SHEET.columns));
});

test("an option's picture is cut from the sheet by its position", () => {
  const url = "https://cdn.example.com/assets/skin-check/option-icons-v1.webp";
  const first = icons.skinCheckIconStyle("oilinessLevel", "LOW", url);
  assert.equal(first.backgroundImage, `url("${url}")`);
  assert.equal(first.backgroundSize, `${icons.SKIN_CHECK_ICON_SHEET.columns * 100}% ${icons.SKIN_CHECK_ICON_ROWS * 100}%`);
  assert.equal(first.backgroundPosition, "0% 0%");

  const keys = Array.from(icons.SKIN_CHECK_ICON_KEYS);
  const [question, value] = keys.at(-1).split(":");
  const last = icons.skinCheckIconStyle(question, value, url);
  const lastColumn = (keys.length - 1) % icons.SKIN_CHECK_ICON_SHEET.columns;
  assert.equal(last.backgroundPosition, `${(lastColumn / (icons.SKIN_CHECK_ICON_SHEET.columns - 1)) * 100}% 100%`);

  assert.equal(icons.skinCheckIconStyle("concerns", "없는 고민", url), null);
});

test("the sheet is served from the CDN and the screen falls back to line icons without it", () => {
  const check = source("../src/app/skin-check/quick-skin-check.tsx");
  const media = source("../src/lib/media.ts");
  assert.match(icons.skinCheckIconSheetPath(), /^\/assets\/skin-check\/option-icons-v\d+\.webp$/);
  assert.match(media, /export function resolveAssetUrl/);
  assert.match(check, /resolveAssetUrl\(skinCheckIconSheetPath\(\)\)/);
  assert.match(check, /art \? <span className=\{styles\.optionArt\}[^>]*\/> : <Icon/);
});
