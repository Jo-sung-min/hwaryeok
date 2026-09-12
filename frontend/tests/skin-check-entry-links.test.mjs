import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the legacy profile page verifies the session before redirecting to the ingredient finder", () => {
  const page = source("../src/app/profile/page.tsx");
  const sessionCheck = page.indexOf('await requireSession("/profile")');
  const redirect = page.indexOf('redirect("/skin-check")');

  assert.ok(sessionCheck >= 0);
  assert.ok(redirect > sessionCheck);
});

test("skin profile entry links share the canonical skin-check route", () => {
  const sources = [
    source("../src/app/my/page.tsx"),
    source("../src/app/ranking/personal/page.tsx"),
    source("../src/app/signup/signup-form.tsx"),
  ];

  for (const routeSource of sources) {
    assert.match(routeSource, /href="\/skin-check"/);
    assert.doesNotMatch(routeSource, /href="\/profile(?:\?|"|#)/);
  }
});

test("the unified entry refreshes sessions and never treats failed preference loading as an empty list", () => {
  const page = source("../src/app/skin-check/page.tsx");
  const check = source("../src/app/skin-check/quick-skin-check.tsx");
  assert.match(page, /!session && tokens\.refreshToken/);
  assert.match(page, /\/api\/auth\/refresh\?returnTo=/);
  assert.match(page, /session && preferred === null \? null/);
  assert.match(page, /draftOwnerId=\{session\?\.id \?\? null\}/);
  assert.match(page, /initialProfileAvailable=\{initialProfileAvailable\}/);
  assert.match(check, /initialPreferredIngredientIds: string\[\] \| null/);
  assert.match(check, /answersDirty/);
  assert.match(check, /profileBaseKnown/);
  assert.match(check, /!guestAnswerHandoff && restored\?\.profileBaseKnown/);
  assert.match(check, /profileBaseUpdatedAt/);
  assert.match(check, /preferenceSelectionDirty/);
  assert.match(check, /resolveSkinDraftIngredients/);
  assert.match(check, /response\.preferredIngredientIds === null \? retainedPreferenceDraft\.current : null/);
  assert.match(check, /preferenceBaseIds: retained\.preferenceBaseIds/);
});
