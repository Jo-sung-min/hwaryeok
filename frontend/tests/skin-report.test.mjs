import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const filename = new URL(path, import.meta.url).pathname;
  const { code } = transformSync(readFileSync(new URL(path, import.meta.url), "utf8"), {
    filename, babelrc: false, configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default, [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }]],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === "./skin-check" || name === "@/lib/skin-check") return load("../src/lib/skin-check.ts");
    if (name === "@/lib/skin-report") return load("../src/lib/skin-report.ts");
    if (name === "@/lib/skin-care-guide") return load("../src/lib/skin-care-guide.ts");
    if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (["react", "react/jsx-runtime", "lucide-react"].includes(name)) return require(name);
    throw Error("Unexpected import " + name);
  } });
  cache.set(path, module.exports);
  return module.exports;
}
const { skinQuestions } = load("../src/lib/skin-check.ts");
const { buildSkinReport, populationShare } = load("../src/lib/skin-report.ts");
const { SkinReport } = load("../src/app/skin-check/skin-report.tsx");
const answers = () => ({ ...Object.fromEntries(skinQuestions.map(q => [q.key, q.multiple ? q.min ? [q.options[0].value] : [] : q.options[0].value])), oilinessLevel: "LOW", cheekOiliness: "HIGH", hydrationLevel: "BALANCED", sensitivityLevel: "MEDIUM", rednessFrequency: "FREQUENT" });
const stats = { status: "AVAILABLE", sampleSize: 30, minimumSample: 30, distribution: [{ skinType: "복합성", count: 12, percentage: 99 }], calculatedAt: "2026-09-10T00:00:00Z" };

test("report follows actual answers including reverse combination pattern", () => {
  const report = buildSkinReport(answers());
  assert.equal(report.tendency.type, "복합성");
  assert.equal(report.code, "C · B · M · R");
  assert.equal(report.axes.length, 4);
  assert.match(report.details[1].text, /자주/);
  assert.equal(buildSkinReport({}), null);
});
test("percent is computed from real counts and never invented for missing/small samples", () => {
  assert.equal(populationShare(stats, "복합성").percentage, 40);
  assert.equal(populationShare(null, "복합성"), null);
  assert.equal(populationShare({ ...stats, status: "COLLECTING" }, "복합성"), null);
  assert.equal(populationShare({ ...stats, sampleSize: 29 }, "복합성"), null);
  assert.equal(populationShare(stats, "건성"), null);
  assert.equal(populationShare({ ...stats, distribution: [{ skinType: "복합성", count: 31 }] }, "복합성"), null);
});
test("report renders detailed read-only content and labelled cohort percentage", () => {
  const html = renderToStaticMarkup(React.createElement(SkinReport, { answers: answers(), statistics: stats }));
  assert.match(html, /부위별 균형 조율가/);
  assert.match(html, /40\.0/);
  assert.match(html, /30명 중 12명/);
  assert.match(html, /프로필을 저장한 화력 회원/);
  assert.match(html, /내 피부에는 무엇을 먼저 고르면 좋을까요/);
  assert.match(html, /히알루론산|세라마이드/);
  assert.match(html, /추천 제형/);
  assert.match(html, /\/principles#skin-guide/);
  assert.doesNotMatch(html, /좋고 나쁨|의학적으로 검증|효과를 보장|임의의 퍼센트|비활성 계정/);
  assert.match(html, /피부가 보내는 세부 신호/);
  assert.match(html, /내 일상에 맞춘 사용 팁/);
  assert.doesNotMatch(html, /<button|<input|수정/);
});
test("collecting and unavailable stats have distinct honest empty states", () => {
  const render = statistics => renderToStaticMarkup(React.createElement(SkinReport, { answers: answers(), statistics }));
  assert.match(render({ ...stats, status: "COLLECTING", sampleSize: null, distribution: [] }), /피부 체크가 더 모이면/);
  assert.match(render(null), /같은 피부 비율을 잠시 확인할 수 없어요/);
  assert.doesNotMatch(render(null), /\d+\.\d+%/);
});

test("care guidance changes with dryness, oiliness and reported reactions", () => {
  const { buildSkinCareGuide } = load("../src/lib/skin-care-guide.ts");
  const dry = buildSkinCareGuide({ skinType: "건성", hydrationLevel: "LOW" });
  const oily = buildSkinCareGuide({ skinType: "지성", hydrationLevel: "BALANCED" });
  assert.match(dry.texture, /크림/);
  assert.equal(dry.ingredients[0].name, "세라마이드");
  assert.match(oily.texture, /젤·로션/);
  assert.match(oily.check.title, /논코메도제닉/);
  assert.match(buildSkinCareGuide({ skinType: "수부지", hydrationLevel: "LOW" }).summary, /수분 보습/);
  assert.match(buildSkinCareGuide({ skinType: "복합성" }).application, /번들거리는 부위.*당기는 부위/);
  assert.match(buildSkinCareGuide({ skinType: "지성", sensitivityLevel: "HIGH" }).check.title, /향료 없는/);
  assert.match(buildSkinCareGuide({ reactionTriggers: ["향료"] }).check.title, /향료 없는/);
  assert.doesNotMatch(buildSkinCareGuide({ skinType: "중성" }).summary, /모든 제품|보장/);
});

test("combination guidance follows the actual oily region, not a fixed T-zone assumption", () => {
  const render = input => renderToStaticMarkup(React.createElement(SkinReport, { answers: input, statistics: null }));
  assert.match(render(answers()), /양쪽 볼의 번들거림/);
  assert.match(render({ ...answers(), oilinessLevel: "HIGH", cheekOiliness: "LOW" }), /이마·코의 번들거림/);
});

test("personal ranking uses the same guide and explanations remain available on the policy page", () => {
  const ranking = readFileSync(new URL("../src/app/ranking/personal/page.tsx", import.meta.url), "utf8");
  const policy = readFileSync(new URL("../src/app/principles/page.tsx", import.meta.url), "utf8");
  assert.match(ranking, /buildSkinCareGuide\(profile\)/);
  assert.match(ranking, /care\.summary|care\.texture/);
  assert.match(ranking, /\/principles#skin-guide/);
  assert.doesNotMatch(ranking, /실제 사용감이나 피부 반응을 보장하지/);
  assert.match(policy, /id="skin-guide"/);
  assert.match(policy, /좋고 나쁨|실제 사용자 리뷰점수와 별개/);
  assert.match(policy, /최소 30명/);
});
