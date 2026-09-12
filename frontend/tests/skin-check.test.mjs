import test from "node:test";
import assert from "node:assert/strict";
import { skinQuestions, canContinue, chooseAnswer, firstMissingAnswer, skinTendency, toQuickProfile, resolveSkinDraftAnswers, resolveSkinDraftIngredients, restoreSkinDraft, restoreSkinDraftSummary, safeCheckView, skinAnswersFromProfile, DRAFT_MAX_AGE, answerLabel } from "../src/lib/skin-check.ts";
import { isQuickSkinProfile } from "../src/lib/quick-profile.ts";

const q = key => skinQuestions.find(question => question.key === key);
const complete = () => Object.fromEntries(skinQuestions.map(question => [question.key, question.multiple ? question.min ? [question.options[0].value] : [] : question.options[0].value]));
const draftRaw = ({
  answers = complete(),
  answersDirty = true,
  draftOwnerId = null,
  preferenceBaseIds = [],
  preferenceOwnerId = draftOwnerId,
  preferenceSelectionDirty = false,
  preferredIngredientIds = [],
  profileBaseKnown = true,
  profileBaseUpdatedAt = null,
  updatedAt = Date.now(),
  view = "result",
} = {}) => JSON.stringify({
  version: 3,
  updatedAt,
  answers,
  answersDirty,
  draftOwnerId,
  profileBaseKnown,
  profileBaseUpdatedAt,
  preferenceBaseIds,
  preferenceOwnerId,
  preferenceSelectionDirty,
  preferredIngredientIds,
  view,
});

test("16 unique questions start without preselected skin answers", () => {
  assert.equal(skinQuestions.length, 16);
  assert.equal(new Set(skinQuestions.map(q => q.key)).size, 16);
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
test("concerns require 1–4 choices; selecting again removes a choice", () => {
  let answers = {};
  assert.equal(canContinue(q("concerns"), answers), false);
  for (const option of q("concerns").options.slice(0, 5)) answers = chooseAnswer(answers, q("concerns"), option.value);
  assert.equal(answers.concerns.length, 4);
  answers = chooseAnswer(answers, q("concerns"), answers.concerns[0]);
  assert.equal(answers.concerns.length, 3);
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
  assert.equal(profile.cheekOiliness, answers.cheekOiliness);
  assert.deepEqual(profile.breakoutZones, []);
  assert.equal(isQuickSkinProfile(profile), true);
  delete answers.environments;
  assert.deepEqual(toQuickProfile(answers).environments, []);
});
test("draft restores answers and ingredient experience, expires old data and sanitizes values", () => {
  const now = Date.now();
  const restored = restoreSkinDraft(draftRaw({ updatedAt: now, preferredIngredientIds: ["ceramide-np"], preferenceSelectionDirty: true }), now);
  assert.deepEqual(restored.preferredIngredientIds, ["ceramide-np"]);
  assert.equal(restored.answersDirty, true);
  const corrupted = restoreSkinDraft(draftRaw({ answers: { ...complete(), oilinessLevel: "WRONG", concerns: ["invalid"] }, updatedAt: now }), now);
  assert.equal(corrupted.answers.oilinessLevel, undefined);
  assert.equal(corrupted.answers.concerns, undefined);
  assert.equal(restoreSkinDraft(draftRaw({ updatedAt: now - DRAFT_MAX_AGE - 1, view: 1 }), now), null);
  assert.equal(restoreSkinDraft("not json", now), null);
  assert.equal(restoreSkinDraft(draftRaw({ updatedAt: now + 61000, view: 1 }), now), null);
  assert.equal(restoreSkinDraft(JSON.stringify({ version: 2, answers: complete(), updatedAt: now, view: "result" }), now), null);
  assert.equal(safeCheckView(15, {}), 1);
  assert.equal(safeCheckView("NaN", complete()), 1);
  assert.equal(safeCheckView("result", complete()), "result");
  assert.equal(safeCheckView("result", {}), "review");
});
test("draft answers restore only for the same profile revision or a guest handoff", () => {
  const saved = { ...complete(), hydrationLevel: "HIGH" };
  const same = restoreSkinDraft(draftRaw({ draftOwnerId: "user-a", profileBaseUpdatedAt: "2026-09-12T01:00:00Z", answers: { hydrationLevel: "LOW" } }));
  assert.deepEqual(resolveSkinDraftAnswers(saved, same, "user-a", "2026-09-12T01:00:00Z"), {
    answers: { ...saved, hydrationLevel: "LOW" }, dirty: true, ownerCompatible: true,
  });
  assert.deepEqual(resolveSkinDraftAnswers(saved, same, "user-a", "2026-09-12T02:00:00Z"), {
    answers: saved, dirty: false, ownerCompatible: true,
  });
  assert.equal(resolveSkinDraftAnswers(saved, same, "user-a", null, false).answers.hydrationLevel, "LOW");
  const unknownBase = restoreSkinDraft(draftRaw({
    draftOwnerId: "user-a",
    profileBaseKnown: false,
    profileBaseUpdatedAt: null,
    answers: { hydrationLevel: "LOW" },
  }));
  assert.equal(resolveSkinDraftAnswers(saved, unknownBase, "user-a", "recovered-server-revision").answers.hydrationLevel, "LOW");
  assert.equal(resolveSkinDraftAnswers(saved, same, "user-b", "2026-09-12T01:00:00Z").ownerCompatible, false);
  const guest = restoreSkinDraft(draftRaw({ answers: { hydrationLevel: "LOW" } }));
  assert.equal(resolveSkinDraftAnswers(saved, guest, "user-a", "newer-server-revision").answers.hydrationLevel, "LOW");
});
test("draft ingredient choices preserve exact same-user edits and ordered server bases", () => {
  const exact = restoreSkinDraft(draftRaw({
    draftOwnerId: "user-a",
    preferenceOwnerId: "user-a",
    preferenceBaseIds: ["a", "b"],
    preferenceSelectionDirty: true,
    preferredIngredientIds: ["b", "c"],
  }));
  assert.deepEqual(resolveSkinDraftIngredients(["a", "b"], exact, "user-a"), {
    ids: ["b", "c"], dirty: true, overflowed: false, ownerCompatible: true,
  });
  assert.deepEqual(resolveSkinDraftIngredients(["b", "a"], exact, "user-a").ids, ["b", "a"]);
  assert.equal(resolveSkinDraftIngredients(["a", "b"], exact, "user-b").ownerCompatible, false);
  assert.deepEqual(resolveSkinDraftIngredients(null, exact, "user-a"), {
    ids: ["b", "c"], dirty: true, overflowed: false, ownerCompatible: true,
  });
});
test("guest ingredient handoff keeps server order, appends new choices and reports overflow", () => {
  const saved = Array.from({ length: 9 }, (_, index) => `saved-${index}`);
  const guest = restoreSkinDraft(draftRaw({
    preferenceSelectionDirty: true,
    preferredIngredientIds: ["guest-a", "saved-1", "guest-b"],
  }));
  assert.deepEqual(resolveSkinDraftIngredients(saved, guest, "user-a"), {
    ids: [...saved, "guest-a"], dirty: true, overflowed: true, ownerCompatible: true,
  });
});
test("saved profile answers feed the same check while legacy gaps remain explicit", () => {
  const saved = { configured: true, ...toQuickProfile(complete()), profileVersion: 1, createdAt: null, updatedAt: null };
  assert.deepEqual(skinAnswersFromProfile(saved), complete());
  const oldConcerns = skinAnswersFromProfile({ ...saved, concerns: ["속건조", "민감", "모공", "탄력"] });
  assert.deepEqual(oldConcerns.concerns, ["속건조·당김", "붉은기·민감", "블랙헤드·모공", "탄력·잔주름"]);
  const legacy = { ...saved, cheekOiliness: null };
  const restored = skinAnswersFromProfile(legacy);
  assert.equal(restored.cheekOiliness, undefined);
  assert.equal(firstMissingAnswer(restored), 1);
  assert.equal(safeCheckView("result", restored), "review");
});
test("home summary distinguishes a generated report from complete answers still under review", () => {
  const now = Date.now();
  assert.deepEqual(restoreSkinDraftSummary(draftRaw({ updatedAt: now, view: "result" }), now), { skinType: "건성", hasReport: true });
  assert.deepEqual(restoreSkinDraftSummary(draftRaw({ updatedAt: now, view: "review" }), now), { skinType: "건성", hasReport: false });
  assert.equal(restoreSkinDraftSummary(draftRaw({ answers: {}, updatedAt: now, view: "result" }), now), null);
  const userDraft = draftRaw({ draftOwnerId: "user-a", profileBaseUpdatedAt: "revision-a", updatedAt: now });
  assert.equal(restoreSkinDraftSummary(userDraft, now, "user-b", "revision-a"), null);
  assert.equal(restoreSkinDraftSummary(userDraft, now, "user-a", "revision-b"), null);
  assert.deepEqual(restoreSkinDraftSummary(userDraft, now, "user-a", "revision-a"), { skinType: "건성", hasReport: true });
});
test("profile boundary rejects malformed or incomplete request bodies", () => {
  const profile = toQuickProfile(complete());
  for (const invalid of [null, {}, [], { ...profile, concerns: null }, { ...profile, concerns: [] }, { ...profile, cheekOiliness: null }, { ...profile, breakoutZones: null }, { ...profile, sunscreenUsage: "900c" }, { ...profile, environments: [123] }]) assert.equal(isQuickSkinProfile(invalid), false);
});
