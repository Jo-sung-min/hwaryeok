import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { sanitizeReturnTo } from "../src/lib/safe-return-to.ts";

test("OAuth return paths stay on the Hwaryeok origin", () => {
  assert.equal(sanitizeReturnTo("/my?tab=reviews#profile"), "/my?tab=reviews#profile");
  assert.equal(sanitizeReturnTo("https://evil.example"), "/skin-check");
  assert.equal(sanitizeReturnTo("//evil.example"), "/skin-check");
  assert.equal(sanitizeReturnTo("/\\evil.example"), "/skin-check");
  assert.equal(sanitizeReturnTo("/%2e%2e//evil.example"), "/skin-check");
  assert.equal(sanitizeReturnTo("javascript:alert(1)"), "/skin-check");
  assert.equal(sanitizeReturnTo("/\\evil.example", "//also-unsafe.example"), "/");
});

test("the public OAuth start route accepts Kakao only", () => {
  const source = readFileSync(new URL("../src/app/api/auth/oauth/[provider]/route.ts", import.meta.url), "utf8");
  assert.match(source, /new Set\(\["kakao"\]\)/);
  assert.doesNotMatch(source, /new Set\(\["google", "kakao", "naver"\]\)/);
});
