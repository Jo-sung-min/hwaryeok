export type ProductTone = "peach" | "sage" | "sand" | "rose" | "blue";
export type ProductPublicationStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  grade: 1 | 2 | 3 | 4 | 5;
  score: number;
  benefit: string;
  subBenefit: string;
  priceValue?: number;
  price: string;
  tone: ProductTone;
  tag?: string | null;
  imageUrl?: string | null;
  coupangPartnersUrl?: string | null;
  publicationStatus: ProductPublicationStatus;
  sourceUrl?: string | null;
  sourceCheckedAt?: string | null;
  ingredientScore?: number;
  compatibilityScore?: number;
  dataConfidenceScore?: number;
  confidenceLevel?: "HIGH" | "MEDIUM" | "LOW" | "LEGACY";
  scoreBasis?: string;
  matchReasons?: string[];
  cautions?: string[];
  ingredientCount?: number;
};

export type ProductRetailSnapshot = {
  matched: boolean;
  productId: string;
  retailer: "OLIVE_YOUNG" | null;
  retailerProductId: string | null;
  retailerProductName: string | null;
  retailerUrl: string | null;
  packageInfo: string | null;
  regularPrice: number | null;
  salePrice: number | null;
  availability: "AVAILABLE" | "SOLD_OUT" | null;
  checkedAt: string | null;
  notes: string | null;
};

export type ProductPage = {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type RisingProductRankingItem = {
  product: Product;
  rank: number;
  reviewCount: number;
  recentReviewCount: number;
  previousReviewCount: number;
  reviewGrowth: number;
  recentReviewScore: number;
};

export type RisingProductRankingPage = {
  category: string | null;
  content: RisingProductRankingItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  categories: IngredientRankingCategory[];
  window: { asOf: string; recentStart: string; previousStart: string; days: number };
  scoreBasis: string;
};

export type PromotionStatus = "DRAFT" | "ACTIVE" | "PAUSED";

export type ProductPromotion = {
  id: string;
  product: Product;
  recommendationScore: number;
  headline: string;
  recommendationReason: string;
  destinationUrl: string;
  emergingBrand: boolean;
  status: PromotionStatus;
  startsOn: string | null;
  endsOn: string | null;
  currentlyVisible: boolean;
  userReviewScore: number | null;
  userReviewCount: number;
  disclosure: "광고 · 관리자 추천점수";
  createdAt: string;
  updatedAt: string;
};

export type FavoriteProduct = {
  product: Product;
  favoritedAt: string;
};

export type FavoriteList = {
  content: FavoriteProduct[];
  totalElements: number;
};

export type RecentProduct = {
  product: Product;
  viewedAt: string;
};

export type RecentProductList = {
  content: RecentProduct[];
  totalElements: number;
};

export type ComparisonProduct = {
  product: Product;
  displayOrder: number;
  savedAt: string;
};

export type ComparisonProductList = {
  content: ComparisonProduct[];
  totalElements: number;
};

export type ReviewCriterion = {
  id: string;
  code: string;
  name: string;
  description: string;
  displayOrder: number;
};

export type ReviewCriteria = {
  categoryId: string;
  categoryName: string;
  templateId: string;
  templateVersion: number;
  criteria: ReviewCriterion[];
};

export type ReviewDetail = {
  id: string;
  authorId: string;
  authorNickname: string;
  communityRating: ReviewCommunityRating;
  totalScore: number;
  content: string;
  skinType: string;
  usagePeriod: "ONE_WEEK" | "TWO_WEEKS" | "ONE_MONTH" | "THREE_MONTHS" | "OVER_SIX_MONTHS";
  repurchaseYn: boolean;
  createdAt: string;
};

export type ReviewCriterionAverage = {
  criteriaId: string;
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  averageScore: number | null;
  reviewCount: number;
};

export type ProductReviewSummary = {
  productId: string;
  categoryId: string;
  categoryName: string;
  templateId: string;
  templateVersion: number;
  reviewScore: number | null;
  reviewCount: number;
  viewerHasReviewed: boolean;
  rankingStatus: "COLLECTING" | "REFERENCE" | "OFFICIAL";
  minimumOfficialReviewCount: number;
  criteriaAverages: ReviewCriterionAverage[];
  reviews: ReviewDetail[];
};

export type ReviewedProduct = {
  id: string;
  brand: string;
  name: string;
  category: string;
  tone: ProductTone;
  imageUrl: string | null;
};

export type ReviewerReview = {
  id: string;
  communityRating: ReviewCommunityRating;
  product: ReviewedProduct;
  totalScore: number;
  content: string;
  skinType: string;
  usagePeriod: ReviewDetail["usagePeriod"];
  repurchaseYn: boolean;
  createdAt: string;
};

export type ReviewerReviewList = {
  reviewer: {
    id: string;
    nickname: string;
  };
  averageReviewScore: number | null;
  reviewCount: number;
  content: ReviewerReview[];
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
};

export type ReviewCommunityRating = {
  averageScore: number | null;
  ratingCount: number;
  viewerScore: number | null;
  canRate: boolean;
};

export type ReviewerProfile = {
  userId: string;
  nickname: string;
  skinType: string | null;
  reviewFirepower: number | null;
  averageReceivedRating: number | null;
  receivedRatingCount: number;
  uniqueRaterCount: number;
  reviewCount: number;
  averageReviewScore: number | null;
  rank: number | null;
};

export type ReviewerRankingPage = {
  content: ReviewerProfile[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  skinType: string | null;
};

export type ScoreDetail = {
  label: string;
  value: number;
  note: string;
  positive: boolean;
};

export type Analysis = {
  productId: string;
  product: Product;
  skinType: string;
  concerns: string[];
  grade: 1 | 2 | 3 | 4 | 5;
  score: number;
  verdict: string;
  highlights: string[];
  cautions: string[];
  details: ScoreDetail[];
};

export type IngredientStatus = "GOOD" | "CAUTION" | "NEUTRAL";

export type Ingredient = {
  id: string;
  name: string;
  englishName: string;
  role: string;
  description: string;
  status: IngredientStatus;
  caution: string | null;
  tags: string[];
  evidenceLevel: "A" | "B" | "C";
  featured: boolean;
  displayOrder: number;
};

export type IngredientPage = {
  content: Ingredient[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type IngredientRankingOption = {
  id: string;
  name: string;
  englishName: string;
  role: string;
  tags: string[];
  productCount: number;
};

export type IngredientRankingCategory = { name: string; productCount: number };
export type IngredientRankingSort = "FIREPOWER" | "REVIEW";
export type IngredientRankingOptions = {
  ingredients: IngredientRankingOption[];
  categories: IngredientRankingCategory[];
};
export type IngredientRankingItem = {
  product: Product;
  rank: number | null;
  firepowerScore: number | null;
  reviewScore: number | null;
  reviewCount: number;
  concentrationNote: string | null;
};
export type IngredientRankingPage = {
  ingredientId: string | null;
  ingredientName: string | null;
  category: string | null;
  sort: IngredientRankingSort;
  content: IngredientRankingItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  categories: IngredientRankingCategory[];
};

export type IngredientDetail = Ingredient & {
  skinTypeFeatures: Record<string, string>;
  concernFeatures: Record<string, string>;
  products: Product[];
};

export type ProductIngredient = Ingredient & {
  displayOrder: number;
  concentrationNote: string | null;
  regulations: IngredientRegulation[];
};

export type IngredientRegulation = {
  sourceRecordId: string;
  standardName: string;
  englishName: string | null;
  casNo: string | null;
  country: string | null;
  noticeIngredientName: string | null;
  restrictionType: string | null;
  restrictionText: string | null;
  proviso: string | null;
  checkedAt: string | null;
  sourceUrl: string;
  disclaimer: string;
};

export type IngredientRegulationCandidate = Omit<IngredientRegulation, "sourceUrl" | "disclaimer"> & {
  confidence: number;
  matchReasons: string[];
  verified: boolean;
};

export type AdminIngredientRegulationReview = Omit<IngredientRegulation, "sourceUrl" | "disclaimer"> & {
  ingredientId: string;
  reviewerNickname: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type ProductIngredients = {
  productId: string;
  totalCount: number;
  goodCount: number;
  cautionCount: number;
  neutralCount: number;
  ingredients: ProductIngredient[];
  source: ProductIngredientSource | null;
};

export type ProductIngredientSource = {
  sourceType: "BRAND_OFFICIAL";
  sourceUrl: string;
  pageTitle: string;
  checkedAt: string;
  ingredientCount: number;
  verificationStatus: "VERIFIED";
};

export type DataSourceStatus = {
  id: "MFDS_FUNCTIONAL" | "MFDS_RESTRICTED" | "KCIA_DICTIONARY" | "BRAND_OFFICIAL" | "LEGACY_CURATED";
  displayName: string;
  sourceUrl: string;
  termsUrl: string | null;
  ingestionMode: "API" | "LICENSED_FILE" | "ADMIN_VERIFIED_URL" | "INTERNAL_SEED";
  usageNote: string;
  configured: boolean;
  recordCount: number;
  lastRunStatus: "RUNNING" | "SUCCEEDED" | "FAILED" | null;
  lastRunAt: string | null;
};

export type DataPipelineStatus = {
  sources: DataSourceStatus[];
  ingredientReferenceCount: number;
  mfdsProductCount: number;
  mfdsRegulationCount: number;
  officialIngredientListCount: number;
  verifiedOfficialIngredientListCount: number;
};

export type DataImportResult = {
  sourceId: string;
  status: "SUCCEEDED" | "CONFIGURATION_REQUIRED";
  recordsRead: number;
  recordsUpserted: number;
  recordsSkipped: number;
  message: string;
};

export type MfdsSyncResult = {
  results: DataImportResult[];
};

export type MfdsProductCandidate = {
  reportId: string;
  productName: string;
  companyName: string | null;
  manufacturerName: string | null;
  reportBasis: string | null;
  reportDate: string | null;
  confidence: number;
  matchReasons: string[];
  currentlyMatched: boolean;
};

export type AdminMfdsProductMatch = {
  productId: string;
  matchStatus: "ADMIN_VERIFIED" | "NO_MATCH";
  reportId: string | null;
  productName: string | null;
  companyName: string | null;
  manufacturerName: string | null;
  reportBasis: string | null;
  reportDate: string | null;
  confidence: number;
  reviewerNickname: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type ProductRegulatorySource = {
  matched: boolean;
  productId: string;
  label: string | null;
  reportId: string | null;
  productName: string | null;
  companyName: string | null;
  manufacturerName: string | null;
  reportBasis: string | null;
  reportDate: string | null;
  checkedAt: string | null;
  sourceUrl: string | null;
  disclaimer: string | null;
};

export type OfficialIngredientList = {
  productId: string;
  sourceUrl: string;
  sourceDomain: string;
  pageTitle: string;
  ingredientText: string;
  checkedAt: string;
  totalIngredientCount: number;
  matchedIngredientCount: number;
  unmatchedIngredients: string[];
  verificationStatus: "VERIFIED" | "PARTIAL" | "UNMATCHED";
  published: boolean;
};

export type PreferredIngredient = {
  priority: number;
  ingredient: Ingredient;
};

export type PreferredIngredients = {
  content: PreferredIngredient[];
  totalElements: number;
};

export type IngredientFirepowerBreakdown = {
  match: number;
  concentration: number;
  evidence: number;
  productType: number;
  synergy: number;
  stability: number;
  dataConfidence: number;
};

export type IngredientFirepowerProduct = {
  product: Product;
  firepowerScore: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  concentrationNote: string | null;
  breakdown: IngredientFirepowerBreakdown;
};

export type IngredientFirepower = {
  ingredientId: string;
  ingredientName: string;
  scoreVersion: string;
  disclaimer: string;
  products: IngredientFirepowerProduct[];
};

export type ExpertTopic = {
  code: "BARRIER" | "ACNE" | "SENSITIVE" | "AGING" | "INGREDIENT";
  name: string;
};

export type ExpertWorkplace = {
  hospitalName: string;
  region: string;
  address: string;
  phone: string | null;
  homepageUrl: string | null;
  verified: boolean;
};

export type ExpertStats = {
  answerCount: number;
  helpfulCount: number;
  saveCount: number;
  adoptedCount: number;
};

export type Expert = {
  id: string;
  slug: string;
  realName: string;
  verificationLabel: string;
  doctorVerified: boolean;
  specialistVerified: boolean;
  specialty: string | null;
  workplaceVerified: boolean;
  profileImageUrl: string | null;
  bio: string;
  topics: ExpertTopic[];
  workplace: ExpertWorkplace | null;
  stats: ExpertStats;
};

export type ExpertAnswer = {
  id: string;
  expert: Expert;
  content: string;
  helpfulCount: number;
  saveCount: number;
  adopted: boolean;
  viewerHelpful: boolean;
  viewerSaved: boolean;
  createdAt: string;
};

export type ExpertDetail = {
  expert: Expert;
  recentAnswers: ExpertAnswer[];
};

export type ExpertQuestionListItem = {
  id: string;
  authorNickname: string;
  title: string;
  skinType: string | null;
  ingredientId: string | null;
  ingredientName: string | null;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  answerCount: number;
  createdAt: string;
};

export type ExpertQuestionDetail = {
  id: string;
  authorNickname: string;
  title: string;
  content: string;
  skinType: string | null;
  ingredientId: string | null;
  ingredientName: string | null;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  viewerIsAuthor: boolean;
  createdAt: string;
  answers: ExpertAnswer[];
};

export type ExpertRankingItem = {
  rank: number;
  expert: Expert;
  activityScore: number;
  periodStats: ExpertStats;
};

export type ExpertRanking = {
  period: "WEEK" | "MONTH" | "YEAR" | "ALL_TIME";
  topic: ExpertTopic["code"] | null;
  disclaimer: string;
  content: ExpertRankingItem[];
};

export type ExpertApplication = {
  id: string;
  realName: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  specialistRequested: boolean;
  specialty: string | null;
  topics: ExpertTopic[];
  workplace: ExpertWorkplace | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpertEngagement = {
  answerId: string;
  helpfulCount: number;
  saveCount: number;
  viewerHelpful: boolean;
  viewerSaved: boolean;
  adopted: boolean;
};
