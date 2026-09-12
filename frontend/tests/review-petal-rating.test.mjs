import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

function loadRating() {
  const filename = fileURLToPath(new URL("../src/components/review-petal-rating.tsx", import.meta.url));
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
    require: (specifier) => {
      if (specifier === "react/jsx-runtime") return require(specifier);
      if (specifier === "./review-petal-rating.module.css") return {
        __esModule: true,
        default: new Proxy({}, { get: (_, name) => String(name) }),
      };
      throw new Error(`Unexpected rating dependency: ${specifier}`);
    },
  }, { filename });
  return localModule.exports;
}

const { getReviewPetalCount, ReviewPetalRating } = loadRating();

test("100-point review scores map to the requested integer petal bands", () => {
  for (const [score, petals] of [
    [0, 0], [19.9, 0], [20, 1], [39.9, 1], [40, 2], [59.9, 2],
    [60, 3], [79.9, 3], [80, 4], [99.9, 4], [100, 5], [120, 5],
  ]) assert.equal(getReviewPetalCount(score), petals, `${score}점`);
  for (const score of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    assert.equal(getReviewPetalCount(score), 0);
  }
});

test("rating renders only earned petals while keeping the exact score accessible", () => {
  const html = renderToStaticMarkup(React.createElement(ReviewPetalRating, { score: 84, compact: true }));
  assert.match(html, /data-petal-count="4"/);
  assert.match(html, /data-score-on-five="4\.2"/);
  assert.match(html, /aria-label="리뷰점수 84\.0 \/ 100, 5점 환산 4\.2점, 꽃잎 4개"/);
  assert.equal((html.match(/class="petal"/g) ?? []).length, 4);
  assert.equal(renderToStaticMarkup(React.createElement(ReviewPetalRating, { score: null })), "");
});

test("single-petal asset is a compact transparent RGBA PNG", () => {
  const png = readFileSync(new URL("../public/ratings/review-petal.png", import.meta.url));
  assert.deepEqual(Array.from(png.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 128);
  assert.equal(png.readUInt32BE(20), 128);
  assert.equal(png[24], 8);
  assert.equal(png[25], 6);
  assert.ok(png.byteLength < 50_000);
});
