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
  const my = source("../src/app/my/page.tsx");
  const personalRanking = source("../src/app/ranking/personal/page.tsx");
  const signup = source("../src/app/signup/signup-form.tsx");

  for (const routeSource of [my, signup]) {
    assert.match(routeSource, /href="\/skin-check"/);
    assert.doesNotMatch(routeSource, /href="\/profile(?:\?|"|#)/);
  }
  assert.match(personalRanking, /user \? "\/skin-check\?step=result"/);
  assert.doesNotMatch(personalRanking, /href="\/profile(?:\?|"|#)/);
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

test("authenticated result drafts auto-save and continue to the personal ranking after success", () => {
  const check = source("../src/app/skin-check/quick-skin-check.tsx");
  const effects = [...check.matchAll(/useEffect\(\(\) => \{([\s\S]*?)\n\s*\}, \[([^\]]*)\]\);/g)];
  const autoSaveEffect = effects.find(([, body]) => /(?:saveProfile|saveSkinCheckProfile)\(/.test(body));

  assert.match(check, /autoSaveKey/, "result drafts need a stable key so restored results enter the same save path");
  assert.match(check, /saveRequestActive/, "automatic and manual saves must share an in-flight guard");
  assert.ok(autoSaveEffect, "entering the result view must trigger profile persistence from an effect, including restored result drafts");
  const [effectSource] = autoSaveEffect;
  assert.match(effectSource, /autoSaveKey/, "the effect must react to fresh and restored result drafts");
  assert.match(effectSource, /saveRequestActive/, "the effect must not dispatch duplicate saves");
  assert.match(check, /isAuthenticated[\s\S]{0,240}view[^\n]*["']result["']|view[^\n]*["']result["'][\s\S]{0,240}isAuthenticated/, "guest results must stay local until login and result entry");
  assert.match(check, /answersDirty[\s\S]{0,240}(?:initialProfile|configured)|(?:initialProfile|configured)[\s\S]{0,240}answersDirty/, "only a dirty or not-yet-configured result should auto-save");

  const footer = check.slice(check.indexOf("<footer"), check.indexOf("</footer>") + "</footer>".length);
  assert.match(check, /const resultIsSaved = Boolean\(saveState\?\.success \|\|/, "the saved-result state must include confirmed persistence");
  assert.match(footer, /resultIsSaved/, "the ranking CTA must wait for a saved result");
  assert.match(footer, /href=["']\/ranking\/personal["']/, "a saved result must continue to the personalized ranking");
  assert.match(footer, /내 맞춤 랭킹 보기/);
});
