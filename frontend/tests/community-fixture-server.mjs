/**
 * Synthetic, read-only community UI fixtures. Never connects to a database or another server.
 * Start explicitly with: node tests/community-fixture-server.mjs
 * Point an isolated QA frontend at http://127.0.0.1:18080/api/v1; never use in the normal app.
 */
import { createServer } from "node:http";

const checkedAt = "2026-09-07T00:00:00Z";
const product = {
  id: "fixture-product", brand: "테스트 브랜드", name: "테스트 히알루론산 앰플", category: "앰플",
  grade: 3, score: 0, benefit: "테스트 제품 정보", subBenefit: "실제 상품이 아닌 화면 검증용 데이터",
  priceValue: 0, price: "테스트 상품", tone: "rose", tag: null, imageUrl: null,
  coupangPartnersUrl: null, publicationStatus: "PUBLISHED", sourceUrl: null, sourceCheckedAt: null,
  ingredientCount: 0, matchReasons: [], cautions: [],
};
const profiles = [
  { userId: "fixture-reviewer-dry", nickname: "테스트 보습기록", skinType: "건성", reviewFirepower: 86,
    averageReceivedRating: 4.8, receivedRatingCount: 24, uniqueRaterCount: 18, reviewCount: 2, averageReviewScore: 88, rank: 1 },
  { userId: "fixture-reviewer-combination", nickname: "테스트 성분탐험가", skinType: "복합성", reviewFirepower: 72.2,
    averageReceivedRating: 4.4, receivedRatingCount: 12, uniqueRaterCount: 7, reviewCount: 2, averageReviewScore: 82, rank: 2 },
  { userId: "fixture-reviewer-unrated", nickname: "테스트 첫리뷰", skinType: null, reviewFirepower: null,
    averageReceivedRating: null, receivedRatingCount: 0, uniqueRaterCount: 0, reviewCount: 1, averageReviewScore: 80, rank: null },
];
const video = {
  id: "fixture-video-approved", productId: product.id, productName: product.name, productBrand: product.brand,
  authorId: profiles[0].userId, authorNickname: profiles[0].nickname,
  title: "테스트 사용법 영상 · 세안 후 앰플 바르는 순서",
  description: "화면 배치 검증용 가상 영상이에요. 실제 제품 사용법이나 실제 유튜브 영상이 아닙니다.",
  videoUrl: "https://www.youtube.com/watch?v=QA000000001", videoId: "QA000000001",
  channelName: "테스트 뷰티 기록 채널", channelUrl: "https://www.youtube.com/@hwaryeok-qa-fixture",
  status: "APPROVED", featured: true, displayOrder: 1, moderationNote: null,
  createdAt: checkedAt, updatedAt: checkedAt, reviewedAt: checkedAt,
};

function reviewsFor(profile) {
  return Array.from({ length: profile.reviewCount }, (_, index) => ({
    id: `${profile.userId}-review-${index + 1}`,
    communityRating: {
      averageScore: profile.averageReceivedRating,
      ratingCount: profile.receivedRatingCount / profile.reviewCount,
      viewerScore: null,
      canRate: false,
    },
    product: index === 0
      ? { id: product.id, brand: product.brand, name: product.name, category: product.category, tone: product.tone, imageUrl: null }
      : { id: "fixture-product-cream", brand: "테스트 브랜드", name: "테스트 세라마이드 크림", category: "크림", tone: "sage", imageUrl: null },
    totalScore: profile.reviewCount === 1 ? profile.averageReviewScore : profile.averageReviewScore + (index === 0 ? 2 : -2),
    content: index === 0
      ? "[가상 QA 리뷰] 세안 후 소량씩 나눠 바르는 사용 경험을 공유하는 화면입니다. 이 내용과 모든 점수는 실제 사용자 평가가 아닌 테스트 데이터예요."
      : "[가상 QA 리뷰] 사용 기간과 피부타입, 재구매 의향을 함께 표시하는 두 번째 예시입니다. 실제 제품에 대한 후기가 아닙니다.",
    skinType: profile.skinType ?? "중성", usagePeriod: "ONE_MONTH", repurchaseYn: index === 0, createdAt: checkedAt,
  }));
}

function paginate(content, search) {
  const requestedPage = Number(search.get("page") ?? 0);
  const requestedSize = Number(search.get("size") ?? 20);
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  const size = Number.isSafeInteger(requestedSize) && requestedSize > 0 ? Math.min(requestedSize, 50) : 20;
  return {
    content: content.slice(page * size, (page + 1) * size), page, size,
    totalElements: content.length, totalPages: Math.ceil(content.length / size), hasNext: (page + 1) * size < content.length,
  };
}

function send(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Hwaryeok-QA-Fixture": "synthetic-only", "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(data));
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:18080");
  if (request.method === "GET") {
    if (url.pathname === "/api/v1/reviewers/ranking") {
      const skinType = url.searchParams.get("skinType") || null;
      const matches = profiles.filter((profile) => !skinType || profile.skinType === skinType);
      return send(response, 200, { ...paginate(matches, url.searchParams), skinType });
    }
    const reviewerRoute = url.pathname.match(/^\/api\/v1\/reviewers\/([^/]+)\/(profile|reviews)$/);
    if (reviewerRoute) {
      const profile = profiles.find((item) => item.userId === reviewerRoute[1]);
      if (profile) {
        if (reviewerRoute[2] === "profile") return send(response, 200, profile);
        const { totalElements: _, ...page } = paginate(reviewsFor(profile), url.searchParams);
        return send(response, 200, { reviewer: { id: profile.userId, nickname: profile.nickname },
          averageReviewScore: profile.averageReviewScore, reviewCount: profile.reviewCount, ...page });
      }
    }
    if (url.pathname === "/api/v1/products/fixture-product/usage-videos") {
      return send(response, 200, paginate([video], url.searchParams));
    }
    if (url.pathname === "/api/v1/products/fixture-product") return send(response, 200, product);
  }
  return send(response, 404, { code: "QA_FIXTURE_NOT_FOUND", message: "Synthetic QA fixture only: route is not available." });
});

server.listen(18080, "127.0.0.1", () => {
  console.log("Synthetic QA fixtures only: http://127.0.0.1:18080/api/v1 (read-only; no database; no external calls)");
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
