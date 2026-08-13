import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SOURCE_URL = "https://www.hwahae.co.kr/rankings";
const ROBOTS_URL = "https://www.hwahae.co.kr/robots.txt";
const USER_AGENT = "HwaryeokSampleData/1.0";
const excludedNamePattern = /베이비|두피|핸드크림/;

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`${url} 요청 실패: ${response.status}`);
  return response.text();
}

function assertRobotsAllows(robots, pathname) {
  const disallowed = robots
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => /^Disallow:/i.test(line))
    .map((line) => line.slice(line.indexOf(":") + 1).trim())
    .filter(Boolean);
  if (disallowed.some((prefix) => pathname.startsWith(prefix))) {
    throw new Error(`robots.txt에서 ${pathname} 수집을 허용하지 않습니다.`);
  }
}

function categoryFor(name) {
  if (/마스크/.test(name)) return "마스크팩";
  if (/선크림|SPF/.test(name)) return "선케어";
  if (/클렌징폼|클렌징 폼|클렌징 밀크|클렌징 밤/.test(name)) return "클렌저";
  if (/토너/.test(name)) return "토너";
  if (/수분크림|수딩 크림|크림/.test(name)) return "크림";
  if (/세럼/.test(name)) return "세럼";
  if (/앰플/.test(name)) return "앰플";
  if (/젤/.test(name)) return "젤";
  return null;
}

function descriptorsFor(name, category) {
  if (/선크림|SPF/.test(name)) {
    return ["자외선 차단", /자작나무/.test(name) ? "자작나무 수분 선케어" : "나이아신 선케어"];
  }
  if (/클렌징/.test(name)) return [/약산성/.test(name) ? "약산성 세정" : "부드러운 세정", `${category} 제형`];
  if (/히알루론산|히알루로닉/.test(name)) return ["히알루론산 수분 케어", `${category} 제형`];
  if (/어성초/.test(name)) return ["어성초 진정", `${category} 제형`];
  if (/자작나무/.test(name)) return ["자작나무 수분 케어", `${category} 제형`];
  if (/나이아신/.test(name)) return ["나이아신 피부 톤 케어", `${category} 제형`];
  if (/시카|알로에/.test(name)) return ["시카·알로에 진정", `${category} 제형`];
  if (/스쿠알란/.test(name)) return ["스쿠알란 보습", `${category} 제형`];
  if (/오아시스/.test(name)) return ["수분 토너", "토너 제형"];
  return ["보습 케어", `${category} 제형`];
}

function toneFor(category) {
  return ({ 마스크팩: "rose", 선케어: "sand", 클렌저: "sage", 토너: "blue", 크림: "sand", 세럼: "peach", 앰플: "blue", 젤: "sage" })[category] ?? "peach";
}

async function crawl() {
  const robots = await fetchText(ROBOTS_URL);
  assertRobotsAllows(robots, "/rankings");

  const html = await fetchText(SOURCE_URL);
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(?<json>[\s\S]*?)<\/script>/);
  if (!match?.groups?.json) throw new Error("화해 랭킹 페이지에서 공개 JSON 데이터를 찾지 못했습니다.");

  const nextData = JSON.parse(match.groups.json);
  const rankingData = nextData?.props?.pageProps?.rankingProducts?.data;
  const details = rankingData?.details;
  if (!Array.isArray(details)) throw new Error("화해 랭킹 제품 배열 형식이 변경되었습니다.");

  const seenNames = new Set();
  const products = details.flatMap((entry, index) => {
    const name = entry?.product?.name?.trim();
    const brand = entry?.brand?.name?.trim();
    const category = name ? categoryFor(name) : null;
    if (!name || !brand || !category || excludedNamePattern.test(name) || seenNames.has(name)) return [];
    seenNames.add(name);

    const rating = Number(entry.product.review_rating);
    const [benefit, subBenefit] = descriptorsFor(name, category);
    return [{
      id: `hwahae-${entry.product.id}`,
      sourceProductId: String(entry.product.id),
      brand,
      name,
      category,
      baseScore: Math.max(0, Math.min(100, Math.round(rating * 20))),
      benefit,
      subBenefit,
      price: Number(entry.product.price) || 0,
      packageInfo: entry.product.package_info ?? null,
      tone: toneFor(category),
      tag: `화해 급상승 #${index + 1} · 평점 ${rating.toFixed(2)}`,
      sourceRank: index + 1,
      sourceRating: rating,
      sourceReviewCount: Number(entry.product.review_count) || 0,
      sourceUrl: SOURCE_URL,
      sourceProductUrl: `https://www.hwahae.co.kr/products/${entry.product.id}`,
    }];
  });

  return {
    source: "화해 공개 급상승 랭킹",
    sourceUrl: SOURCE_URL,
    sourceUpdatedAt: String(rankingData?.meta?.last_updated_at ?? "").slice(0, 10) || null,
    collectedAt: new Date().toISOString(),
    transform: "baseScore = round(reviewRating × 20); benefit/category는 제품명의 명시 키워드만 규칙 기반 변환",
    excluded: "베이비·두피·핸드 제품과 중복 제품명, 분류할 수 없는 항목",
    products,
  };
}

const snapshot = await crawl();
const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;

if (outputArg) {
  const outputPath = resolve(outputArg.slice("--output=".length));
  await writeFile(outputPath, serialized, "utf8");
  console.log(`${snapshot.products.length}개 제품을 ${outputPath}에 저장했습니다.`);
} else {
  process.stdout.write(serialized);
}
