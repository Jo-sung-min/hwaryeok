import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FlaskConical, Leaf, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { ProductCard } from "@/components/product-ui";
import { ApiRequestError, getIngredient } from "@/lib/api";
import { getFavoriteViewState } from "@/lib/auth-session";

export default async function IngredientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [ingredient, favoriteState] = await Promise.all([getIngredient(id), getFavoriteViewState()]);
    const favoriteIds = new Set(favoriteState.favoriteIds);
    const skinFeatures = Object.entries(ingredient.skinTypeFeatures);
    const concernFeatures = Object.entries(ingredient.concernFeatures);
    const isCaution = ingredient.status === "CAUTION";

    return (
      <div className="pb-24">
        <div className="container-page py-6 md:py-9">
          <Link href="/ingredients" className="inline-flex items-center gap-2 text-sm text-[#766960]"><ArrowLeft size={16} /> 성분 사전</Link>
        </div>

        <section className="container-page">
          <div className="relative overflow-hidden rounded-[34px] border border-[#74513f1a] bg-[#fffaf2a8] px-6 py-12 md:px-12 md:py-16">
            <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[#e9a99a18] blur-3xl" />
            <div className="relative max-w-3xl">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${isCaution ? "bg-[#d3957d1c] text-[#9b5945]" : "bg-[#84917a1a] text-[#65715f]"}`}>
                {isCaution ? <TriangleAlert size={15} /> : <Check size={15} />}
                {isCaution ? "피부 상태를 살피며 사용해요" : "피부에 도움을 줄 수 있어요"}
              </span>
              <p className="mt-8 text-xs font-bold uppercase tracking-[.14em] text-[#a06b5d]">{ingredient.role}</p>
              <h1 className="mt-3 font-myeongjo text-4xl font-semibold md:text-6xl">{ingredient.name}</h1>
              <p className="mt-3 text-sm text-[#98877b] md:text-base">{ingredient.englishName}</p>
              <p className="mt-8 max-w-2xl text-base leading-8 text-[#655a52]">{ingredient.description}</p>
              <div className="mt-7 flex flex-wrap gap-2">{ingredient.tags.map((tag) => <span key={tag} className="rounded-full border border-[#a45a5025] bg-[#fff9f1] px-3 py-1.5 text-xs text-[#91564d]">#{tag}</span>)}</div>
            </div>
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <div className="mb-9">
            <p className="eyebrow mb-4">PERSONAL FIT</p>
            <h2 className="section-title font-myeongjo">내 피부에는 어떻게 느껴질까요?</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#76846d24] bg-[#edf1e84f] p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#7b8973] text-white"><Leaf size={18} /></span><h3 className="font-myeongjo text-xl font-semibold">피부 타입별 특징</h3></div>
              {skinFeatures.length > 0 ? <dl className="mt-7 grid gap-5">{skinFeatures.map(([skinType, feature]) => <div key={skinType} className="border-b border-[#76846d1c] pb-5 last:border-0 last:pb-0"><dt className="text-xs font-bold text-[#667260]">{skinType} 피부</dt><dd className="mt-2 text-sm leading-7 text-[#605e55]">{feature}</dd></div>)}</dl> : <p className="mt-7 text-sm text-[#746d65]">피부 타입별 정보가 준비 중이에요.</p>}
            </div>
            <div className="rounded-[28px] border border-[#c78e762a] bg-[#f4e4dc69] p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#c1856f] text-white"><Sparkles size={18} /></span><h3 className="font-myeongjo text-xl font-semibold">피부 고민별 특징</h3></div>
              {concernFeatures.length > 0 ? <dl className="mt-7 grid gap-5">{concernFeatures.map(([concern, feature]) => <div key={concern} className="border-b border-[#c78e761f] pb-5 last:border-0 last:pb-0"><dt className="text-xs font-bold text-[#9b6553]">{concern}</dt><dd className="mt-2 text-sm leading-7 text-[#685c55]">{feature}</dd></div>)}</dl> : <p className="mt-7 text-sm text-[#746d65]">피부 고민별 정보가 준비 중이에요.</p>}
            </div>
          </div>

          {ingredient.caution && (
            <div className="mt-5 flex gap-4 rounded-[24px] border border-[#b8745d2a] bg-[#fff8ee] p-6 md:p-7">
              <ShieldAlert className="mt-0.5 shrink-0 text-[#a76551]" size={22} />
              <div><h3 className="font-myeongjo text-lg font-semibold">사용 전에 확인해보세요</h3><p className="mt-2 text-sm leading-7 text-[#716158]">{ingredient.caution}</p></div>
            </div>
          )}
        </section>

        <section className="border-y border-[#dfa6b51f] bg-[#fff1f4] py-16 md:py-20">
          <div className="container-page">
            <div className="mb-9 flex items-end justify-between gap-5">
              <div><p className="eyebrow mb-4">IN PRODUCTS</p><h2 className="section-title font-myeongjo">이 성분이 담긴 화장품</h2></div>
              <FlaskConical className="hidden text-[#b47664] md:block" size={32} strokeWidth={1.5} />
            </div>
            {ingredient.products.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{ingredient.products.map((product) => <ProductCard key={product.id} product={product} initialFavorited={favoriteIds.has(product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={`/ingredients/${id}`} />)}</div> : <div className="paper-card rounded-[26px] p-10 text-center text-sm text-[#74695f]">연결된 제품을 준비 중이에요.</div>}
          </div>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}
