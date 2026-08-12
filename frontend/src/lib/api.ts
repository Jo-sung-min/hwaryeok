import "server-only";

import type { Product } from "@/lib/data";

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

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const search = new URLSearchParams();
  if (query.query) search.set("query", query.query);
  if (query.category && query.category !== "전체") search.set("category", query.category);
  if (query.grade) search.set("grade", String(query.grade));

  const response = await fetch(`${API_BASE_URL}/products?${search}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { code?: string; message?: string } | null;
    throw new ApiRequestError(
      body?.message ?? "화장품 정보를 불러오지 못했어요.",
      response.status,
      body?.code,
    );
  }

  return response.json() as Promise<Product[]>;
}
