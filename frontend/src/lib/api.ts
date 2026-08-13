import "server-only";

import type { Analysis, IngredientDetail, IngredientPage, IngredientStatus, Product, ProductIngredients } from "@/lib/types";

const API_BASE_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ProductQuery = {
  query?: string;
  category?: string;
  grade?: number;
};

export type AnalysisInput = {
  productId: string;
  skinType: string;
  concerns: string[];
};

export type IngredientQuery = {
  query?: string;
  status?: IngredientStatus;
  tag?: string;
  page?: number;
  size?: number;
  sort?: "name" | "englishName" | "role" | "status";
  direction?: "asc" | "desc";
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { code?: string; message?: string } | null;
    throw new ApiRequestError(
      body?.message ?? "화장품 정보를 불러오지 못했어요.",
      response.status,
      body?.code,
    );
  }

  return response.json() as Promise<T>;
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const search = new URLSearchParams();
  if (query.query) search.set("query", query.query);
  if (query.category && query.category !== "전체") search.set("category", query.category);
  if (query.grade) search.set("grade", String(query.grade));

  const suffix = search.size > 0 ? `?${search}` : "";
  return requestJson<Product[]>(`/products${suffix}`);
}

export function getProduct(id: string): Promise<Product> {
  return requestJson<Product>(`/products/${encodeURIComponent(id)}`);
}

export function getRanking(skinType: string, limit = 6): Promise<Product[]> {
  const search = new URLSearchParams({ skinType, limit: String(limit) });
  return requestJson<Product[]>(`/products/ranking?${search}`);
}

export function getAnalysis(input: AnalysisInput): Promise<Analysis> {
  return requestJson<Analysis>("/analyses/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getIngredients(query: IngredientQuery = {}): Promise<IngredientPage> {
  const search = new URLSearchParams();
  if (query.query) search.set("query", query.query);
  if (query.status) search.set("status", query.status);
  if (query.tag) search.set("tag", query.tag);
  search.set("page", String(query.page ?? 0));
  search.set("size", String(query.size ?? 12));
  search.set("sort", query.sort ?? "name");
  search.set("direction", query.direction ?? "asc");
  return requestJson<IngredientPage>(`/ingredients?${search}`);
}

export function getIngredient(id: string): Promise<IngredientDetail> {
  return requestJson<IngredientDetail>(`/ingredients/${encodeURIComponent(id)}`);
}

export function getProductIngredients(productId: string): Promise<ProductIngredients> {
  return requestJson<ProductIngredients>(`/products/${encodeURIComponent(productId)}/ingredients`);
}
