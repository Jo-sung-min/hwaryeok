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
  publicationStatus: ProductPublicationStatus;
  sourceUrl?: string | null;
  sourceCheckedAt?: string | null;
};

export type ProductPage = {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
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
  authorNickname: string;
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
  rankingStatus: "COLLECTING" | "REFERENCE" | "OFFICIAL";
  minimumOfficialReviewCount: number;
  criteriaAverages: ReviewCriterionAverage[];
  reviews: ReviewDetail[];
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

export type IngredientDetail = Ingredient & {
  skinTypeFeatures: Record<string, string>;
  concernFeatures: Record<string, string>;
  products: Product[];
};

export type ProductIngredient = Ingredient & {
  displayOrder: number;
  concentrationNote: string | null;
};

export type ProductIngredients = {
  productId: string;
  totalCount: number;
  goodCount: number;
  cautionCount: number;
  neutralCount: number;
  ingredients: ProductIngredient[];
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
