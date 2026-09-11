import type { Product } from "@/lib/types";

export const PRODUCT_CATEGORIES = ["전체", "토너", "세럼", "앰플", "에센스", "크림", "로션", "선케어", "마스크팩", "젤", "클렌저"] as const;

export const PRODUCT_CONCERN_OPTIONS = [
  {
    value: "속건조·당김",
    label: "속건조",
    description: "수분을 끌어당기고 피부 장벽을 편안하게 유지하는 성분이 연결된 제품이에요.",
    ingredients: ["히알루론산", "판테놀", "세라마이드"],
    aliases: ["보습", "수분", "속건조", "건조", "건조함", "당김", "수분부족", "촉촉"],
  },
  {
    value: "유분·번들거림",
    label: "유분·피지",
    description: "수분은 지키면서 과한 유분과 번들거림을 정돈하는 성분이 연결된 제품이에요.",
    ingredients: ["나이아신아마이드", "징크 PCA", "살리실산"],
    aliases: ["유분", "번들거림", "피지", "기름짐", "지성"],
  },
  {
    value: "트러블·여드름",
    label: "트러블",
    description: "민감해진 피부를 진정시키고 유분 균형을 돕는 성분이 연결된 제품이에요.",
    ingredients: ["어성초", "판테놀", "아젤라익애씨드"],
    aliases: ["트러블", "여드름", "뾰루지", "좁쌀", "면포", "화이트헤드", "피부뒤집어짐"],
  },
  {
    value: "블랙헤드·모공",
    label: "모공",
    description: "모공 주변 피지와 묵은 각질 관리에 연결된 성분이 있는 제품이에요.",
    ingredients: ["살리실산", "나이아신아마이드", "징크 PCA"],
    aliases: ["모공", "블랙헤드", "늘어진모공", "막힌모공"],
  },
  {
    value: "붉은기·민감",
    label: "민감·붉은기",
    description: "붉고 예민하게 느껴지는 피부를 편안하게 돌보는 성분이 연결된 제품이에요.",
    ingredients: ["판테놀", "어성초", "비사보롤"],
    aliases: ["진정", "붉은기", "홍조", "열감", "자극", "민감", "예민", "면도후"],
  },
  {
    value: "장벽·각질",
    label: "장벽·각질",
    description: "수분 손실과 거칠게 들뜬 피부결 관리에 연결된 성분이 있는 제품이에요.",
    ingredients: ["세라마이드", "판테놀", "우레아"],
    aliases: ["장벽", "피부장벽", "장벽강화", "손상", "보호막", "각질", "들뜸", "거칠음", "피부결", "요철", "필링"],
  },
  {
    value: "잡티·칙칙함",
    label: "잡티·톤",
    description: "칙칙하고 고르지 않아 보이는 피부 톤 관리에 연결된 성분이 있는 제품이에요.",
    ingredients: ["나이아신아마이드", "트라넥사믹애씨드", "비타민 C"],
    aliases: ["미백", "잡티", "기미", "색소침착", "피부톤", "톤개선", "칙칙함", "다크스팟", "여드름흔적"],
  },
  {
    value: "탄력·잔주름",
    label: "주름·탄력",
    description: "잔주름 외관과 수분 탄력 관리 근거가 연결된 성분이 있는 제품이에요.",
    ingredients: ["레티놀", "나이아신아마이드", "히알루론산"],
    aliases: ["주름", "잔주름", "눈가주름", "팔자주름", "주름개선", "안티에이징", "노화", "노화케어", "탄력", "처짐", "리프팅"],
  },
] as const;

export const PRODUCT_CONCERNS = ["전체 고민", ...PRODUCT_CONCERN_OPTIONS.map((option) => option.value)] as const;
export const PRODUCT_PAGE_SIZE = 9;

export const PRODUCT_ORDERS = {
  "score-desc": { sort: "score", direction: "desc" },
  "ingredient-desc": { sort: "ingredient", direction: "desc" },
  "price-asc": { sort: "price", direction: "asc" },
  "price-desc": { sort: "price", direction: "desc" },
  "name-asc": { sort: "name", direction: "asc" },
} as const;

export type ProductSortOrder = keyof typeof PRODUCT_ORDERS;
export type ProductQuickFilterAxis = "category" | "concern";

export type ProductFilterValues = {
  query: string;
  category: string;
  grade: string;
  ingredientId: string;
  minReviewScore: string;
  minFirepowerScore: string;
  concern: string;
  maxPrice: string;
  confidence: string;
  order: ProductSortOrder;
};

export function buildProductQuickFilterHref(filters: ProductFilterValues, axis: ProductQuickFilterAxis, value: string) {
  return buildProductCatalogHref({
    ...filters,
    ...(axis === "concern" ? { query: "" } : {}),
    [axis]: value,
  });
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function includes(options: readonly string[], value: string) {
  return options.includes(value);
}

function normalizeConcernKeyword(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s._·/\-]+/g, "");
}

const concernAliases = PRODUCT_CONCERN_OPTIONS.flatMap((option) =>
  option.aliases.map((alias) => ({ alias: normalizeConcernKeyword(alias), option })),
).sort((left, right) => right.alias.length - left.alias.length);

export type ProductConcernOption = (typeof PRODUCT_CONCERN_OPTIONS)[number];

export type ProductConcernSearch = {
  option: ProductConcernOption;
  matchedKeyword: string;
  remainingQuery: string;
};

export function getProductConcernOption(value: string) {
  return PRODUCT_CONCERN_OPTIONS.find((option) => option.value === value);
}

export function resolveProductConcernSearch(query: string): ProductConcernSearch | undefined {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) return undefined;

  const whole = normalizeConcernKeyword(trimmed);
  const wholeMatch = concernAliases.find((candidate) => candidate.alias === whole);
  if (wholeMatch) {
    return { option: wholeMatch.option, matchedKeyword: trimmed, remainingQuery: "" };
  }

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  for (let span = tokens.length; span >= 1; span -= 1) {
    for (let start = 0; start + span <= tokens.length; start += 1) {
      const phrase = tokens.slice(start, start + span).join(" ");
      const match = concernAliases.find((candidate) => candidate.alias === normalizeConcernKeyword(phrase));
      if (!match) continue;
      return {
        option: match.option,
        matchedKeyword: phrase,
        remainingQuery: tokens.filter((_, tokenIndex) => tokenIndex < start || tokenIndex >= start + span).join(" "),
      };
    }
  }
  return undefined;
}

export function readProductCatalogState(params: RawSearchParams, validIngredientIds?: ReadonlySet<string>) {
  const gradeValue = first(params.grade);
  const parsedGrade = /^[1-5]$/.test(gradeValue) ? Number(gradeValue) : undefined;
  const rawOrder = first(params.order);
  const order: ProductSortOrder = Object.hasOwn(PRODUCT_ORDERS, rawOrder) ? rawOrder as ProductSortOrder : "score-desc";
  const rawPage = Number(first(params.page));
  const rawMaxPrice = first(params.maxPrice);
  const maxPrice = ["20000", "30000", "40000"].includes(rawMaxPrice) ? rawMaxPrice : "";
  const rawConfidence = first(params.confidence).toUpperCase();
  const confidence = ["HIGH", "MEDIUM", "LOW"].includes(rawConfidence) ? rawConfidence : "전체 근거";
  const rawReviewScore = first(params.minReviewScore);
  const minReviewScore = ["70", "80", "90"].includes(rawReviewScore) ? rawReviewScore : "";
  const rawFirepowerScore = first(params.minFirepowerScore);
  const minFirepowerScore = ["50", "65", "80", "90"].includes(rawFirepowerScore) ? rawFirepowerScore : "";
  const rawCategory = first(params.category);
  const rawConcern = first(params.concern);
  const rawQuery = first(params.query).trim().slice(0, 100);
  const concernSearch = resolveProductConcernSearch(rawQuery);
  const explicitConcern = includes(PRODUCT_CONCERNS, rawConcern) && rawConcern !== "전체 고민" ? rawConcern : "";
  const explicitCategory = includes(PRODUCT_CATEGORIES, rawCategory) && rawCategory !== "전체" ? rawCategory : "";
  const inferredCategory = !explicitCategory && concernSearch && includes(PRODUCT_CATEGORIES, concernSearch.remainingQuery)
    ? concernSearch.remainingQuery
    : "";
  const requestedIngredientId = first(params.ingredientId).trim().slice(0, 64);
  const ingredientId = validIngredientIds && !validIngredientIds.has(requestedIngredientId) ? "" : requestedIngredientId;

  return {
    requestedIngredientId,
    requestedPage: Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 1_001 ? rawPage - 1 : 0,
    filters: {
      query: explicitConcern || !concernSearch ? rawQuery : inferredCategory ? "" : concernSearch.remainingQuery,
      category: explicitCategory || inferredCategory || "전체",
      grade: parsedGrade ? `${parsedGrade}등급` : "전체 등급",
      ingredientId,
      minReviewScore,
      minFirepowerScore,
      concern: explicitConcern || concernSearch?.option.value || "전체 고민",
      maxPrice,
      confidence,
      order,
    } satisfies ProductFilterValues,
    concernSearch: explicitConcern ? undefined : concernSearch,
  };
}

export function appendProductCatalogSearchParams(search: URLSearchParams, filters: ProductFilterValues) {
  if (filters.query) search.set("query", filters.query);
  if (filters.category !== "전체") search.set("category", filters.category);
  if (filters.grade !== "전체 등급") search.set("grade", filters.grade.replace("등급", ""));
  if (filters.ingredientId) search.set("ingredientId", filters.ingredientId);
  if (filters.minReviewScore) search.set("minReviewScore", filters.minReviewScore);
  if (filters.minFirepowerScore) search.set("minFirepowerScore", filters.minFirepowerScore);
  if (filters.concern !== "전체 고민") search.set("concern", filters.concern);
  if (filters.maxPrice) search.set("maxPrice", filters.maxPrice);
  if (filters.confidence !== "전체 근거") search.set("confidence", filters.confidence);
  if (filters.order !== "score-desc") search.set("order", filters.order);
  return search;
}

export function buildProductCatalogHref(filters: ProductFilterValues, page = 0) {
  const search = appendProductCatalogSearchParams(new URLSearchParams(), filters);
  if (page > 0) search.set("page", String(page + 1));
  return search.size ? `/products?${search}` : "/products";
}

export function buildProductCatalogFeedUrl(filters: ProductFilterValues) {
  const search = appendProductCatalogSearchParams(new URLSearchParams(), filters);
  return `/api/catalog/products${search.size ? `?${search}` : ""}`;
}

export function productCatalogBackendFilters(filters: ProductFilterValues) {
  return {
    query: filters.query || undefined,
    category: filters.category === "전체" ? undefined : filters.category,
    grade: filters.grade === "전체 등급" ? undefined : Number(filters.grade.replace("등급", "")),
    ingredientId: filters.ingredientId || undefined,
    minReviewScore: filters.minReviewScore ? Number(filters.minReviewScore) : undefined,
    minFirepowerScore: filters.minFirepowerScore ? Number(filters.minFirepowerScore) : undefined,
    concern: filters.concern === "전체 고민" ? undefined : filters.concern,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    confidence: filters.confidence === "전체 근거" ? undefined : filters.confidence as "HIGH" | "MEDIUM" | "LOW",
    ...PRODUCT_ORDERS[filters.order],
  };
}

export function appendUniqueProducts(current: Product[], incoming: Product[]) {
  const knownIds = new Set(current.map((product) => product.id));
  const next = [...current];
  for (const product of incoming) {
    if (knownIds.has(product.id)) continue;
    knownIds.add(product.id);
    next.push(product);
  }
  return next;
}
