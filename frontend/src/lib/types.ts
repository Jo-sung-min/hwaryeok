export type ProductTone = "peach" | "sage" | "sand" | "rose" | "blue";

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

export type ScoreDetail = {
  label: string;
  value: number;
  note: string;
  positive: boolean;
};

export type Analysis = {
  productId: string;
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
