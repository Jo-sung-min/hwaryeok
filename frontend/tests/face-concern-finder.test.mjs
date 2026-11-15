import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const typescript = require("next/dist/compiled/babel/preset-typescript").default;
const commonjs = require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default;

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

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

const catalog = compile("../src/lib/face-concerns.ts");
const quickProfile = compile("../src/lib/quick-profile.ts");
const profileBuilder = compile("../src/lib/face-concern-profile.ts");

const CONCERNS = ["속건조·당김", "유분·번들거림", "트러블·여드름", "블랙헤드·모공", "붉은기·민감", "장벽·각질", "잡티·칙칙함", "탄력·잔주름"];

const savedProfile = {
  configured: true,
  skinType: "수부지",
  hydrationLevel: "LOW",
  oilinessLevel: "HIGH",
  cheekOiliness: "BALANCED",
  sensitivityLevel: "HIGH",
  breakoutFrequency: "OCCASIONAL",
  profileVersion: 3,
  cleansingTightness: "SHORT",
  rednessFrequency: "OCCASIONAL",
  poreLevel: "MEDIUM",
  texturePreference: "LIGHT",
  routineComplexity: "STANDARD",
  sunscreenUsage: "DAILY",
  reactionTriggers: ["향료"],
  breakoutZones: ["이마"],
  environments: ["냉난방 건조"],
  routineContexts: [],
  concerns: ["속건조·당김", "블랙헤드·모공"],
  createdAt: null,
  updatedAt: "2026-11-01T00:00:00Z",
};

test("every symptom belongs to a zone, maps to existing concern codes and has its generated cut", () => {
  const zoneIds = new Set(catalog.FACE_ZONES.map((zone) => zone.id));
  const viewIds = new Set(catalog.FACE_VIEWS.map((view) => view.id));
  const inside = (box) => box.x >= 0 && box.y >= 0 && box.x + box.size <= catalog.FACE_MODEL.width && box.y + box.size <= catalog.FACE_MODEL.height;
  assert.equal(new Set(catalog.FACE_SYMPTOMS.map((symptom) => symptom.id)).size, catalog.FACE_SYMPTOMS.length);

  for (const view of catalog.FACE_VIEWS) {
    assert.ok(existsSync(new URL(`../public${view.src}`, import.meta.url)), `${view.id} view image is missing`);
    assert.ok(catalog.FACE_ZONES.some((zone) => catalog.zonePlacement(zone, view.id)), `${view.id} view shows no zone`);
  }
  for (const zone of catalog.FACE_ZONES) {
    assert.ok(catalog.symptomsForZone(zone.id).length >= 3, `${zone.id} needs symptoms to choose from`);
    assert.ok(existsSync(new URL(`../public${catalog.faceZoneImage(zone.id)}`, import.meta.url)), `${zone.id} zone cut is missing`);
    assert.ok(viewIds.has(zone.cropView));
    assert.ok(inside(zone.crop), `${zone.id} crop leaves the model image`);
    assert.ok(zone.placements.length >= 1);
    assert.equal(new Set(zone.placements.map((placement) => placement.view)).size, zone.placements.length, `${zone.id} repeats a view`);
    for (const placement of zone.placements) {
      assert.ok(viewIds.has(placement.view));
      assert.ok(inside(placement.marker) && inside(placement.callout), `${zone.id} leaves the ${placement.view} image`);
    }
  }
  for (const symptom of catalog.FACE_SYMPTOMS) {
    assert.ok(zoneIds.has(symptom.zone));
    assert.ok(symptom.id.startsWith(`${symptom.zone}-`));
    assert.ok(symptom.concerns.length <= 4);
    assert.ok(symptom.concerns.length >= 1 || symptom.productCategory, `${symptom.id} has nothing to recommend`);
    for (const concern of symptom.concerns) assert.ok(CONCERNS.includes(concern), `${symptom.id} uses an unknown concern ${concern}`);
    assert.ok(symptom.looks.length >= 2);
    assert.ok(existsSync(new URL(`../public${catalog.faceSymptomImage(symptom.id)}`, import.meta.url)), `${symptom.id} cut is missing`);
  }
});

test("the symptom-first list covers all eight concerns and the zones reached by turning the face", () => {
  const representative = catalog.symptomsForZone(null);
  const covered = new Set(Array.from(representative, (symptom) => symptom.concerns[0]).filter(Boolean));
  assert.deepEqual([...covered].sort(), [...CONCERNS].sort());
  assert.ok(representative.some((symptom) => symptom.zone === "neck"));
  assert.ok(representative.some((symptom) => symptom.zone === "crown"));
  assert.equal(catalog.findFaceSymptom("cheek-unknown"), null);
  assert.equal(catalog.findFaceZone("ear"), null);
});

test("turning follows the drag direction and the opposite direction returns to the front", () => {
  assert.equal(catalog.turnFaceView("front", "right"), "turn-right");
  assert.equal(catalog.turnFaceView("front", "left"), "turn-left");
  assert.equal(catalog.turnFaceView("front", "up"), "up");
  assert.equal(catalog.turnFaceView("front", "down"), "top");
  assert.equal(catalog.turnFaceView("turn-right", "left"), "front");
  assert.equal(catalog.turnFaceView("turn-right", "right"), null);
  assert.equal(catalog.turnFaceView("up", "down"), "front");
  assert.equal(catalog.turnFaceView("top", "up"), "front");
  assert.equal(catalog.turnFaceView("top", "left"), "turn-left");
});

test("picking a zone turns the face only when the zone is hidden at the current angle", () => {
  const cheek = catalog.findFaceZone("cheek");
  const neck = catalog.findFaceZone("neck");
  const jawline = catalog.findFaceZone("jawline");
  assert.equal(catalog.viewForZone(cheek, "front"), "front");
  assert.equal(catalog.viewForZone(cheek, "turn-left"), "turn-left", "the cheek stays visible on a side view");
  assert.equal(catalog.viewForZone(cheek, "top"), "front");
  assert.equal(catalog.viewForZone(neck, "front"), "up");
  assert.equal(catalog.viewForZone(catalog.findFaceZone("crown"), "front"), "top");
  assert.equal(catalog.viewForZone(jawline, "front"), "turn-right");
  assert.equal(catalog.zonePlacement(neck, "front"), null);

  const right = catalog.zonePlacement(jawline, "turn-right").marker;
  const left = catalog.zonePlacement(jawline, "turn-left").marker;
  assert.equal(left.x, catalog.FACE_MODEL.width - right.x - right.size, "the left side view mirrors the right one");
  assert.equal(left.y, right.y);
});

test("guests get a neutral profile shaped only by the chosen symptom", () => {
  for (const symptom of catalog.FACE_SYMPTOMS.filter((item) => item.concerns.length > 0)) {
    const { profile, personalized } = profileBuilder.buildFaceConcernProfile(symptom, null);
    assert.equal(personalized, false);
    assert.ok(quickProfile.isQuickSkinProfile(profile), `${symptom.id} builds an invalid profile`);
    assert.deepEqual(Array.from(profile.concerns), Array.from(symptom.concerns));
  }
  const chinAcne = profileBuilder.buildFaceConcernProfile(catalog.findFaceSymptom("chin-acne"), null).profile;
  assert.equal(chinAcne.skinType, "중성");
  assert.equal(chinAcne.breakoutFrequency, "FREQUENT");
  assert.deepEqual(Array.from(chinAcne.breakoutZones), ["턱·입가"]);
  assert.equal(chinAcne.sunscreenUsage, "DAILY");
});

test("a saved skin profile keeps its skin type and reaction triggers while the symptom replaces the concerns", () => {
  const { profile, personalized } = profileBuilder.buildFaceConcernProfile(catalog.findFaceSymptom("cheek-acne"), savedProfile);
  assert.equal(personalized, true);
  assert.ok(quickProfile.isQuickSkinProfile(profile));
  assert.equal(profile.skinType, "수부지");
  assert.equal(profile.sensitivityLevel, "HIGH");
  assert.deepEqual(Array.from(profile.reactionTriggers), ["향료"]);
  assert.deepEqual(Array.from(profile.concerns), ["트러블·여드름"]);
  assert.equal(profile.breakoutFrequency, "FREQUENT");
  assert.deepEqual(Array.from(profile.breakoutZones), ["볼", "이마"]);

  const unconfigured = profileBuilder.buildFaceConcernProfile(catalog.findFaceSymptom("cheek-acne"), { ...savedProfile, configured: false });
  assert.equal(unconfigured.personalized, false);
  assert.equal(unconfigured.profile.skinType, "중성");
});

function actions({ saved = null, productsFail = false, ingredientsFail = false } = {}) {
  const calls = [];
  class ApiRequestError extends Error {}
  const module = compile("../src/app/skin-check/face/actions.ts", {
    "@/lib/api": {
      ApiRequestError,
      getProductPage: async (query) => {
        calls.push(["products", query]);
        if (productsFail) throw new ApiRequestError("제품을 불러오지 못했어요.");
        return { content: [{ id: "product-1" }, { id: "product-2" }], totalElements: 37 };
      },
      getIngredientRecommendations: async (profile, ids, limit) => {
        calls.push(["ingredients", profile, ids, limit]);
        if (ingredientsFail) throw new Error("down");
        return [
          { ingredient: { id: "panthenol", description: "피부를 편안하게 가꾸는 보습 성분이에요." }, reason: "중성 피부에 잘 맞아요.", matchedBy: ["피부 타입 · 중성", "선택 고민: 붉은기·민감"], preferred: false },
          { ingredient: { id: "bisabolol", description: "진정 성분이에요." }, reason: "붉은 인상을 부드럽게 관리해요.", matchedBy: ["선택 고민: 붉은기·민감"], preferred: false },
        ];
      },
    },
    "@/lib/auth-session": { getOptionalSkinProfile: async () => saved },
    "@/lib/face-concern-profile": profileBuilder,
    "@/lib/face-concerns": catalog,
  });
  return { module, calls };
}

test("a chosen symptom filters products by its primary concern and asks for matching ingredients", async () => {
  const { module, calls } = actions();
  const result = await module.getFaceConcernRecommendations("nose-redflake");
  assert.equal(result.success, true);
  assert.equal(result.symptomId, "nose-redflake");
  assert.equal(result.personalized, false);
  assert.equal(result.products.length, 2);
  assert.equal(result.totalProducts, 37);

  const productQuery = calls.find(([type]) => type === "products")[1];
  assert.equal(productQuery.concern, "붉은기·민감");
  assert.equal(productQuery.size, 6);
  assert.equal(productQuery.sort, "score");
  assert.equal(productQuery.profile.skinType, null, "guests must not be scored as an assumed skin type");
  assert.deepEqual(Array.from(productQuery.profile.concerns), ["붉은기·민감", "장벽·각질"]);

  const ingredientCall = calls.find(([type]) => type === "ingredients");
  assert.equal(ingredientCall[1].skinType, "중성");
  assert.equal(ingredientCall[3], 4);
  assert.deepEqual(Array.from(result.ingredients[0].matchedBy), ["선택 고민: 붉은기·민감"], "the assumed skin type must not be shown as a reason");
  assert.equal(result.ingredients[0].reason, "피부를 편안하게 가꾸는 보습 성분이에요.");
  assert.equal(result.ingredients[1].reason, "붉은 인상을 부드럽게 관리해요.");
});

test("scalp symptoms without a concern code show hair care products instead of a concern match", async () => {
  const { module, calls } = actions({ saved: savedProfile });
  const result = await module.getFaceConcernRecommendations("crown-thinning");
  assert.equal(result.success, true);
  assert.equal(result.basis, "category");
  assert.equal(result.personalized, false);
  assert.equal(result.ingredients.length, 0);
  assert.equal(result.products.length, 2);
  assert.match(result.message, /아직 맞춤 추천 기준이 없어요/);
  assert.equal(calls.length, 1, "no ingredient request without a concern");
  const query = calls[0][1];
  assert.equal(query.category, "헤어케어");
  assert.equal(query.concern, undefined);
  assert.equal(query.profile, undefined);

  const failed = await actions({ productsFail: true }).module.getFaceConcernRecommendations("crown-flaky");
  assert.equal(failed.success, false);
});

test("saved profiles personalize the request and keep the skin-type reason", async () => {
  const { module, calls } = actions({ saved: savedProfile });
  const result = await module.getFaceConcernRecommendations("cheek-redness");
  assert.equal(result.personalized, true);
  assert.equal(calls.find(([type]) => type === "products")[1].profile.skinType, "수부지");
  assert.ok(result.ingredients[0].matchedBy.includes("피부 타입 · 중성"));
});

test("unknown symptoms stop before any request and partial failures still return what loaded", async () => {
  const unknown = actions();
  const rejected = await unknown.module.getFaceConcernRecommendations("../secret");
  assert.equal(rejected.success, false);
  assert.equal(unknown.calls.length, 0);

  const partial = await actions({ productsFail: true }).module.getFaceConcernRecommendations("cheek-dry");
  assert.equal(partial.success, true);
  assert.equal(partial.products.length, 0);
  assert.equal(partial.ingredients.length, 2);
  assert.match(partial.message, /화장품 목록은 잠시 불러오지 못했어요/);

  const down = await actions({ productsFail: true, ingredientsFail: true }).module.getFaceConcernRecommendations("cheek-dry");
  assert.equal(down.success, false);
  assert.equal(down.message, "제품을 불러오지 못했어요.");
});

test("the face page opens from an address, stays under the skin tab and is linked from the skin check", () => {
  const page = source("../src/app/skin-check/face/page.tsx");
  const finder = source("../src/app/skin-check/face/face-concern-finder.tsx");
  const check = source("../src/app/skin-check/quick-skin-check.tsx");
  assert.match(page, /findFaceSymptom\(typeof search\.symptom === "string"/);
  assert.match(page, /getFaceConcernRecommendations\(initialSymptom\.id\)/);
  assert.match(finder, /window\.history\.replaceState/);
  assert.match(finder, /turnFaceView\(viewId, turn\)/);
  assert.match(finder, /onPointerDown=\{startDrag\}/);
  assert.match(finder, /onKeyDown=\{turnWithKeyboard\}/);
  assert.match(finder, /href=\{`\/products\?concern=\$\{encodeURIComponent\(symptom\.concerns\[0\]\)\}`\}/);
  assert.match(finder, /질환을 진단하지 않아요/);
  assert.match(check, /href="\/skin-check\/face"/);
});
