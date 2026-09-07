import test from "node:test";
import assert from "node:assert/strict";
import { homeSkinProfileChips } from "../src/lib/home-personalization.ts";

test("unconfigured or missing profiles have no assumed skin traits", () => {
  assert.deepEqual(homeSkinProfileChips(null), []);
  assert.deepEqual(homeSkinProfileChips({ configured: false, skinType: "건성", hydrationLevel: "LOW" }), []);
});

test("saved answers are labelled without changing their values", () => {
  assert.deepEqual(homeSkinProfileChips({
    configured: true, skinType: "수부지", hydrationLevel: "LOW", oilinessLevel: "HIGH", sensitivityLevel: "MEDIUM",
  }), [
    { label: "피부 타입", value: "수부지" },
    { label: "수분", value: "수분 부족" },
    { label: "유분", value: "유분 많음" },
    { label: "민감도", value: "민감도 보통" },
  ]);
});

test("incomplete profiles never receive defaults", () => {
  assert.deepEqual(homeSkinProfileChips({
    configured: true, skinType: "  ", hydrationLevel: null, oilinessLevel: "BALANCED", sensitivityLevel: null,
  }), [{ label: "유분", value: "유분 균형" }]);
});

test("unknown level values are omitted rather than shown as known answers", () => {
  assert.deepEqual(homeSkinProfileChips({
    configured: true, skinType: " 건성 ", hydrationLevel: "UNKNOWN", oilinessLevel: null, sensitivityLevel: "UNKNOWN",
  }), [{ label: "피부 타입", value: "건성" }]);
});
