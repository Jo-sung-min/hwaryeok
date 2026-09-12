import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const typescript = require("next/dist/compiled/babel/preset-typescript").default;
const commonjs = require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default;

function compile(relativePath, mocks = {}) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { code } = transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [typescript],
    plugins: [commonjs],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (specifier) => {
      if (specifier in mocks) return mocks[specifier];
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
  });
  return module.exports;
}

const quickProfile = compile("../src/lib/quick-profile.ts");
const profile = {
  skinType: "복합성",
  hydrationLevel: "LOW",
  oilinessLevel: "HIGH",
  cheekOiliness: "LOW",
  sensitivityLevel: "MEDIUM",
  breakoutFrequency: "OCCASIONAL",
  cleansingTightness: "SHORT",
  rednessFrequency: "OCCASIONAL",
  poreLevel: "MEDIUM",
  texturePreference: "LIGHT",
  routineComplexity: "STANDARD",
  sunscreenUsage: "DAILY",
  concerns: ["속건조·당김"],
  reactionTriggers: [],
  breakoutZones: ["턱·입가"],
  environments: ["냉난방 건조"],
  routineContexts: [],
};

function actions({ token = "access-token" } = {}) {
  const calls = [];
  const revalidated = [];
  class ApiRequestError extends Error {}
  const module = compile("../src/app/skin-check/actions.ts", {
    "next/cache": { revalidatePath: (path) => revalidated.push(path) },
    "@/lib/api": {
      ApiRequestError,
      getRanking: async (input, limit) => { calls.push(["products", input, limit]); return [{ id: "product-1" }]; },
      getIngredientRecommendations: async (input, ids, limit) => { calls.push(["ingredients", input, ids, limit]); return [{ ingredient: { id: "ceramide-np" }, preferred: true }]; },
      saveUserProfile: async (...args) => {
        calls.push(["save", ...args]);
        return {
          skinProfile: { updatedAt: "2026-09-12T03:00:00Z" },
          preferredIngredients: { content: args[2].map((id, priority) => ({ priority, ingredient: { id } })) },
        };
      },
      saveUserSkinProfile: async (...args) => { calls.push(["save-skin", ...args]); return { updatedAt: "2026-09-12T03:00:00Z" }; },
    },
    "@/lib/auth-session": { getActionAccessToken: async () => token },
    "@/lib/quick-profile": quickProfile,
  });
  return { module, calls, revalidated };
}

test("skin and saved ingredient experience feed both recommendation paths", async () => {
  const { module, calls } = actions();
  const result = await module.getQuickRecommendations(profile, ["ceramide-np"]);
  assert.equal(result.products.length, 1);
  assert.equal(result.ingredients.length, 1);
  assert.equal(calls[0][1], profile);
  assert.equal(calls[1][1], profile);
  assert.equal(calls[0][2], 3);
  assert.deepEqual(Array.from(calls[1][2]), ["ceramide-np"]);
  assert.equal(calls[1][3], 4);
});

test("one save writes the same skin profile and ingredient selection atomically", async () => {
  const { module, calls, revalidated } = actions();
  const result = await module.saveSkinCheckProfile(profile, ["ceramide-np"]);
  assert.equal(result.success, true);
  assert.equal(result.profileUpdatedAt, "2026-09-12T03:00:00Z");
  assert.deepEqual(Array.from(result.preferredIngredientIds), ["ceramide-np"]);
  const save = calls.find(([type]) => type === "save");
  assert.equal(save[1], "access-token");
  assert.equal(save[2], profile);
  assert.deepEqual(Array.from(save[3]), ["ceramide-np"]);
  assert.deepEqual(Array.from(revalidated), ["/skin-check", "/my", "/ranking", "/ranking/personal", "/compare", "/products"]);
});

test("invalid ingredient ids and unauthenticated saves stop before mutation", async () => {
  const invalid = actions();
  assert.equal((await invalid.module.getQuickRecommendations(profile, ["../secret"])).success, false);
  assert.equal(invalid.calls.length, 0);

  const guest = actions({ token: null });
  assert.equal((await guest.module.saveSkinCheckProfile(profile, [])).success, false);
  assert.equal(guest.calls.length, 0);
});

test("failed preference loading preserves the existing list while saving skin answers", async () => {
  const { module, calls } = actions();
  const result = await module.saveSkinCheckProfile(profile, null);
  assert.equal(result.success, true);
  assert.equal(result.profileUpdatedAt, "2026-09-12T03:00:00Z");
  assert.equal(result.preferredIngredientIds, null);
  assert.match(result.message, /기존 성분 선택은 그대로 유지/);
  assert.equal(calls.some(([type]) => type === "save"), false);
  const saveSkin = calls.find(([type]) => type === "save-skin");
  assert.equal(saveSkin[1], "access-token");
  assert.equal(saveSkin[2], profile);
});
