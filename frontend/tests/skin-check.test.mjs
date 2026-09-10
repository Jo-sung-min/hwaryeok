import test from "node:test";
import assert from "node:assert/strict";
import { skinQuestions, canContinue, chooseAnswer, firstMissingAnswer, skinTendency, toQuickProfile, restoreSkinDraft, safeCheckView, DRAFT_MAX_AGE, answerLabel } from "../src/lib/skin-check.ts";
import { isQuickSkinProfile } from "../src/lib/quick-profile.ts";

const q = key => skinQuestions.find(question => question.key === key);
const complete = () => Object.fromEntries(skinQuestions.map(question => [question.key, question.multiple ? question.min ? [question.options[0].value] : [] : question.options[0].value]));

test("15 unique questions start without preselected skin answers", () => {
  assert.equal(skinQuestions.length, 15);
  assert.equal(new Set(skinQuestions.map(q => q.key)).size, 15);
  assert.equal(firstMissingAnswer({}), 0);
  assert.equal(toQuickProfile({}), null);
  assert.equal(canContinue(q("oilinessLevel"), {}), false);
});
test("answer editing keeps all other answers intact", () => {
  const previous = complete();
  const updated = chooseAnswer(previous, q("hydrationLevel"), "HIGH");
  assert.equal(updated.hydrationLevel, "HIGH");
  assert.equal(previous.hydrationLevel, "LOW");
  for (const key of Object.keys(previous).filter(key => key !== "hydrationLevel")) assert.deepEqual(updated[key], previous[key]);
});
test("concerns require 1–3 choices; selecting again removes a choice", () => {
  let answers = {};
  assert.equal(canContinue(q("concerns"), answers), false);
  for (const option of q("concerns").options.slice(0, 4)) answers = chooseAnswer(answers, q("concerns"), option.value);
  assert.equal(answers.concerns.length, 3);
  answers = chooseAnswer(answers, q("concerns"), answers.concerns[0]);
  assert.equal(answers.concerns.length, 2);
});
test("unknown trigger is exclusive and optional choices can be skipped", () => {
  let answers = chooseAnswer({}, q("reactionTriggers"), "향료");
  answers = chooseAnswer(answers, q("reactionTriggers"), "아직 모름");
  assert.deepEqual(answers.reactionTriggers, ["아직 모름"]);
  answers = chooseAnswer(answers, q("reactionTriggers"), "에탄올");
  assert.deepEqual(answers.reactionTriggers, ["에탄올"]);
  assert.equal(canContinue(q("environments"), {}), true);
  assert.equal(answerLabel(q("environments"), { environments: [] }), "선택한 항목 없음");
});
test("oil, cheek oil and dry feeling produce transparent separate tendencies", () => {
  const cases = [
    ["LOW", "LOW", "LOW", "건성"],
    ["HIGH", "HIGH", "BALANCED", "지성"],
    ["HIGH", "HIGH", "LOW", "수부지"],
    ["HIGH", "LOW", "LOW", "복합성"],
    ["BALANCED", "BALANCED", "BALANCED", "중성"],
  ];
  for (const [oilinessLevel, cheekOiliness, hydrationLevel, type] of cases) {
    const tendency = skinTendency({ oilinessLevel, cheekOiliness, hydrationLevel, sensitivityLevel: "HIGH" });
    assert.equal(tendency.type, type);
    assert.equal(tendency.sensitive, true);
    assert.equal(tendency.reasons.length, 3);
  }
  assert.equal(skinTendency({ oilinessLevel: "HIGH" }), null);
});
test("recommendation payload preserves explicitly answered details without fabricating them", () => {
  const answers = { ...complete(), hydrationLevel: "LOW", sensitivityLevel: "HIGH", cleansingTightness: "NONE", rednessFrequency: "RARE", poreLevel: "LOW" };
  const profile = toQuickProfile(answers);
  assert.equal(profile.cleansingTightness, "NONE");
  assert.equal(profile.rednessFrequency, "RARE");
  assert.equal(profile.poreLevel, "LOW");
  assert.equal("cheekOiliness" in profile, false);
  assert.equal(isQuickSkinProfile(profile), true);
  delete answers.environments;
  assert.deepEqual(toQuickProfile(answers).environments, []);
});
test("draft restores a complete report's answers, expires old data and sanitizes values", () => {
  const now = Date.now();
  const raw = (answers, view = "result", updatedAt = now) => JSON.stringify({ version: 2, answers, view, updatedAt });
  assert.equal(restoreSkinDraft(raw(complete()), now).view, "result");
  const corrupted = restoreSkinDraft(raw({ ...complete(), oilinessLevel: "WRONG", concerns: ["invalid"] }), now);
  assert.equal(corrupted.answers.oilinessLevel, undefined);
  assert.equal(corrupted.answers.concerns, undefined);
  assert.equal(restoreSkinDraft(raw(complete(), 1, now - DRAFT_MAX_AGE - 1), now), null);
  assert.equal(restoreSkinDraft("not json", now), null);
  assert.equal(restoreSkinDraft(raw(complete(), 1, now + 61000), now), null);
  assert.equal(safeCheckView(15, {}), 1);
  assert.equal(safeCheckView("NaN", complete()), 1);
  assert.equal(safeCheckView("result", complete()), "result");
  assert.equal(safeCheckView("result", {}), "review");
});
test("profile boundary rejects malformed or incomplete request bodies", () => {
  const profile = toQuickProfile(complete());
  for (const invalid of [null, {}, [], { ...profile, concerns: null }, { ...profile, concerns: [] }, { ...profile, sunscreenUsage: "900c" }, { ...profile, environments: [123] }]) assert.equal(isQuickSkinProfile(invalid), false);
});
