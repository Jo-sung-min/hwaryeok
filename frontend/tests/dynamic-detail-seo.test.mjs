import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function transform(filename, react = false) {
  const presets = [require("next/dist/compiled/babel/preset-typescript").default];
  if (react) presets.push([require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }]);
  return require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets,
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  }).code;
}

function loadSeoBuilder() {
  const filename = fileURLToPath(new URL("../src/lib/seo.ts", import.meta.url));
  const localModule = { exports: {} };
  vm.runInNewContext(transform(filename), {
    module: localModule,
    exports: localModule.exports,
    require: (specifier) => {
      if (specifier === "server-only") return {};
      if (specifier === "@/lib/api") return { getSeoPage: async () => null, getSeoPages: async () => [] };
      throw new Error(`Unexpected SEO dependency: ${specifier}`);
    },
    URL,
    Date,
    Number,
    Map,
    Set,
  }, { filename });
  return localModule.exports.buildDetailSeoMetadata;
}

function loadGenerateMetadata(path, { api, resolveImage = (value) => value } = {}) {
  const filename = fileURLToPath(new URL(path, import.meta.url));
  const localModule = { exports: {} };
  const inertModule = new Proxy({}, {
    get: (_target, property) => property === "__esModule" ? true : () => null,
  });
  vm.runInNewContext(transform(filename, true), {
    module: localModule,
    exports: localModule.exports,
    require: (specifier) => {
      if (specifier === "react") return { cache: (fn) => fn };
      if (specifier === "react/jsx-runtime") return require(specifier);
      if (specifier === "@/lib/api") return api;
      if (specifier === "@/lib/media") return { resolveProductImageUrl: resolveImage };
      if (specifier === "@/lib/seo") return { buildDetailSeoMetadata: loadSeoBuilder() };
      if (specifier.endsWith(".module.css")) return {};
      return inertModule;
    },
    URL,
    Date,
    Number,
    Map,
    Set,
    encodeURIComponent,
  }, { filename });
  return localModule.exports.generateMetadata;
}

function assertCompleteMetadata(metadata, { title, description, canonical, image, ogTitle = title, ogDescription = description, indexable = true, follow = true }) {
  assert.equal(metadata.title.absolute, title);
  assert.equal(metadata.description, description);
  assert.equal(metadata.alternates.canonical, canonical);
  assert.equal(metadata.robots.index, indexable);
  assert.equal(metadata.robots.follow, follow);
  assert.equal(metadata.robots.googleBot.index, indexable);
  assert.equal(metadata.robots.googleBot.follow, follow);
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.locale, "ko_KR");
  assert.equal(metadata.openGraph.siteName, "화력 HWA:RYEOK");
  assert.equal(metadata.openGraph.title, ogTitle);
  assert.equal(metadata.openGraph.description, ogDescription);
  assert.equal(metadata.openGraph.url, canonical);
  assert.equal(metadata.openGraph.images[0].url, image);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.equal(metadata.twitter.title, metadata.openGraph.title);
  assert.equal(metadata.twitter.description, metadata.openGraph.description);
  assert.equal(metadata.twitter.images[0], image);
}

const detailPages = [
  {
    name: "product",
    lookup: "getProduct",
    path: "../src/app/products/[id]/page.tsx",
    params: { id: "route/id" },
    api: {
      getProduct: async () => ({
        id: "different-api-id",
        brand: "테스트 브랜드",
        name: "테스트 세럼",
        benefit: "수분 진정",
        subBenefit: "장벽 케어",
        imageUrl: "/api/products/serum.png",
      }),
    },
    resolveImage: () => "https://cdn.example.com/products/serum.png",
    title: "테스트 브랜드 테스트 세럼 | 화력",
    description: "수분 진정 · 장벽 케어. 성분, 사용자 리뷰점수, 피부 궁합을 화력 리포트에서 확인하세요.",
    canonical: "/products/different-api-id",
    failureCanonical: "/products/route%2Fid",
    image: "https://cdn.example.com/products/serum.png",
    ogTitle: "테스트 브랜드 테스트 세럼",
    ogDescription: "수분 진정 · 장벽 케어 화력 리포트",
    failureTitle: "제품을 찾을 수 없어요 | 화력",
  },
  {
    name: "ingredient",
    lookup: "getIngredient",
    path: "../src/app/ingredients/[id]/page.tsx",
    params: { id: "route/id" },
    api: {
      getIngredient: async () => ({
        id: "different-api-id",
        name: "판테놀",
        englishName: "Panthenol",
        description: "피부 장벽과 보습에 도움을 주는 성분이에요.",
      }),
    },
    title: "판테놀 성분 | 화력",
    description: "판테놀(Panthenol)의 역할과 피부별 특징을 알아보고, 이 성분이 포함된 제품의 랭킹과 사용자 리뷰를 확인하세요.",
    canonical: "/ingredients/different-api-id",
    failureCanonical: "/ingredients/route%2Fid",
    image: "/hero-watercolor.png",
    ogTitle: "판테놀 성분 사전",
    ogDescription: "피부 장벽과 보습에 도움을 주는 성분이에요.",
    failureTitle: "성분을 찾을 수 없어요 | 화력",
  },
  {
    name: "expert",
    lookup: "getExpert",
    path: "../src/app/experts/[slug]/page.tsx",
    params: { slug: "route/slug" },
    api: {
      getExpert: async () => ({
        expert: {
          slug: "different-api-slug",
          realName: "김화력",
          specialty: "피부과 전문의",
          verificationLabel: "의사·전문의 인증",
          bio: "민감 피부와 화장품 성분을 설명합니다.",
          profileImageUrl: "https://cdn.example.com/experts/kim.png",
        },
        recentAnswers: [],
      }),
    },
    title: "김화력 피부과 전문의 | 화력",
    description: "의사·전문의 인증. 민감 피부와 화장품 성분을 설명합니다.",
    canonical: "/experts/different-api-slug",
    failureCanonical: "/experts/route%2Fslug",
    image: "https://cdn.example.com/experts/kim.png",
    ogTitle: "김화력 피부과 전문의",
    ogDescription: "민감 피부와 화장품 성분을 설명합니다.",
    failureTitle: "전문가를 찾을 수 없어요 | 화력",
  },
  {
    name: "reviewer",
    lookup: "getReviewerProfile",
    path: "../src/app/reviewers/[userId]/page.tsx",
    params: { userId: "route/user" },
    api: {
      getReviewerProfile: async () => ({
        userId: "different-api-user",
        nickname: "불꽃리뷰어",
        reviewCount: 12,
        profileImageUrl: "https://cdn.example.com/reviewers/user.png",
      }),
    },
    title: "불꽃리뷰어님의 리뷰어 소개 | 화력",
    description: "불꽃리뷰어님의 피부 취향과 소개, 연결 채널, 실제 사용 리뷰 12개를 확인하세요.",
    canonical: "/reviewers/different-api-user",
    failureCanonical: "/reviewers/route%2Fuser",
    image: "https://cdn.example.com/reviewers/user.png",
    ogTitle: "불꽃리뷰어님의 리뷰어 소개",
    failureTitle: "리뷰 사용자를 찾을 수 없어요 | 화력",
  },
];

test("dynamic detail pages return fixed canonicals and complete social metadata", async () => {
  for (const detail of detailPages) {
    const lookupCalls = [];
    const api = {
      [detail.lookup]: async (value) => {
        lookupCalls.push(value);
        return detail.api[detail.lookup]();
      },
    };
    const generateMetadata = loadGenerateMetadata(detail.path, { api, resolveImage: detail.resolveImage });
    const metadata = await generateMetadata({ params: Promise.resolve(detail.params) });
    assertCompleteMetadata(metadata, detail);
    assert.equal(lookupCalls[0], Object.values(detail.params)[0]);
  }
});

test("dynamic detail lookup failures return complete noindex metadata", async () => {
  for (const detail of detailPages) {
    for (const failure of [Object.assign(new Error("missing"), { status: 404 }), new Error("unavailable")]) {
      const failingApi = { [detail.lookup]: async () => { throw failure; } };
      const generateMetadata = loadGenerateMetadata(detail.path, { api: failingApi });
      const metadata = await generateMetadata({ params: Promise.resolve(detail.params) });
      assertCompleteMetadata(metadata, {
        title: detail.failureTitle,
        description: metadata.description,
        canonical: detail.failureCanonical,
        image: "/hero-watercolor.png",
        indexable: false,
        follow: false,
      });
      assert.ok(metadata.description);
      assert.ok(metadata.openGraph.title);
      assert.ok(metadata.openGraph.description);
    }
  }
});

test("detail metadata falls back to the default share image when a resource has no usable image", () => {
  const buildDetailSeoMetadata = loadSeoBuilder();
  const metadata = buildDetailSeoMetadata({
    title: "이미지 없는 상세 | 화력",
    description: "공유 이미지가 없는 상세 화면입니다.",
    canonical: "/products/no-image",
    imageUrl: "javascript:alert(1)",
  });

  assert.equal(metadata.openGraph.images[0].url, "/hero-watercolor.png");
  assert.equal(metadata.twitter.images[0], "/hero-watercolor.png");
});

test("shared detail lookups are request-memoized where page and metadata use the same resource", () => {
  const ingredientSource = read("../src/app/ingredients/[id]/page.tsx");
  const expertSource = read("../src/app/experts/[slug]/page.tsx");
  const reviewerSource = read("../src/app/reviewers/[userId]/page.tsx");

  assert.match(ingredientSource, /const getCachedIngredient\s*=\s*cache\(getIngredient\)/);
  assert.equal(ingredientSource.match(/getCachedIngredient\(id\)/g)?.length, 2);
  assert.match(expertSource, /const getCachedExpert\s*=\s*cache\(getExpert\)/);
  assert.equal(expertSource.match(/getCachedExpert\(slug\)/g)?.length, 2);
  assert.match(reviewerSource, /const getCachedReviewerProfile\s*=\s*cache\(getReviewerProfile\)/);
  assert.equal(reviewerSource.match(/getCachedReviewerProfile\(userId\)/g)?.length, 2);
});
