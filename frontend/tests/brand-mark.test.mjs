import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const navigation = readFileSync(new URL("../src/components/navigation.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/components/navigation.module.css", import.meta.url), "utf8");
const markUrl = new URL("../public/brand/hwaryeok-flower-mark.png", import.meta.url);

test("header uses the transparent flower mark without the former text tile", () => {
  assert.match(navigation, /<span className=\{styles\.brandMark\} aria-hidden="true" \/>/);
  assert.doesNotMatch(navigation, /brandMark[^>]*>화<\/span>/);
  assert.match(styles, /\.brandMark\s*\{[^}]*url\("\/brand\/hwaryeok-flower-mark\.png"\)[^}]*contain/s);
  assert.doesNotMatch(styles.match(/\.brandMark\s*\{([^}]*)\}/s)?.[1] ?? "", /#b83e69|color:\s*#fff/);
});

test("flower mark is a compact RGBA PNG suitable for the header", () => {
  const bytes = readFileSync(markUrl);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(bytes.readUInt32BE(16), 256);
  assert.equal(bytes.readUInt32BE(20), 256);
  assert.equal(bytes[25], 6, "PNG color type must be RGBA");
  assert.ok(statSync(markUrl).size < 150_000);
});
