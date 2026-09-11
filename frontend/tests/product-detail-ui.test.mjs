import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const page = readSource("../src/app/products/[id]/page.tsx");
const report = readSource("../src/components/firepower-report.tsx");
const ingredients = readSource("../src/components/product-ingredients-panel.tsx");
const reviews = readSource("../src/app/products/[id]/review-section.tsx");
const videos = readSource("../src/components/usage-videos/product-usage-videos.tsx");
const detailUi = [page, report, ingredients, reviews, videos].join("\n");

test("product detail keeps the four compact jump targets and their sections", () => {
  for (const anchor of ["report", "ingredients", "reviews", "usage-videos"]) {
    assert.match(page, new RegExp(`href=["']#${anchor}["']`));
    assert.match(detailUi, new RegExp(`id=["']${anchor}["']`));
  }
});

test("product purchase and supporting product journeys remain available", () => {
  assert.match(page, /rel="noopener noreferrer sponsored nofollow"/);
  assert.match(page, /product\.coupangPartnersUrl/);
  assert.match(page, /buildCoupangOfficialSellerSearchUrl/);
  assert.match(page, /\/compare\?left=/);
  assert.match(page, /<FavoriteButton\b/);
  assert.match(page, /<RecentProductTracker\b/);
  assert.match(page, /getRelatedProducts/);
  assert.match(page, /<RelatedProducts\b/);
});

test("minimal detail retains collapsed retail and official source information", () => {
  assert.match(page, /getProductRetailSnapshot/);
  assert.match(page, /getProductRegulatorySource/);
  assert.match(page, /<ProductSourceDetails\b/);
  assert.match(page, /<details\b/);
  assert.match(page, /판매·공식 정보/);
  assert.match(page, /올리브영 판매 정보/);
  assert.match(page, /식약처 공개 보고품목과 대조했어요/);
});

test("removed duplicate report sections do not return", () => {
  for (const removedCopy of [
    "한 장으로 보는 제품 리포트",
    "FIT DETAILS",
    "왜 이 점수가 나왔을까요",
  ]) {
    assert.doesNotMatch(detailUi, new RegExp(removedCopy));
  }
});

test("review and usage-video contribution paths remain wired", () => {
  assert.match(reviews, /createReviewAction\.bind/);
  assert.match(reviews, /<ReviewFirepowerVote\b/);
  assert.match(reviews, /href=\{`\/reviewers\/\$\{review\.authorId\}`\}/);
  assert.match(reviews, /\/products\/\$\{productId\}#reviews/);
  assert.match(reviews, /summary\.viewerHasReviewed/);

  assert.match(videos, /getProductUsageVideos/);
  assert.match(videos, /<UsageVideoCard\b/);
  assert.match(videos, /<UsageVideoForm\b/);
  assert.match(videos, /\/products\/\$\{encodeURIComponent\(productId\)\}\/usage-videos/);
  assert.match(videos, /href="\/my\/usage-videos"/);
});
