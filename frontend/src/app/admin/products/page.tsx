import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminHeader, adminCardClass } from "@/app/admin/admin-ui";
import { AdminProductBrowser } from "@/app/admin/products/admin-product-browser";
import { ProductForm } from "@/app/admin/products/product-form";
import { getAdminMfdsProductMatches, getAdminOfficialIngredientSources, getAdminProductIngredients, getAdminProducts, getIngredients } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";

export default async function AdminProductsPage() {
  const user = await requireSession("/admin/products");
  if (user.role !== "ADMIN") redirect("/");
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();
  const [products, ingredientPage, officialSources, mfdsMatches] = await Promise.all([
    getAdminProducts(accessToken),
    getIngredients({ page: 0, size: 50, sort: "name", direction: "asc" }),
    getAdminOfficialIngredientSources(accessToken),
    getAdminMfdsProductMatches(accessToken),
  ]).catch((error) => recoverAdminPageSession(error, "/admin/products"));
  const ingredientEntries = await Promise.all(products.map(async (product) => [
    product.id,
    await getAdminProductIngredients(accessToken, product.id),
  ] as const)).catch((error) => recoverAdminPageSession(error, "/admin/products"));
  const ingredientsByProduct = new Map(ingredientEntries);
  const officialSourceByProduct = new Map(officialSources.map((source) => [source.productId, source]));
  const mfdsMatchByProduct = new Map(mfdsMatches.map((match) => [match.productId, match]));
  const defaultCheckedAt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
  const entries = products.map((product) => ({
    product,
    ingredients: ingredientsByProduct.get(product.id)!,
    officialIngredientSource: officialSourceByProduct.get(product.id),
    mfdsMatch: mfdsMatchByProduct.get(product.id),
  }));

  return (
    <>
      <AdminHeader title="상품" meta={`${products.length}개 · 식약처 검수 ${mfdsMatches.length}/${products.length}`} />
      <main className="container-page">
        <details className={`${adminCardClass} group`}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
            <Plus size={18} className="text-[#0071e3] transition group-open:rotate-45" />새 상품 등록
          </summary>
          <div className="border-t border-black/[.06] p-5 sm:p-6"><ProductForm /></div>
        </details>
        <div className="mt-8">
          <AdminProductBrowser entries={entries} availableIngredients={ingredientPage.content} defaultCheckedAt={defaultCheckedAt} />
        </div>
      </main>
    </>
  );
}
