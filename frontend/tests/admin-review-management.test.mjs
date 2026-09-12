import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const typesSource = read("../src/lib/types.ts");
const apiSource = read("../src/lib/api.ts");
const adminPageSource = read("../src/app/admin/reviews/page.tsx");
const adminActionsSource = read("../src/app/admin/reviews/actions.ts");
const deleteFormSource = read("../src/app/admin/reviews/admin-review-delete-form.tsx");

function declaration(source, startPattern, endPattern) {
  const start = source.search(startPattern);
  assert.notEqual(start, -1, `Expected declaration matching ${startPattern}`);
  const remainder = source.slice(start);
  const end = remainder.search(endPattern);
  assert.notEqual(end, -1, `Expected declaration to end before ${endPattern}`);
  return remainder.slice(0, end);
}

function loadReviewSection(actionBindings = []) {
  const filename = fileURLToPath(new URL("../src/app/products/[id]/review-section.tsx", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      require("next/dist/compiled/babel/preset-typescript").default,
      [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }],
    ],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };
  const Link = ({ children, ...props }) => React.createElement("a", props, children);
  const ReviewFirepowerVote = ({ reviewId }) => React.createElement("span", {
    "data-review-firepower-vote": reviewId,
  });
  const ReviewPetalRating = ({ score }) => score == null ? null : React.createElement("span", {
    "data-petal-count": Math.floor(Number(score) / 20),
  });
  const actionStub = (kind) => {
    const action = () => undefined;
    action.bind = (_this, ...args) => {
      actionBindings.push({ kind, args });
      return () => undefined;
    };
    return action;
  };
  const createReviewAction = actionStub("create");
  const updateReviewAction = actionStub("update");

  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    require: (specifier) => {
      if (specifier === "react" || specifier === "react/jsx-runtime") return require(specifier);
      if (specifier === "next/link") return { __esModule: true, default: Link };
      if (specifier === "@/components/review-firepower-vote") return { ReviewFirepowerVote };
      if (specifier === "@/components/review-petal-rating") return { ReviewPetalRating };
      if (specifier === "./review-actions") return { createReviewAction, updateReviewAction };
      if (specifier === "lucide-react") return new Proxy({ __esModule: true }, {
        get: (target, name) => name in target
          ? target[name]
          : (props) => React.createElement("svg", { ...props, "data-icon": String(name) }),
      });
      throw new Error(`Unexpected review-section dependency: ${specifier}`);
    },
    Intl,
    Date,
    Object,
    Number,
  }, { filename });
  return localModule.exports.ReviewSection;
}

function reviewSummary(review) {
  return {
    productId: "toner-1",
    categoryId: "toner",
    categoryName: "토너",
    templateId: "template-1",
    templateVersion: 1,
    reviewScore: 84,
    reviewCount: 1,
    viewerHasReviewed: false,
    viewerReview: null,
    viewerReviewCriteria: null,
    rankingStatus: "COLLECTING",
    minimumOfficialReviewCount: 10,
    criteriaAverages: [],
    reviews: [review],
  };
}

const criteria = {
  categoryId: "toner",
  categoryName: "토너",
  templateId: "template-1",
  templateVersion: 1,
  criteria: [{ id: "hydration", code: "HYDRATION", name: "보습", description: "보습감", displayOrder: 1 }],
};

const baseReview = {
  id: "review-1",
  authorId: "member-1",
  authorNickname: "맑은피부",
  sampleReview: false,
  communityRating: { averageScore: 4.5, ratingCount: 2, viewerScore: null },
  totalScore: 84,
  content: "촉촉하고 자극 없이 잘 사용했어요.",
  skinType: "복합성",
  usagePeriod: "ONE_MONTH",
  repurchaseYn: true,
  scores: [{ criteriaId: "hydration", score: 4 }],
  createdAt: "2026-09-10T00:00:00Z",
  updatedAt: "2026-09-10T00:00:00Z",
};

test("review types distinguish nullable sample authors and expose a paged admin model", () => {
  const reviewDetail = declaration(typesSource, /export type ReviewDetail\s*=\s*\{/, /\n\};/);
  const adminPage = declaration(typesSource, /export type AdminReviewPage\s*=\s*\{/, /\n\};/);

  assert.match(reviewDetail, /authorId:\s*string\s*\|\s*null/);
  assert.match(reviewDetail, /sampleReview:\s*boolean/);
  assert.match(reviewDetail, /scores:\s*\{\s*criteriaId:\s*string;\s*score:\s*number\s*\}\[\]/);
  assert.match(reviewDetail, /updatedAt:\s*string/);
  assert.match(typesSource, /viewerReview:\s*ReviewDetail\s*\|\s*null/);
  assert.match(typesSource, /viewerReviewCriteria:\s*ReviewCriteria\s*\|\s*null/);
  assert.match(typesSource, /export type AdminReviewKind\s*=\s*"ALL"\s*\|\s*"USER"\s*\|\s*"SAMPLE"/);
  assert.match(typesSource, /export type AdminReviewListItem\s*=\s*\{/);
  for (const field of ["content", "page", "size", "totalElements", "totalPages", "hasNext"]) {
    assert.match(adminPage, new RegExp(`\\b${field}:`));
  }
});

test("admin review API forwards search and paging and deletes only the encoded review id", () => {
  const listApi = declaration(apiSource, /export function getAdminReviews\s*\(/, /\nexport function deleteAdminReview/);
  const deleteApi = declaration(apiSource, /export function deleteAdminReview\s*\(/, /\n\}/);

  assert.match(listApi, /q\?:\s*string/);
  assert.match(listApi, /kind\?:\s*AdminReviewKind/);
  assert.match(listApi, /page\?:\s*number/);
  assert.match(listApi, /size\?:\s*number/);
  assert.match(listApi, /new URLSearchParams/);
  assert.match(listApi, /search\.set\("q",\s*query\.q\)/);
  assert.match(listApi, /requestJson<AdminReviewPage>\(`\/admin\/reviews\?\$\{search\}`/);
  assert.match(listApi, /Authorization:\s*`Bearer \$\{accessToken\}`/);

  assert.match(deleteApi, /requestEmpty\(`\/admin\/reviews\/\$\{encodeURIComponent\(reviewId\)\}`/);
  assert.match(deleteApi, /method:\s*"DELETE"/);
  assert.match(deleteApi, /Authorization:\s*`Bearer \$\{accessToken\}`/);
});

test("admin reviews page is protected, searchable, filterable, paged, and wires each row to deletion", () => {
  assert.match(adminPageSource, /requireSession\(/);
  assert.match(adminPageSource, /user\.role\s*!==\s*"ADMIN"/);
  assert.match(adminPageSource, /getAdminReviews\(accessToken/);
  assert.match(adminPageSource, /\bq\b/);
  assert.match(adminPageSource, /\bkind\b/);
  assert.match(adminPageSource, /\bpage\b/);
  assert.match(adminPageSource, /method="get"/i);
  assert.match(adminPageSource, /화면 예시/);
  assert.match(adminPageSource, /사용자 리뷰/);
  assert.match(adminPageSource, /<AdminReviewDeleteForm\b/);
  assert.match(adminPageSource, /data\.totalElements/);
});

test("review deletion requires an admin action and a deliberate confirmation dialog", () => {
  assert.match(adminActionsSource, /export async function deleteAdminReviewAction\s*\(/);
  assert.match(adminActionsSource, /getActionAccessToken\(\)/);
  assert.match(adminActionsSource, /user\.role\s*!==\s*"ADMIN"/);
  assert.match(adminActionsSource, /deleteAdminReview\([^,]+,\s*reviewId\)/);
  assert.match(adminActionsSource, /["']\/admin\/reviews["']/);
  assert.match(adminActionsSource, /revalidatePath\(/);

  assert.match(deleteFormSource, /useUiAlert\(\)/);
  assert.match(deleteFormSource, /confirm\(/);
  assert.match(deleteFormSource, /formRef\.current\?\.requestSubmit\(\)/);
  assert.match(deleteFormSource, /deleteAdminReviewAction\.bind\(null,\s*reviewId/);
  assert.match(deleteFormSource, /type="button"/);
});

test("sample reviews are labeled and cannot open a profile or receive community votes", () => {
  const ReviewSection = loadReviewSection();
  const sampleReview = { ...baseReview, authorId: null, authorNickname: "화력 운영팀", sampleReview: true };
  const html = renderToStaticMarkup(React.createElement(ReviewSection, {
    productId: "toner-1",
    criteria,
    summary: reviewSummary(sampleReview),
    isAuthenticated: false,
    savedSkinType: null,
  }));

  assert.match(html, /화면 예시 · 점수 집계 제외/);
  assert.doesNotMatch(html, /href="\/reviewers\//);
  assert.doesNotMatch(html, /data-review-firepower-vote/);
});

test("ordinary user reviews retain the reviewer profile and firepower vote journeys", () => {
  const ReviewSection = loadReviewSection();
  const html = renderToStaticMarkup(React.createElement(ReviewSection, {
    productId: "toner-1",
    criteria,
    summary: reviewSummary(baseReview),
    isAuthenticated: true,
    savedSkinType: "복합성",
  }));

  assert.match(html, /href="\/reviewers\/member-1"/);
  assert.match(html, /data-review-firepower-vote="review-1"/);
  assert.match(html, /data-petal-count="4"/);
  assert.doesNotMatch(html, /화면 예시 · 점수 집계 제외/);
});

test("the signed-in author's review opens with every editable value prefilled", () => {
  const actionBindings = [];
  const ReviewSection = loadReviewSection(actionBindings);
  const currentCriteria = {
    ...criteria,
    templateId: "template-current",
    templateVersion: 2,
    criteria: [{ id: "hydration-current", code: "HYDRATION", name: "현재 보습감", description: "현재 보습 기준", displayOrder: 1 }],
  };
  const viewerReviewCriteria = {
    ...criteria,
    templateId: "template-old",
    templateVersion: 1,
    criteria: [{ id: "hydration-old", code: "HYDRATION_OLD", name: "기존 보습 지속력", description: "리뷰 작성 당시 기준", displayOrder: 1 }],
  };
  const viewerReview = {
    ...baseReview,
    content: "수정 전 사용 후기를 그대로 불러옵니다.",
    skinType: "건성",
    usagePeriod: "TWO_WEEKS",
    repurchaseYn: false,
    scores: [{ criteriaId: "hydration-old", score: 5 }],
    updatedAt: "2026-09-11T00:00:00Z",
  };
  const html = renderToStaticMarkup(React.createElement(ReviewSection, {
    productId: "toner-1",
    criteria: currentCriteria,
    summary: { ...reviewSummary(viewerReview), viewerHasReviewed: true, viewerReview, viewerReviewCriteria },
    isAuthenticated: true,
    savedSkinType: "복합성",
    initialEditing: true,
  }));

  assert.match(html, /내 리뷰 수정/);
  assert.match(html, /수정 내용 저장/);
  assert.match(html, /기존 보습 지속력/);
  assert.doesNotMatch(html, /현재 보습감/);
  assert.match(html, /<input(?=[^>]*name="score_hydration-old")(?=[^>]*value="5")(?=[^>]*checked="")[^>]*>/);
  assert.match(html, /<option value="TWO_WEEKS" selected="">2주 정도<\/option>/);
  assert.match(html, /<option selected="">건성<\/option>/);
  assert.match(html, /<input(?=[^>]*name="repurchaseYn")(?=[^>]*value="false")(?=[^>]*checked="")[^>]*>/);
  assert.match(html, /수정 전 사용 후기를 그대로 불러옵니다\./);
  assert.deepEqual(actionBindings.find(({ kind }) => kind === "update")?.args, ["toner-1", ["hydration-old"]]);
  assert.equal(actionBindings.some(({ kind, args }) => kind === "update" && args[1]?.includes("hydration-current")), false);
});
