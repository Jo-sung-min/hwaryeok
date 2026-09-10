import test from "node:test";
import assert from "node:assert/strict";
import { dashboard, photoForm, harness, profile } from "./my-render-fixtures.mjs";

test("personal dashboard renders actual metrics and text-only product lists", async () => {
  const html = await dashboard();
  assert.match(html, /가상 피부기록님의 마이화력/);
  assert.match(html, /72\.4/);
  assert.match(html, /복합성 경향/);
  assert.match(html, /미등록/);
  assert.match(html, /나머지 1개 펼쳐보기/);
  assert.match(html, /찜 해제/);
  assert.match(html, /href="\/my\/reviewer-profile"/);
  assert.match(html, /내 리뷰어 소개/);
  assert.match(html, /left=qa-ampoule&amp;right=qa-cream/);
  assert.doesNotMatch(html, /<img|must-not-render|나의 추천 제품|수부지 기준/);
});
test("missing profile is not treated as a measured normal profile", async () => {
  const html = await dashboard({ getUserSkinProfile: async () => ({ ...profile, configured: false }) });
  assert.match(html, /나의 피부 체크 시작/);
  assert.doesNotMatch(html, /복합성 경향/);
});
test("partial API failures remain distinct from empty records", async () => {
  const fail = async () => { throw new Error("unavailable"); };
  const html = await dashboard({ getUserSkinProfile: fail, getUserFavorites: fail, getReviewerProfile: fail });
  assert.match(html, /피부 정보를 불러오지 못했어요/);
  assert.match(html, /잠시 불러오지 못했어요/);
  assert.match(html, /내 사용법 영상/);
  assert.doesNotMatch(html, /수부지/);
});
test("photo form distinguishes unconfigured, unavailable and exhausted states", () => {
  assert.match(photoForm({ enabled: false, dailyLimit: 3, remaining: 3 }), /관리자가 GPT API 연결/);
  assert.match(photoForm(null), /분석 서비스에 연결하지 못했어요/);
  assert.match(photoForm({ enabled: true, dailyLimit: 3, remaining: 0 }), /오늘의 분석 횟수를 모두 사용/);
  const ready = photoForm({ enabled: true, dailyLimit: 3, remaining: 3 });
  assert.match(ready, /capture="user"/);
  assert.match(ready, /type="checkbox" disabled=""/);
  assert.doesNotMatch(ready, /checked=""/);
  assert.match(ready, /disabled="">동의하고 GPT로 분석하기/);
  assert.match(ready, /최대 30일/);
});
test("image metadata validation rejects empty, oversized and unsupported inputs", () => {
  const { photoFileError } = harness().load("../src/lib/skin-photo.ts");
  assert.equal(photoFileError({ size: 1024, type: "image/jpeg" }), null);
  assert.equal(photoFileError({ size: 5 * 1024 * 1024, type: "image/png" }), null);
  assert.ok(photoFileError({ size: 0, type: "image/jpeg" }));
  assert.ok(photoFileError({ size: 5 * 1024 * 1024 + 1, type: "image/jpeg" }));
  assert.ok(photoFileError({ size: 200, type: "image/heic" }));
});
test("server action rejects unauthenticated and non-consenting requests before API", async () => {
  let calls = 0;
  const api = { analyzeSkinPhoto: async () => { calls++; }, ApiRequestError: class extends Error {} };
  const unauth = harness({ ...api, auth: { getActionAccessToken: async () => null } }).load("../src/app/my/photo-analysis/actions.ts");
  assert.match((await unauth.analyzePhotoAction(new FormData())).error, /로그인/);
  const authed = harness(api).load("../src/app/my/photo-analysis/actions.ts");
  assert.match((await authed.analyzePhotoAction(new FormData())).error, /동의/);
  const data = new FormData(); data.set("consent", "photo-v1");
  assert.match((await authed.analyzePhotoAction(data)).error, /사진/);
  data.set("photo", new File(["bad"], "bad.svg", { type: "image/svg+xml" }));
  assert.match((await authed.analyzePhotoAction(data)).error, /JPEG/);
  assert.equal(calls, 0);
});
