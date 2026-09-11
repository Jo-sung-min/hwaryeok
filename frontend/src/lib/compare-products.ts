import type { Product } from "./types";

type SearchableProduct = Pick<Product, "id" | "brand" | "name" | "category">;

export function filterCompareProducts<T extends SearchableProduct>(
  products: T[],
  query: string,
  category: string,
) {
  const tokens = query
    .trim()
    .toLocaleLowerCase("ko-KR")
    .split(/\s+/)
    .filter(Boolean);

  return products.filter((product) => {
    if (category && product.category !== category) return false;
    if (tokens.length === 0) return true;
    const searchable = `${product.brand} ${product.name} ${product.category}`.toLocaleLowerCase("ko-KR");
    return tokens.every((token) => searchable.includes(token));
  });
}

export function replaceComparisonProduct(productIds: string[], index: number, productId: string) {
  if (index < 0 || index >= productIds.length || !productId) return productIds;

  const nextIds = [...productIds];
  const duplicateIndex = nextIds.indexOf(productId);
  if (duplicateIndex >= 0 && duplicateIndex !== index) {
    nextIds[duplicateIndex] = productIds[index];
  }
  nextIds[index] = productId;
  return nextIds;
}

export function comparisonSearch(productIds: string[]) {
  const search = new URLSearchParams();
  if (productIds[0]) search.set("left", productIds[0]);
  if (productIds[1]) search.set("right", productIds[1]);
  if (productIds[2]) search.set("third", productIds[2]);
  return search;
}
