import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { FavoriteButton, ProductVisual } from "@/components/product-ui";
import { FirepowerReport } from "@/components/firepower-report";
import { ProductIngredientsPanel } from "@/components/product-ingredients-panel";
import { RecentProductTracker } from "@/components/recent-product-tracker";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ReviewSection } from "./review-section";
import { ProductUsageVideos } from "@/components/usage-videos/product-usage-videos";
import { ApiRequestError, getAnalysis, getProduct, getProductIngredients, getProductRegulatorySource, getProductRetailSnapshot, getProductReviewSummary, getRelatedProducts } from "@/lib/api";
import type { Product, ProductRegulatorySource, ProductRetailSnapshot, ReviewCriteria } from "@/lib/types";
import { getCurrentSession, getFavoriteViewState, getOptionalSkinProfile, readAuthTokens } from "@/lib/auth-session";
import styles from "./product-detail.module.css";

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
  const [savedProfile, favoriteState, currentUser, authTokens] = await Promise.all([
    getOptionalSkinProfile(),
    getFavoriteViewState(),
    getCurrentSession(),
    readAuthTokens(),
  ]);
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
    const [analysis, relatedProducts, ingredientData, reviewSummary, retailSnapshot, regulatorySource] = await Promise.all([
      getAnalysis({ productId: id, ...analysisProfile }),
      getRelatedProducts(id, 3),
      getProductIngredients(id),
      getProductReviewSummary(id, currentUser ? authTokens.accessToken : undefined),
      getProductRetailSnapshot(id),
      getProductRegulatorySource(id),
    ]);
    const product = analysis.product;
    const hasCoupangPartnersLink = Boolean(product.coupangPartnersUrl);
    const coupangPurchaseUrl = product.coupangPartnersUrl ?? buildCoupangOfficialSellerSearchUrl(product.brand, product.name);
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
      <div className="pb-10">
        <ScrollToTop />
        <RecentProductTracker productId={product.id} enabled={favoriteState.isAuthenticated} />
        <div className="container-page py-3">
          <Link href="/products" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-[#726b74]"><ArrowLeft size={15} /> 화장품 목록</Link>
        </div>

        <section className="container-page">
          <div className={styles.hero}>
            <div className={styles.heroVisual}>
              <div className="absolute inset-0"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} variant="fill" /></div>
              <div className="absolute right-3 top-3"><FavoriteButton productId={product.id} initialFavorited={favoriteIds.has(product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={`/products/${product.id}`} /></div>
            </div>
            <div className={styles.heroBody}>
              <p className="text-[11px] font-semibold text-[#837984]">{product.brand} · {product.category}</p>
              <h1 className="mt-2 text-balance font-myeongjo text-[25px] font-semibold leading-[1.35]">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"><strong className="text-sm">{product.price}</strong>{product.netContent && <span className="text-[11px] font-semibold text-[#766b72]">본품 {product.netContent}</span>}<span className="text-[11px] text-[#8a818a]">{product.benefit} · {product.subBenefit}</span></div>

              <div className={styles.scoreSummary}>
                <div className="min-w-0"><span>{savedProfile?.skinType ? "내 피부 적합도" : "예시 피부 적합도"}</span><strong>{analysis.verdict}</strong><small>{analysis.skinType} 기준 · {analysis.grade}등급</small></div>
                <p><strong>{analysis.score}</strong><span>/100</span></p>
              </div>

              <p className={styles.primaryReason}>{analysis.highlights[0] ?? "성분 구성과 피부 조건을 함께 확인했어요."}</p>
              <a href={coupangPurchaseUrl} target="_blank" rel="noopener noreferrer sponsored nofollow" className="ink-btn mt-4 w-full" aria-label={`${product.brand} ${product.name} ${hasCoupangPartnersLink ? "쿠팡 파트너스 구매 페이지" : "쿠팡 공식판매처 검색"}, 새 창 열림`}><ShoppingBag size={17} /> 쿠팡에서 제품 보기 <ExternalLink size={13} /></a>
              {hasCoupangPartnersLink
                ? <p className="mt-2 text-center text-[9px] leading-4 text-[#8b8289]">쿠팡 파트너스 활동으로 일정액의 수수료를 제공받습니다.</p>
                : <p className="mt-2 text-center text-[9px] leading-4 text-[#8b8289]">공식 브랜드·판매자 검색으로 이동하며 주문 전 판매자를 확인해 주세요.</p>}

              <nav className={styles.jumpNav} aria-label="제품 상세 바로가기">
                <Link href="#report">궁합</Link><Link href="#ingredients">성분</Link><Link href="#reviews">리뷰</Link><Link href="#usage-videos">사용법</Link>
              </nav>
              <Link href={`/compare?left=${encodeURIComponent(product.id)}`} className={styles.compareLink}>제품 비교하기 <ChevronRight size={14} /></Link>
            </div>
          </div>
        </section>

        <ProductSourceDetails regulatorySource={regulatorySource} retailSnapshot={retailSnapshot} />
        <FirepowerReport analysis={analysis} ingredientData={ingredientData} reviewSummary={reviewSummary} personalized={Boolean(savedProfile?.skinType)} />
        <ProductIngredientsPanel data={ingredientData}/>
        <ReviewSection productId={product.id} criteria={reviewCriteria} summary={reviewSummary} isAuthenticated={favoriteState.isAuthenticated} savedSkinType={savedProfile?.skinType ?? null} />
        <div className="container-page pb-8"><ProductUsageVideos productId={product.id} /></div>
        <RelatedProducts products={relatedProducts} favoriteIds={favoriteIds} isAuthenticated={favoriteState.isAuthenticated} currentProductId={product.id} />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}

function buildCoupangOfficialSellerSearchUrl(brand: string, productName: string) {
  const query = encodeURIComponent(`${brand} ${productName} 공식 판매자`);
  return `https://www.coupang.com/np/search?q=${query}`;
}

function formatWon(value: number | null) {
  return value === null ? "가격 확인 중" : `${value.toLocaleString("ko-KR")}원`;
}

function formatCheckedAt(value: string) {
  return value.slice(0, 10).replaceAll("-", ".");
}

function ProductSourceDetails({ regulatorySource, retailSnapshot }: { regulatorySource: ProductRegulatorySource; retailSnapshot: ProductRetailSnapshot }) {
  const hasRetail = retailSnapshot.matched;
  const hasRegulatory = regulatorySource.matched;
  if (!hasRetail && !hasRegulatory) return null;

  return <section className="container-page mt-3">
    <details className="group overflow-hidden rounded-2xl border border-[#e8e5e9] bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-[#514b53]">
        <span className="flex min-w-0 items-center gap-2"><Store size={15} className="shrink-0 text-[#b64b70]" /><span>판매·공식 정보</span></span>
        <span className="ml-auto truncate text-[10px] font-medium text-[#89818a]">{[hasRetail && "올리브영", hasRegulatory && "식약처"].filter(Boolean).join(" · ")} 확인</span>
        <ChevronDown size={16} className="shrink-0 text-[#8e858e] transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="divide-y divide-[#ece9ed] border-t border-[#ece9ed]">
        {hasRetail && <div className="p-4">
          <div className="flex items-center justify-between gap-3"><strong className="text-xs">올리브영 판매 정보</strong><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${retailSnapshot.availability === "AVAILABLE" ? "bg-[#edf3e9] text-[#61735f]" : "bg-[#f3f0f2] text-[#7e747c]"}`}>{retailSnapshot.availability === "AVAILABLE" ? "판매 중" : "일시품절"}</span></div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#4f4850]">{retailSnapshot.retailerProductName || "상품명 확인 중"}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>{retailSnapshot.salePrice !== null && retailSnapshot.salePrice !== retailSnapshot.regularPrice && <span className="mr-2 text-[10px] text-[#978f97] line-through">{formatWon(retailSnapshot.regularPrice)}</span>}<strong className="text-sm text-[#a43a60]">{formatWon(retailSnapshot.salePrice ?? retailSnapshot.regularPrice)}</strong></div>
            {retailSnapshot.retailerUrl && <a href={retailSnapshot.retailerUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-9 items-center gap-1 text-[11px] font-semibold text-[#9d4664] underline underline-offset-4">원문 보기 <ExternalLink size={11} /></a>}
          </div>
          <p className="mt-2 text-[10px] leading-5 text-[#8b838a]">{[retailSnapshot.packageInfo && `구성 ${retailSnapshot.packageInfo}`, retailSnapshot.checkedAt && `${formatCheckedAt(retailSnapshot.checkedAt)} 확인`].filter(Boolean).join(" · ")}</p>
          {retailSnapshot.notes && <p className="mt-1 text-[10px] leading-5 text-[#8b838a]">{retailSnapshot.notes}</p>}
          <p className="mt-2 text-[9px] leading-4 text-[#999198]">가격과 재고는 달라질 수 있으며 구매는 상단 쿠팡 링크로 연결됩니다.</p>
        </div>}
        {hasRegulatory && <div className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#526a59]"><ShieldCheck size={14} />{regulatorySource.label || "식약처 공개 정보"}</div>
          <p className="mt-2 text-sm font-semibold">식약처 공개 보고품목과 대조했어요</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#f7faf7] p-3 text-xs">
            <SourceItem label="품목명" value={regulatorySource.productName} />
            <SourceItem label="책임판매업체" value={regulatorySource.companyName} />
            <SourceItem label="보고일" value={regulatorySource.reportDate ? formatCheckedAt(regulatorySource.reportDate) : null} />
            <SourceItem label="확인일" value={regulatorySource.checkedAt ? formatCheckedAt(regulatorySource.checkedAt) : null} />
          </dl>
          {regulatorySource.sourceUrl && <a href={regulatorySource.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex min-h-9 items-center gap-1 text-[11px] font-semibold text-[#58705e] underline underline-offset-4">공식 데이터 안내 <ExternalLink size={11} /></a>}
          {regulatorySource.disclaimer && <p className="mt-2 text-[9px] leading-4 text-[#918b8e]">{regulatorySource.disclaimer}</p>}
        </div>}
      </div>
    </details>
  </section>;
}

function RelatedProducts({ products, favoriteIds, isAuthenticated, currentProductId }: { products: Product[]; favoriteIds: ReadonlySet<string>; isAuthenticated: boolean; currentProductId: string }) {
  if (products.length === 0) return null;
  return <section className="container-page pb-10 pt-2">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-myeongjo text-xl font-semibold">함께 볼 제품</h2><Link href="/products" className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-[#a33f62]">전체보기 <ChevronRight size={13} /></Link></div>
    <div className="divide-y divide-[#ece9ed] border-y border-[#e8e5e9]">
      {products.map((item) => <article key={item.id} className="relative">
        <Link href={`/products/${encodeURIComponent(item.id)}`} className="flex min-h-28 items-center gap-3 py-3 pr-14">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#ece9ed] bg-white"><ProductVisual tone={item.tone} imageUrl={item.imageUrl} alt={`${item.brand} ${item.name}`} variant="thumbnail" /></div>
          <div className="min-w-0"><p className="text-[10px] font-semibold text-[#8b8289]">{item.brand} · {item.category}</p><h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{item.name}</h3><p className="mt-2 text-[11px] text-[#817880]"><strong className="text-[#a33f62]">{item.score}점</strong> · 성분 기준 · {item.grade}등급</p></div>
        </Link>
        <div className="absolute right-0 top-1/2 -translate-y-1/2"><FavoriteButton productId={item.id} initialFavorited={favoriteIds.has(item.id)} isAuthenticated={isAuthenticated} returnTo={`/products/${currentProductId}`} small /></div>
      </article>)}
    </div>
  </section>;
}

function SourceItem({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-[9px] font-semibold text-[#78817a]">{label}</dt><dd className="mt-0.5 font-medium leading-5 text-[#4f5d52]">{value || "정보 없음"}</dd></div>;
}
