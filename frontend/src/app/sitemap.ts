import type { MetadataRoute } from "next";
import { getExperts, getIngredients, getProductPage } from "@/lib/api";
import { resolveSeoPages } from "@/lib/seo";
import type { SeoChangeFrequency } from "@/lib/types";

const sitemapFrequency: Record<SeoChangeFrequency, NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>> = {
  ALWAYS: "always",
  HOURLY: "hourly",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  NEVER: "never",
};
const SITEMAP_API_TIMEOUT_MS = 8000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const [seoPages, products, ingredients, experts] = await Promise.all([
    resolveSeoPages(),
    getAllProducts(),
    getAllIngredients(),
    getExperts(undefined, { signal: AbortSignal.timeout(SITEMAP_API_TIMEOUT_MS) }),
  ]);

  return [
    ...seoPages
      .filter((page) => page.indexable && page.includeInSitemap)
      .map((page) => ({
        url: new URL(page.path, baseUrl).toString(),
        lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
        changeFrequency: sitemapFrequency[page.changeFrequency],
        priority: page.priority,
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

async function getAllIngredients() {
  const ingredients = new Map<string, Awaited<ReturnType<typeof getIngredients>>["content"][number]>();
  const signal = AbortSignal.timeout(SITEMAP_API_TIMEOUT_MS);
  let page = 0;

  while (page < 1000) {
    const response = await getIngredients({ page, size: 50, sort: "name", direction: "asc" }, { signal });
    response.content.forEach((ingredient) => ingredients.set(ingredient.id, ingredient));
    if (!response.hasNext || page + 1 >= response.totalPages) break;
    page += 1;
  }

  return [...ingredients.values()];
}

async function getAllProducts() {
  const products = new Map<string, Awaited<ReturnType<typeof getProductPage>>["content"][number]>();
  const signal = AbortSignal.timeout(SITEMAP_API_TIMEOUT_MS);
  let page = 0;

  while (page < 1000) {
    const response = await getProductPage({ page, size: 50 }, { signal });
    response.content.forEach((product) => products.set(product.id, product));
    if (!response.hasNext || page + 1 >= response.totalPages) break;
    page += 1;
  }

  return [...products.values()];
}

function siteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001");
  } catch {
    return new URL("http://localhost:3001");
  }
}
