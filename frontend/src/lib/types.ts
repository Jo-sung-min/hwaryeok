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
