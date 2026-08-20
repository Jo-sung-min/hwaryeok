import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileSearch, MessageCircle, Sparkles, TriangleAlert } from "lucide-react";
import { FavoriteButton, GradeSeal, InsightBadge, ProductCard, ProductVisual, ScoreRing } from "@/components/product-ui";
import { FirepowerReport } from "@/components/firepower-report";
import { ProductIngredientsPanel } from "@/components/product-ingredients-panel";
import { RecentProductTracker } from "@/components/recent-product-tracker";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ReviewSection } from "./review-section";
import { ApiRequestError, getAnalysis, getProduct, getProductIngredients, getProductReviewSummary, getRelatedProducts } from "@/lib/api";
import type { ReviewCriteria } from "@/lib/types";
import { getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";

const defaultProfile = {
  skinType: "수부지",
  concerns: ["속건조·당김", "붉은기·민감", "장벽·각질"],
};

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    return {
      title: `${product.brand} ${product.name}`,
      description: `${product.benefit} · ${product.subBenefit}. 성분, 사용자 리뷰점수, 피부 궁합을 화력 리포트에서 확인하세요.`,
      alternates: { canonical: `/products/${product.id}` },
      openGraph: {
        type: "website",
        title: `${product.brand} ${product.name}`,
        description: `${product.benefit} · ${product.subBenefit} 화력 리포트`,
        url: `/products/${product.id}`,
      },
    };
  } catch {
    return { title: "제품을 찾을 수 없어요", robots: { index: false, follow: false } };
  }
}

export default async function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const [savedProfile, favoriteState] = await Promise.all([getOptionalSkinProfile(), getFavoriteViewState()]);
  const favoriteIds = new Set(favoriteState.favoriteIds);
  const analysisProfile = savedProfile?.skinType
    ? {
        skinType: savedProfile.skinType,
        concerns: savedProfile.concerns,
        hydrationLevel: savedProfile.hydrationLevel,
        oilinessLevel: savedProfile.oilinessLevel,
        sensitivityLevel: savedProfile.sensitivityLevel,
        breakoutFrequency: savedProfile.breakoutFrequency,
        cleansingTightness: savedProfile.cleansingTightness,
        rednessFrequency: savedProfile.rednessFrequency,
        poreLevel: savedProfile.poreLevel,
        texturePreference: savedProfile.texturePreference,
        routineComplexity: savedProfile.routineComplexity,
        sunscreenUsage: savedProfile.sunscreenUsage,
        reactionTriggers: savedProfile.reactionTriggers,
        breakoutZones: savedProfile.breakoutZones,
        environments: savedProfile.environments,
        routineContexts: savedProfile.routineContexts,
      }
    : defaultProfile;

  try {
    const [analysis, relatedProducts, ingredientData, reviewSummary] = await Promise.all([
      getAnalysis({ productId: id, ...analysisProfile }),
      getRelatedProducts(id, 3),
      getProductIngredients(id),
      getProductReviewSummary(id),
    ]);
    const product = analysis.product;
    const reviewCriteria: ReviewCriteria = {
      categoryId: reviewSummary.categoryId,
      categoryName: reviewSummary.categoryName,
      templateId: reviewSummary.templateId,
      templateVersion: reviewSummary.templateVersion,
      criteria: reviewSummary.criteriaAverages.map(({ criteriaId, code, name, description, displayOrder }) => ({
        id: criteriaId,
        code,
        name,
        description,
        displayOrder,
      })),
    };

    return (
      <div className="pb-24">
        <ScrollToTop />
        <RecentProductTracker productId={product.id} enabled={favoriteState.isAuthenticated} />
        <div className="container-page py-4 md:py-9">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#766960]"><ArrowLeft size={16} /> 화장품 목록</Link>
        </div>

        <section className="container-page">
          <div className="grid overflow-hidden rounded-[26px] border border-[#e4afbb36] bg-white/88 sm:rounded-[32px] lg:grid-cols-[.86fr_1.14fr]">
            <div className="relative min-h-[270px] sm:min-h-[390px] lg:min-h-[590px]">
              <div className="absolute inset-0 [&>div]:h-full"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} /></div>
              <div className="absolute right-5 top-5"><FavoriteButton productId={product.id} initialFavorited={favoriteIds.has(product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={`/products/${product.id}`} /></div>
            </div>
            <div className="flex flex-col justify-center p-5 sm:p-6 md:p-10 lg:p-14">
              <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#a54f4910] px-3 py-1.5 text-[11px] font-bold text-[#944b5e]"><FileSearch size={14} /> 내 피부 제품 리포트</p>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8e7468]">{product.brand} · {product.category}</p>
              <h1 className="mt-3 text-balance font-myeongjo text-[28px] font-semibold leading-snug sm:text-3xl md:text-4xl">{product.name}</h1>
              <p className="mt-3 text-sm text-[#786a61]">{product.price}</p>
              <div className="my-6 h-px bg-[#75564518] sm:my-8" />
              <div className="flex items-end justify-between gap-4 sm:items-center sm:gap-7">
                <div className="min-w-0">
                  <p className="text-sm text-[#7b6b61]">{analysis.skinType} · {analysis.concerns.join(" · ")} 기준</p>
                  <h2 className="mt-1 font-myeongjo text-2xl font-semibold">내 피부 맞춤 결과</h2>
                  <div className="mt-4 flex items-center gap-3 sm:mt-5 sm:gap-4">
                    <GradeSeal grade={analysis.grade} />
                    <div><strong className="font-myeongjo text-xl">{analysis.verdict}</strong><p className="mt-1 text-xs text-[#89796e]">성분 근거 {product.confidenceLevel === "HIGH" ? "높음" : product.confidenceLevel === "MEDIUM" ? "보통" : "자료 보강 중"}</p></div>
                  </div>
                </div>
                <ScoreRing score={analysis.score} size="small" />
              </div>
              <div className="mt-6 rounded-2xl border border-[#e4afbb36] bg-[#fff1f4] p-4 text-sm leading-7 text-[#675a52] sm:mt-8"><Sparkles size={16} className="mr-2 inline text-[#a54f49]" />{analysis.highlights[0]}</div>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3"><Link href="#report" className="ink-btn min-w-0"><FileSearch size={17} /> 리포트 보기</Link><Link href="#reviews" className="line-btn px-4"><MessageCircle size={16} /> 실사용 리뷰</Link><Link href={`/compare?left=${product.id}`} className="line-btn col-span-2 px-4 sm:col-span-1">제품 비교</Link></div>
              <p className="mt-4 text-[11px] leading-5 text-[#8b7a71]">{product.scoreBasis} · 브랜드 인지도와 판매량은 점수에서 제외</p>
            </div>
          </div>
        </section>

        <FirepowerReport analysis={analysis} ingredientData={ingredientData} reviewSummary={reviewSummary} personalized={Boolean(savedProfile?.skinType)} />

        <section id="judgement" className="container-page py-12 md:py-24">
          <div className="mb-9 max-w-2xl"><InsightBadge /><h2 className="mt-4 section-title font-myeongjo">왜 이 점수가 나왔을까요?</h2><p className="mt-4 text-sm leading-7 text-[#796c63]">연결된 주요 성분의 근거 수준과 내 피부 신호를 함께 계산해 좋은 점과 확인할 점을 구분했어요.</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#76846d24] bg-[#edf1e84f] p-5 sm:rounded-[26px] sm:p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#7b8973] text-white"><Check size={18} /></span><h3 className="font-myeongjo text-xl font-semibold">잘 맞는 이유</h3></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#605e55]">{analysis.highlights.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
            <div className="rounded-[24px] border border-[#c78e762a] bg-[#f4e4dc69] p-5 sm:rounded-[26px] sm:p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#c1856f] text-white"><TriangleAlert size={17} /></span><h3 className="font-myeongjo text-xl font-semibold">이렇게 사용해보세요</h3></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#685c55]">{analysis.cautions.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dfa6b51f] bg-[#fff1f4] py-12 md:py-24">
          <div className="container-page grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div><p className="eyebrow mb-4">FIT DETAILS</p><h2 className="section-title font-myeongjo">피부 궁합을<br />한눈에 봐요</h2><p className="mt-5 text-sm leading-7 text-[#786b62]">좋은 점수는 길게, 부담과 위험 점수는 짧을수록 좋아요.</p></div>
            <div className="grid gap-6">{analysis.details.map((item) => <div key={item.label}><div className="mb-2 flex items-end justify-between gap-3"><div className="min-w-0"><strong className="font-myeongjo text-lg">{item.label}</strong><span className={`ml-2 text-[11px] sm:ml-3 sm:text-xs ${item.positive ? "text-[#71806b]" : "text-[#a06856]"}`}>{item.note}</span></div><strong className="shrink-0 font-myeongjo text-xl">{item.value}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#cfbdaa46]"><div className={`h-full rounded-full ${item.positive ? "bg-gradient-to-r from-[#9eaa92] to-[#70806d]" : "bg-gradient-to-r from-[#dfb29e] to-[#c1826d]"}`} style={{ width: `${item.value}%` }} /></div></div>)}</div>
          </div>
        </section>

        <ProductIngredientsPanel data={ingredientData}/>

        <ReviewSection productId={product.id} criteria={reviewCriteria} summary={reviewSummary} isAuthenticated={favoriteState.isAuthenticated} savedSkinType={savedProfile?.skinType ?? null} />

        {relatedProducts.length > 0 && <section className="container-page pb-14 md:pb-20"><h2 className="mb-6 font-myeongjo text-2xl font-semibold sm:mb-8">성분 기준으로 함께 볼 제품</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} initialFavorited={favoriteIds.has(item.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={`/products/${product.id}`} scoreLabel="성분 기준 점수" />)}</div></section>}
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}
