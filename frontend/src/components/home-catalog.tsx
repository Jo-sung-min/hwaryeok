import Link from "next/link";
import { ArrowRight, ChevronRight, FlaskConical, TrendingUp, SlidersHorizontal, MessageCircle } from "lucide-react";
import { getIngredientRankingOptions, getProductPage, getRisingProductRanking, getWeeklyRanking } from "@/lib/api";
import { getCurrentSession, getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, homeProductListHref, orderHomeCategories, type HomeCatalogFilters } from "@/lib/home-catalog";
import { HomeBanner } from "@/components/home-banner";
import { HomeProductFilters } from "@/components/home-product-filters";
import { HomeProductCard } from "@/components/home-product-card";
import { HomePersonalization } from "@/components/home-personalization";
import styles from "./home-catalog.module.css";

export async function HomeCatalog({ requestedFilters }: { requestedFilters: HomeCatalogFilters }) {
  const [options, user, savedProfile, favoriteState, weeklyRanking] = await Promise.all([
    getIngredientRankingOptions(), getCurrentSession(), getOptionalSkinProfile(), getFavoriteViewState(),
    getWeeklyRanking().catch(() => null),
  ]);
  const categories = orderHomeCategories(options.categories.filter((item) => item.productCount > 0));
  const ingredients = options.ingredients.filter((item) => item.productCount > 0);
  const category = categories.some((item) => item.name === requestedFilters.category) ? requestedFilters.category : "";
  const ingredientId = ingredients.some((item) => item.id === requestedFilters.ingredientId) ? requestedFilters.ingredientId : "";
  const filters: HomeCatalogFilters = { ...requestedFilters, category, ingredientId };
  const discardedInvalidFilter = category !== requestedFilters.category || ingredientId !== requestedFilters.ingredientId;
  const mode = homeDisplayMode(Boolean(user), Boolean(savedProfile?.configured));
  const personalized = mode === "personalized";
  const profile = personalized && savedProfile ? savedProfile : undefined;
  const favoriteIds = new Set(favoriteState.favoriteIds);
  const returnTo = homeCatalogHref(filters, "home-products");
  const categoryQuery = category ? `?${new URLSearchParams({ category })}` : "";
  const catalogHref = homeProductListHref(filters, personalized);
  const hasNonCategoryFilters = Boolean(ingredientId || filters.minReviewScore != null || filters.minFirepowerScore != null);

  const [catalog, risingResult] = await Promise.all([
    getProductPage({
      category,
      ingredientId: ingredientId || undefined,
      minReviewScore: filters.minReviewScore ?? undefined,
      minFirepowerScore: filters.minFirepowerScore ?? undefined,
      profile,
      size: 8,
      sort: personalized ? "score" : "name",
      direction: personalized ? "desc" : "asc",
    }),
    getRisingProductRanking({ category, size: 4 }).then((data) => ({ data, failed: false })).catch(() => ({ data: null, failed: true })),
  ]);
  const slides = buildWeeklyRankingSlides(weeklyRanking, catalog.content);

  return <div className={`container-page ${styles.home}`}>
    <HomePersonalization user={user} profile={savedProfile} />
    <div className={styles.pageIntro}><p className={styles.eyebrow}>나만의 성분, 나만의 랭킹</p><h1>화장품의 기준을, <span>내 피부로.</span></h1></div>
    <HomeBanner slides={slides} />

    <section id="home-products" className={styles.shelf} aria-labelledby="home-products-title">
      <div className={styles.shelfHeading}><div><p>{personalized ? "내 피부 설정을 반영한 상품 진열" : "궁금한 제품부터 가볍게 둘러보세요"}</p><h2 id="home-products-title">{personalized ? `${user?.nickname}님의 맞춤 상품` : "전체 상품"}<span>{catalog.totalElements}</span></h2></div><Link href={catalogHref}>전체보기 <ChevronRight size={17} /></Link></div>
      <HomeProductFilters filters={filters} categories={categories} ingredients={ingredients} resultCount={catalog.totalElements} />
      {discardedInvalidFilter && <p className={styles.filterNote} role="status">사용할 수 없는 필터를 제외하고 상품을 보여드려요.</p>}
      <div className={styles.catalogMeta}><p>{personalized ? "같은 제품도, 피부 설정에 따라 순위가 달라져요." : "피부 설정을 저장하면 나에게 맞는 순서로 바뀌어요."}</p><span><SlidersHorizontal size={14} />{personalized ? "맞춤 화력 높은 순" : "제품명순"}</span></div>
      {category && <p className={styles.filterNote}>‘{category}’ 제품 유형은 아래 급상승 랭킹에도 적용돼요.</p>}
      {catalog.content.length > 0 ? <div className={styles.catalogProducts}>{catalog.content.map((product, index) => <HomeProductCard key={product.id} product={product} rank={personalized ? index + 1 : undefined} scoreLabel={personalized ? "맞춤 화력" : undefined} favorited={favoriteIds.has(product.id)} isAuthenticated={Boolean(user)} returnTo={returnTo} />)}</div> : <div className={styles.empty} role="status"><FlaskConical size={25} /><h3>선택한 조건에 맞는 제품이 없어요</h3><p>필터 조건을 조금 줄여서 다시 살펴보세요.</p><Link href={homeCatalogHref({}, "home-products")} className="line-btn">필터 초기화</Link></div>}
      <Link href={catalogHref} className={styles.seeAll}>{hasNonCategoryFilters ? "필터 결과" : category || "전체"} 상품 더 보기 <ChevronRight size={16} /></Link>
    </section>

    <section id="rising-ranking" className={styles.shelf} aria-labelledby="rising-ranking-title">
      <div className={styles.shelfHeading}><div><p className={styles.sectionEyebrow}><MessageCircle size={14} /> 실제 사용자의 리뷰로</p><h2 id="rising-ranking-title">급상승 랭킹</h2></div><Link href={`/ranking/rising${categoryQuery}`}>전체보기 <ChevronRight size={17} /></Link></div>
      <p className={styles.catalogNote}>이전 7일보다 최근 7일의 리뷰가 늘어난 순서예요. 광고비는 반영하지 않아요.</p>
      {risingResult.failed ? <div className={styles.empty}><p role="status">급상승 랭킹을 잠시 불러오지 못했어요.</p><Link href={`/ranking/rising${categoryQuery}`} className="line-btn">다시 확인하기</Link></div> : risingResult.data?.content.length ? <div className={styles.products}>{risingResult.data.content.map((item) => <HomeProductCard key={item.product.id} product={item.product} rank={item.rank} growth={item} review={{ score: item.recentReviewScore, count: item.recentReviewCount }} favorited={favoriteIds.has(item.product.id)} isAuthenticated={Boolean(user)} returnTo={homeCatalogHref(filters, "rising-ranking")} />)}</div> : <div className={styles.trendEmpty}><TrendingUp size={29} /><div><h3>새로운 리뷰가 모이면 순위가 생겨요</h3><p>{category ? `${category} 중 ` : ""}이전 7일보다 리뷰가 늘어난 제품이 아직 없어요. 첫 리뷰로 사용 경험을 나눠주세요.</p></div><Link href={catalogHref}>제품 둘러보기 <ArrowRight size={15} /></Link></div>}
    </section>

    <section className={styles.bottomGuide} aria-label="화력 집계 원칙">
      <details className={styles.scoreDetails}><summary>맞춤 화력·사용자 리뷰·광고, 어떻게 다를까요?</summary><p className={styles.scoreNote}>맞춤 화력은 피부 조사와 성분 자료를 이용한 비교 지표이며 개인별 효과를 보장하지 않아요. 제품 리뷰점수, 급상승 리뷰 증가량, 광고 추천점수는 서로 별도로 집계해요. <Link href="/principles">집계 기준 보기</Link></p></details>
    </section>
  </div>;
}
