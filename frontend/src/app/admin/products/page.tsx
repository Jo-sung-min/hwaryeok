import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackagePlus, ShieldCheck } from "lucide-react";
import { AdminProductItem } from "@/app/admin/products/admin-product-item";
import { ProductForm } from "@/app/admin/products/product-form";
import { getAdminProductIngredients, getAdminProducts, getIngredients } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";

export default async function AdminProductsPage() {
  const user = await requireSession("/admin/products");
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();
  const [products, ingredientPage] = await Promise.all([
    getAdminProducts(accessToken),
    getIngredients({ page: 0, size: 50, sort: "name", direction: "asc" }),
  ]).catch((error) => recoverAdminPageSession(error, "/admin/products"));
  const ingredientEntries = await Promise.all(products.map(async (product) => [
    product.id,
    await getAdminProductIngredients(accessToken, product.id),
  ] as const)).catch((error) => recoverAdminPageSession(error, "/admin/products"));
  const ingredientsByProduct = new Map(ingredientEntries);

  return (
    <div className="min-h-screen pb-28">
      <section className="border-b border-[#dfa6b52b] bg-[#fff0f3] py-9 md:py-14">
        <div className="container-page">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#76646b]"><ArrowLeft size={16} /> 관리자 센터</Link>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="eyebrow mb-3">PRODUCT MANAGEMENT</p><h1 className="font-myeongjo text-3xl font-semibold md:text-4xl">상품 정보·공개 관리</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#7b6970]">제품 정보, 출처, 성분을 확인한 뒤 공개하세요. 초안과 숨김 상품은 사용자 화면에 나타나지 않아요.</p></div>
            <span className="inline-flex self-start items-center gap-2 rounded-full border border-[#c7819540] bg-white/80 px-4 py-2 text-xs font-semibold text-[#9b4a5f]"><ShieldCheck size={15} /> 관리자 전용</span>
          </div>
        </div>
      </section>

      <main className="container-page py-8 md:py-12">
        <section className="paper-card rounded-[24px] p-5 sm:rounded-[28px] sm:p-7 md:p-9">
          <div className="mb-7 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f8e1e7] text-[#a44f65]"><PackagePlus size={20} /></span>
            <div><h2 className="font-myeongjo text-2xl font-semibold">새 상품 등록</h2><p className="mt-1 text-xs leading-5 text-[#88757c]">기본값은 안전한 초안이에요. 등록 후 이미지·출처·성분을 확인하고 공개하세요.</p></div>
          </div>
          <ProductForm />
        </section>

        <section className="mt-10 md:mt-14">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="eyebrow mb-2">REGISTERED PRODUCTS</p><h2 className="font-myeongjo text-2xl font-semibold">등록 상품 {products.length}개</h2></div>
            <p className="text-xs leading-5 text-[#89747c]">각 상품을 열어 정보·이미지·성분을 함께 관리할 수 있어요.</p>
          </div>
          <div className="space-y-4">
            {products.map((product) => <AdminProductItem key={product.id} product={product} availableIngredients={ingredientPage.content} initialIngredients={ingredientsByProduct.get(product.id)!} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
