import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  assert.match(html, /내 활동 프로필/);
  assert.match(html, /활동명·프로필 사진·소개·외부 채널 관리/);
  assert.match(html, /href="\/reviewers\/qa-user#reviews"/);
  assert.match(html, /작성 리뷰 관리/);
  assert.match(html, /회원정보/);
  assert.match(html, /qa@example\.invalid/);
  assert.match(html, /data-password-change-form="true"/);
  assert.match(html, /로그아웃/);
  assert.match(html, /left=qa-ampoule&amp;right=qa-cream/);
  assert.doesNotMatch(html, /GPT|OpenAI/);
  assert.doesNotMatch(html, /<img|must-not-render|나의 추천 제품|수부지 기준/);
});
test("Kakao accounts keep logout but direct password management to Kakao", async () => {
  const html = await dashboard({
    auth: {
      requireSession: async () => ({
        id: "qa-kakao-user",
        email: null,
        nickname: "카카오 피부기록",
        role: "USER",
        authMethod: "kakao",
        passwordChangeAvailable: false,
      }),
    },
  });
  assert.match(html, /카카오 계정/);
  assert.match(html, /비밀번호는 카카오에서 관리해요/);
  assert.match(html, /로그아웃/);
  assert.doesNotMatch(html, /data-password-change-form/);
});
test("an unconfigured profile stays neutral while the browser draft is being checked", async () => {
  const html = await dashboard({ getUserSkinProfile: async () => ({ ...profile, configured: false }) });
  assert.match(html, /피부 체크 기록을 확인하고 있어요/);
  assert.doesNotMatch(html, /나의 피부 체크 시작/);
  assert.doesNotMatch(html, /복합성 경향/);
});
test("skin summary resolver distinguishes saved profiles, review drafts and generated reports", () => {
  const { resolveMySkinSummaryState } = harness().load("../src/app/my/my-skin-summary.tsx");
  const unconfigured = { ...profile, configured: false };
  const generatedReport = { skinType: "건성", hasReport: true };
  const reviewDraft = { skinType: "건성", hasReport: false };

  const unconfiguredResult = resolveMySkinSummaryState(unconfigured, generatedReport);
  assert.equal(unconfiguredResult.kind, "result");
  assert.equal(unconfiguredResult.href, "/skin-check?step=result");
  assert.notEqual(unconfiguredResult.action, "나의 피부 체크 시작");

  const unconfiguredReview = resolveMySkinSummaryState(unconfigured, reviewDraft);
  assert.equal(unconfiguredReview.kind, "review");
  assert.equal(unconfiguredReview.href, "/skin-check?step=review");

  const configuredResult = resolveMySkinSummaryState(profile, generatedReport);
  assert.equal(configuredResult.kind, "result");
  assert.equal(configuredResult.href, "/skin-check?step=result");
  assert.equal(configuredResult.title, "건성 경향");

  const configuredReview = resolveMySkinSummaryState(profile, reviewDraft);
  assert.equal(configuredReview.kind, "saved");
  assert.equal(configuredReview.href, "/skin-check");
  assert.equal(configuredReview.title, "복합성 경향");

  const unavailable = resolveMySkinSummaryState(null, generatedReport);
  assert.equal(unavailable.kind, "unavailable");
  assert.equal(unavailable.href, "/my");
  assert.equal(unavailable.action, "다시 불러오기");
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
  const disabled = photoForm({ enabled: false, dailyLimit: 3, remaining: 3 });
  assert.match(disabled, /준비가 끝나면 이곳에서 분석/);
  assert.doesNotMatch(disabled, /GPT|OpenAI|API/);
  assert.match(photoForm(null), /분석 서비스에 연결하지 못했어요/);
  assert.match(photoForm({ enabled: true, dailyLimit: 3, remaining: 0 }), /오늘의 분석 횟수를 모두 사용/);
  const ready = photoForm({ enabled: true, dailyLimit: 3, remaining: 3 });
  assert.match(ready, /capture="user"/);
  assert.match(ready, /type="checkbox" disabled=""/);
  assert.doesNotMatch(ready, /checked=""/);
  assert.match(ready, /disabled="">동의하고 분석하기/);
  assert.match(ready, /사진 분석을 위한 정보 처리에 동의/);
  assert.match(ready, /href="\/terms"/);
  assert.doesNotMatch(ready, /GPT|OpenAI|API|최대 30일/);
});
test("terms disclose the photo transfer while the feature keeps provider wording out of the flow", () => {
  const terms = readFileSync(new URL("../src/app/terms/page.tsx", import.meta.url), "utf8");
  const form = readFileSync(new URL("../src/app/my/photo-analysis/skin-photo-form.tsx", import.meta.url), "utf8");
  assert.match(terms, /OpenAI의 GPT 기반 분석 서비스로 전송/);
  assert.match(terms, /이름·이메일·저장된 피부 프로필은 함께 전송하지 않/);
  assert.doesNotMatch(form, /GPT|OpenAI|API|AI 관찰/);
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
