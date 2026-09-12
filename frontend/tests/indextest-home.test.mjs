import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";

const route = readFileSync(new URL("../src/app/indextest/page.tsx", import.meta.url), "utf8");
const hero = readFileSync(new URL("../src/components/index-test-hero.tsx", import.meta.url), "utf8");
const heroCss = readFileSync(new URL("../src/components/index-test-hero.module.css", import.meta.url), "utf8");
const originalHome = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("indextest is an isolated noindex home experiment", () => {
  assert.match(route, /homePath="\/indextest"/);
  assert.match(route, /intro=\{<IndexTestHero\s*\/>\}/);
  assert.match(route, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(route, /redirect\(rankingHref\("\/ranking", filters\)\)/);
  assert.doesNotMatch(originalHome, /IndexTestHero|indextest/);
});

test("indextest hero keeps copy in HTML and references a durable local asset", () => {
  const assetPath = new URL("../public/indextest/hwaryeok-skincare-hero.png", import.meta.url);
  assert.equal(existsSync(assetPath), true);
  assert.ok(statSync(assetPath).size > 100_000);
  assert.match(hero, /INDEX_TEST_ASSETS\.hero/);
  assert.match(hero, /내 피부가 고르는/);
  assert.match(hero, /href="\/skin-check"/);
  assert.match(hero, /href="\/ranking"/);
  assert.doesNotMatch(hero, /https?:\/\//);
});

test("indextest hero is mobile-safe and honors reduced motion", () => {
  assert.match(heroCss, /\.hero\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*(?:clip|hidden);/s);
  assert.match(heroCss, /\.image\s*\{[^}]*max-width:\s*100%;[^}]*object-fit:\s*cover;/s);
  assert.match(heroCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(heroCss, /min-width:\s*594px|width:\s*100vw/);
});
