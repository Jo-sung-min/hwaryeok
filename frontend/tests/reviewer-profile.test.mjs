import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const typescript = require("next/dist/compiled/babel/preset-typescript").default;
const react = require("next/dist/compiled/babel/preset-react").default;
const commonjs = require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default;

function compile(relativePath, mocks = {}, globals = {}) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { code } = transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [typescript, [react, { runtime: "automatic" }]],
    plugins: [commonjs],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    URL,
    URLSearchParams,
    FormData,
    require: (specifier) => {
      if (specifier in mocks) return mocks[specifier];
      if (["react", "react/jsx-runtime", "lucide-react"].includes(specifier)) return require(specifier);
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
    ...globals,
  });
  return module.exports;
}

const Link = ({ children, ...props }) => React.createElement("a", props, children);
const Image = ({ fill: _fill, ...props }) => React.createElement("img", props);
const reviewerProfileHelpers = compile("../src/lib/reviewer-profile.ts");
const bioBlocks = [{ type: "paragraph", content: [{ type: "text", text: "건성 피부의 보습 제품을 오래 써 보고 기록해요.", styles: {} }], children: [] }];
const publicProfile = {
  userId: "reviewer-1", nickname: "보습기록", skinType: "건성", reviewFirepower: 82.3,
  averageReceivedRating: 4.6, receivedRatingCount: 14, uniqueRaterCount: 8, reviewCount: 3,
  averageReviewScore: 88.1, rank: 2, bioBlocks,
  blogUrl: "https://blog.example.com/moisture", instagramUrl: "https://www.instagram.com/moisture",
  profileUpdatedAt: "2026-09-10T00:00:00Z",
};

function reviewerPage({ profile = publicProfile, session = { id: "reviewer-1" }, reviews = {} } = {}) {
  const ApiRequestError = class extends Error {};
  return compile("../src/app/reviewers/[userId]/page.tsx", {
    "next/link": Link,
    "next/image": Image,
    "next/navigation": { notFound: () => { throw new Error("not-found"); } },
    "@/lib/api": {
      ApiRequestError,
      getReviewerProfile: async () => profile,
      getReviewerReviews: async () => ({ reviewer: { id: profile.userId, nickname: profile.nickname }, averageReviewScore: profile.averageReviewScore, reviewCount: profile.reviewCount, content: [], page: 0, size: 10, totalPages: 0, hasNext: false, ...reviews }),
    },
    "@/lib/auth-session": { getCurrentSession: async () => session, readAuthTokens: async () => ({ accessToken: session ? "token" : null }) },
    "@/components/review-firepower-vote": { ReviewFirepowerVote: () => null },
    "@/components/reviewer-firepower": { ReviewerFirepower: ({ score }) => React.createElement("span", { "data-firepower": score }) },
    "@/lib/media": { resolveProductImageUrl: () => null },
    "@/lib/reviewer-profile": reviewerProfileHelpers,
    "@/app/my/reviewer-profile/dynamic-blocknote": { DynamicBlockNote: ({ initialContent, editable }) => React.createElement("div", { "data-blocknote": JSON.stringify(initialContent), "data-editable": String(editable) }) },
  }).default;
}

test("public reviewer page shows introduction tabs, owner edit link, and safe promotional links", async () => {
  const Page = reviewerPage();
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ userId: "reviewer-1" }), searchParams: Promise.resolve({}) }));
  assert.match(html, /href="#introduction"/);
  assert.match(html, /href="#reviews"/);
  assert.match(html, /소개 수정/);
  assert.match(html, /data-editable="false"/);
  assert.match(html, /건성 피부의 보습 제품/);
  assert.match(html, /href="https:\/\/blog\.example\.com\/moisture"/);
  assert.match(html, /href="https:\/\/www\.instagram\.com\/moisture"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer ugc nofollow"/);
});

test("public reviewer page renders a useful empty state and hides edit link from visitors", async () => {
  const Page = reviewerPage({ profile: { ...publicProfile, bioBlocks: undefined, blogUrl: null, instagramUrl: null }, session: null });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ userId: "reviewer-1" }), searchParams: Promise.resolve({}) }));
  assert.match(html, /리뷰어가 소개를 준비하고 있어요/);
  assert.doesNotMatch(html, /data-blocknote|소개 수정|블로그, 새 창|Instagram, 새 창/);
});

test("unknown or malformed BlockNote data degrades to the empty introduction state", async () => {
  const malformed = [{ type: "image", props: { url: "https://example.com/tracker.png" }, children: [] }];
  assert.deepEqual(Array.from(reviewerProfileHelpers.normalizeReviewerBioBlocks(malformed)), []);
  assert.throws(() => reviewerProfileHelpers.parseReviewerBioBlocks(JSON.stringify(malformed)), /블록 형식/);

  const Page = reviewerPage({ profile: { ...publicProfile, bioBlocks: malformed }, session: null });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ userId: "reviewer-1" }), searchParams: Promise.resolve({}) }));
  assert.match(html, /리뷰어가 소개를 준비하고 있어요/);
  assert.doesNotMatch(html, /data-blocknote|tracker\.png/);
});

test("reviewer bio validation enforces exact BlockNote prop and style types", () => {
  const invalidHeading = [{ type: "heading", props: { level: "2" }, content: [], children: [] }];
  const invalidStyle = [{ type: "paragraph", props: {}, content: [{ type: "text", text: "hello", styles: { bold: "true" } }], children: [] }];
  const validHeading = [{ type: "heading", props: { level: 2, textAlignment: "left", textColor: "default", backgroundColor: "default" }, content: [{ type: "text", text: "hello", styles: { bold: true } }], children: [] }];
  assert.deepEqual(Array.from(reviewerProfileHelpers.normalizeReviewerBioBlocks(invalidHeading)), []);
  assert.deepEqual(Array.from(reviewerProfileHelpers.normalizeReviewerBioBlocks(invalidStyle)), []);
  assert.equal(reviewerProfileHelpers.normalizeReviewerBioBlocks(validHeading).length, 1);
});

test("code blocks accept BlockNote full document JSON and safe partial strings", () => {
  const fullCodeBlock = [{
    id: "3bf87eca-36b7-4c91-8d0e-838dc15be19a",
    type: "codeBlock",
    props: { language: "javascript" },
    content: [{ type: "text", text: "const score = 100;", styles: {} }],
    children: [],
  }];
  const partialCodeBlock = [{ type: "codeBlock", props: { language: "text" }, content: "화력 기록", children: [] }];
  const styledCodeBlock = [{ type: "codeBlock", props: { language: "text" }, content: [{ type: "text", text: "unsafe", styles: { bold: true } }], children: [] }];
  assert.equal(reviewerProfileHelpers.normalizeReviewerBioBlocks(fullCodeBlock).length, 1);
  assert.equal(reviewerProfileHelpers.normalizeReviewerBioBlocks(partialCodeBlock).length, 1);
  assert.deepEqual(Array.from(reviewerProfileHelpers.normalizeReviewerBioBlocks(styledCodeBlock)), []);
});

test("partial inline strings, nested blocks, and safe pasted colors survive normalization", () => {
  const nestedChildren = Array.from({ length: 250 }, (_, index) => ({ type: "paragraph", content: `기록 ${index}`, children: [] }));
  const document = [{
    type: "heading",
    props: { level: 2, textColor: "#b44968", backgroundColor: "rgba(255, 240, 245, .8)", textAlignment: "left" },
    content: "리뷰 기준",
    children: nestedChildren,
  }];
  assert.equal(reviewerProfileHelpers.normalizeReviewerBioBlocks(document).length, 1);

  const unsafeColor = [{ type: "paragraph", props: { textColor: "url(javascript:alert(1))" }, content: "소개", children: [] }];
  assert.deepEqual(Array.from(reviewerProfileHelpers.normalizeReviewerBioBlocks(unsafeColor)), []);
});

test("inline links are rejected so promotion only uses explicit channel buttons", () => {
  const disguisedLink = [{
    type: "paragraph",
    props: {},
    content: [{ type: "link", href: "https://unexpected.example", content: [{ type: "text", text: "공식 블로그", styles: {} }] }],
    children: [],
  }];
  assert.deepEqual(Array.from(reviewerProfileHelpers.normalizeReviewerBioBlocks(disguisedLink)), []);
  assert.throws(() => reviewerProfileHelpers.parseReviewerBioBlocks(JSON.stringify(disguisedLink)), /블록 형식/);
});

test("review pagination returns to the review section", async () => {
  const Page = reviewerPage({ reviews: { page: 1, totalPages: 3, hasNext: true } });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ userId: "reviewer-1" }), searchParams: Promise.resolve({ page: "1" }) }));
  assert.match(html, /href="\/reviewers\/reviewer-1\?page=0#reviews"/);
  assert.match(html, /href="\/reviewers\/reviewer-1\?page=2#reviews"/);
});

test("BlockNote empty paragraph is treated as empty while written content is visible", () => {
  assert.equal(reviewerProfileHelpers.hasMeaningfulReviewerBio([]), false);
  assert.equal(reviewerProfileHelpers.hasMeaningfulReviewerBio([{ type: "paragraph", content: [], children: [] }]), false);
  assert.equal(reviewerProfileHelpers.hasMeaningfulReviewerBio(bioBlocks), true);
});

test("reviewer profile action validates links and saves BlockNote JSON through the authenticated API", async () => {
  const revalidated = [];
  const calls = [];
  const ApiRequestError = class extends Error { constructor(message) { super(message); this.fieldErrors = {}; } };
  const actions = compile("../src/app/my/reviewer-profile/actions.ts", {
    "next/cache": { revalidatePath: (path) => revalidated.push(path) },
    "@/lib/api": { ApiRequestError, saveMyReviewerProfile: async (token, input) => { calls.push({ token, input }); return { ...publicProfile, ...input }; } },
    "@/lib/auth-session": { getActionAccessToken: async () => "access-token" },
    "@/lib/reviewer-profile": reviewerProfileHelpers,
  });
  const form = new FormData();
  form.set("bioBlocks", JSON.stringify(bioBlocks));
  form.set("blogUrl", "https://blog.example.com/moisture");
  form.set("instagramUrl", "https://www.instagram.com/moisture");
  const result = await actions.saveReviewerProfileAction({ success: false, message: "", fieldErrors: {} }, form);
  assert.equal(result.success, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].token, "access-token");
  assert.equal(JSON.stringify(calls[0].input.bioBlocks), JSON.stringify(bioBlocks));
  assert.deepEqual(Array.from(revalidated), ["/my", "/my/reviewer-profile", "/reviewers/reviewer-1"]);

  const invalid = new FormData();
  invalid.set("bioBlocks", "[]");
  invalid.set("blogUrl", "javascript:alert(1)");
  invalid.set("instagramUrl", "https://example.com/not-instagram");
  const invalidResult = await actions.saveReviewerProfileAction(result, invalid);
  assert.equal(invalidResult.success, false);
  assert.match(invalidResult.fieldErrors.blogUrl, /http 또는 https/);
  assert.match(invalidResult.fieldErrors.instagramUrl, /instagram\.com/);
  assert.equal(calls.length, 1);
});

test("BlockNote follows the Next client-only dynamic wrapper pattern and Korean dictionary", () => {
  const dynamicSource = readFileSync(new URL("../src/app/my/reviewer-profile/dynamic-blocknote.tsx", import.meta.url), "utf8");
  const editorSource = readFileSync(new URL("../src/app/my/reviewer-profile/blocknote-content.tsx", import.meta.url), "utf8");
  assert.match(dynamicSource, /^"use client"/);
  assert.match(dynamicSource, /dynamic\(\(\) => import\("\.\/blocknote-content"\), \{/);
  assert.match(dynamicSource, /ssr: false/);
  assert.match(editorSource, /@blocknote\/core\/fonts\/inter\.css/);
  assert.match(editorSource, /@blocknote\/mantine\/style\.css/);
  assert.match(editorSource, /dictionary: ko/);
  assert.match(editorSource, /BlockNoteSchema\.create/);
  assert.match(editorSource, /inlineContentSpecs:\s*\{\s*text: defaultInlineContentSpecs\.text/);
  assert.doesNotMatch(editorSource, /link: defaultInlineContentSpecs\.link/);
  assert.match(editorSource, /linkToolbar=\{false\}/);
  assert.match(editorSource, /paragraph: defaultBlockSpecs\.paragraph/);
  assert.match(editorSource, /toggleListItem: defaultBlockSpecs\.toggleListItem/);
  assert.doesNotMatch(editorSource, /image: defaultBlockSpecs|video: defaultBlockSpecs|audio: defaultBlockSpecs|file: defaultBlockSpecs|table: defaultBlockSpecs/);
  assert.match(editorSource, /initialContent\.length \? initialContent .* : undefined/);
  assert.match(dynamicSource, /getDerivedStateFromError/);
  assert.match(dynamicSource, /소개를 안전하게 표시할 수 없어요/);
});
