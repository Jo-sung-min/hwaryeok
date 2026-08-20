import type { MetadataRoute } from "next";
import { getExperts, getIngredients, getProducts } from "@/lib/api";

const staticPaths = [
  "",
  "/products",
  "/ranking",
  "/compare",
  "/ingredients",
  "/experts",
  "/experts/ranking",
  "/questions",
  "/principles",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const [products, ingredients, experts] = await Promise.all([
    getProducts().catch(() => []),
    getIngredients({ page: 0, size: 50, sort: "name", direction: "asc" }).then((page) => page.content).catch(() => []),
    getExperts().catch(() => []),
  ]);

  return [
    ...staticPaths.map((path, index) => ({
      url: new URL(path || "/", baseUrl).toString(),
      changeFrequency: (index === 0 ? "daily" : "weekly") as "daily" | "weekly",
      priority: index === 0 ? 1 : 0.7,
    })),
    ...products.map((product) => ({
      url: new URL(`/products/${product.id}`, baseUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...ingredients.map((ingredient) => ({
      url: new URL(`/ingredients/${ingredient.id}`, baseUrl).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...experts.map((expert) => ({
      url: new URL(`/experts/${expert.slug}`, baseUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

function siteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}
