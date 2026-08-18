import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImagePlus, ShieldCheck } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import { ProductImageForm } from "@/app/admin/products/product-image-form";
import { getProducts } from "@/lib/api";
import { requireSession } from "@/lib/auth-session";

export default async function AdminProductsPage() {
  const user = await requireSession("/admin/products");
  if (user.role !== "ADMIN") notFound();
  const products = await getProducts({ sort: "name", direction: "asc" });

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#dfa6b52b] bg-[#fff0f3] py-10 md:py-14">
        <div className="container-page">
          <Link href="/my" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#76646b]"><ArrowLeft size={16} /> 마이화력</Link>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="eyebrow mb-3">ADMIN PRODUCT MEDIA</p><h1 className="font-myeongjo text-3xl font-semibold md:text-4xl">제품 이미지 관리</h1><p className="mt-3 text-sm leading-7 text-[#7b6970]">PNG · JPG · WEBP, 제품당 5MB 이하 이미지를 등록할 수 있어요.</p></div>
            <span className="inline-flex self-start items-center gap-2 rounded-full border border-[#c7819540] bg-white/80 px-4 py-2 text-xs font-semibold text-[#9b4a5f]"><ShieldCheck size={15} /> 관리자 전용</span>
          </div>
        </div>
      </section>

      <section className="container-page py-9 md:py-14">
        <div className="mb-6 flex items-center justify-between"><h2 className="font-myeongjo text-2xl font-semibold">등록 제품 {products.length}개</h2><ImagePlus className="text-[#b9657b]" size={24} /></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-[24px] border border-[#dca9b62f] bg-[#fffafc] shadow-[0_14px_34px_rgba(151,76,96,.06)]">
              <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} compact />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9a7d86]">{product.brand} · {product.category}</p>
                <h3 className="mt-1 line-clamp-2 font-myeongjo text-lg font-semibold">{product.name}</h3>
                <p className="mt-2 text-[11px] text-[#89747c]">{product.imageUrl ? "등록 이미지 사용 중" : "기본 화력 일러스트 사용 중"}</p>
                <ProductImageForm productId={product.id} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
