import Link from "next/link";
import { ArrowRight, ChevronRight, FlaskConical, Megaphone, Search, TrendingUp, SlidersHorizontal, MessageCircle } from "lucide-react";
import { getIngredientRankingOptions, getProductPage, getRisingProductRanking, getWeeklyRanking } from "@/lib/api";
import { getCurrentSession, getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, orderHomeCategories } from "@/lib/home-catalog";
import { HomeBanner } from "@/components/home-banner";
import { HomeProductCard } from "@/components/home-product-card";
import { HomePersonalization } from "@/components/home-personalization";
import styles from "./home-catalog.module.css";

export async function HomeCatalog({ category: requestedCategory }: { category: string }) {
  const [options, user, savedProfile, favoriteState, weeklyRanking] = await Promise.all([
    getIngredientRankingOptions(), getCurrentSession(), getOptionalSkinProfile(), getFavoriteViewState(),
    getWeeklyRanking().catch(() => null),
  ]);
  const categories = orderHomeCategories(options.categories.filter((item) => item.productCount > 0));
  const category = categories.some((item) => item.name === requestedCategory) ? requestedCategory : "";
  const mode = homeDisplayMode(Boolean(user), Boolean(savedProfile?.configured));
  const personalized = mode === "personalized";
  const profile = personalized && savedProfile ? savedProfile : undefined;
  const favoriteIds = new Set(favoriteState.favoriteIds);
  const returnTo = homeCatalogHref(category, "home-products");
  const categoryQuery = category ? `?${new URLSearchParams({ category })}` : "";
  const catalogHref = personalized ? `/ranking/personal${categoryQuery}` : `/products?${new URLSearchParams({ ...(category ? { category } : {}), order: "name-asc" })}`;

  const [catalog, risingResult] = await Promise.all([
    getProductPage({ category, profile, size: 8, sort: personalized ? "score" : "name", direction: personalized ? "desc" : "asc" }),
    getRisingProductRanking({ category, size: 4 }).then((data) => ({ data, failed: false })).catch(() => ({ data: null, failed: true })),
  ]);
  const slides = buildWeeklyRankingSlides(weeklyRanking, catalog.content);

  return <div className={`container-page ${styles.home}`}>
    <div className={styles.searchRow}>
      <div className={styles.intro}><p className={styles.eyebrow}>나만의 성분, 나만의 랭킹</p><h1>화장품의 기준을, <span>내 피부로.</span></h1></div>
      <form action="/products" role="search" aria-label="화장품 찾기" className={styles.search}>
        <Search size={19} aria-hidden="true" /><label htmlFor="home-product-search" className="sr-only">제품명 또는 브랜드</label>
        <input id="home-product-search" name="query" placeholder="제품명·브랜드 검색" /><button type="submit">검색</button>
      </form>
    </div>

    <HomeBanner slides={slides} />
    <HomePersonalization user={user} profile={savedProfile} />

    <nav className={styles.sectionNav} aria-label="홈 상품 주제">
      <Link href="#home-products">{personalized ? "나의 맞춤 상품" : "전체 상품"}<ChevronRight size={14} /></Link>
      <Link href="#rising-ranking"><TrendingUp size={15} />급상승 랭킹</Link>
    </nav>

    <section id="home-products" className={styles.shelf} aria-labelledby="home-products-title">
      <div className={styles.shelfHeading}><div><p>{personalized ? "내 피부 설정을 반영한 상품 진열" : "궁금한 제품부터 가볍게 둘러보세요"}</p><h2 id="home-products-title">{personalized ? `${user?.nickname}님의 맞춤 상품` : "전체 상품"}<span>{catalog.totalElements}</span></h2></div><Link href={catalogHref}>전체보기 <ChevronRight size={17} /></Link></div>
      <nav className={styles.categoryTabs} aria-label="메인 상품 카테고리">
        {[{ name: "", productCount: 0 }, ...categories].map(({ name }) => <Link key={name} href={homeCatalogHref(name, "home-products")} scroll={false} aria-current={name === category ? "page" : undefined}>{name || "전체"}</Link>)}
      </nav>
      {requestedCategory && !category && <p className={styles.filterNote} role="status">해당 카테고리를 찾지 못해 전체 상품을 보여드려요.</p>}
      <div className={styles.catalogMeta}><p>{personalized ? "같은 제품도, 피부 설정에 따라 순위가 달라져요." : "피부 설정을 저장하면 나에게 맞는 순서로 바뀌어요."}</p><span><SlidersHorizontal size={14} />{personalized ? "맞춤 화력 높은 순" : "제품명순"}</span></div>
      {category && <p className={styles.filterNote}>‘{category}’ 카테고리가 아래 급상승 랭킹에도 적용돼요.</p>}
      {catalog.content.length > 0 ? <div className={styles.catalogProducts}>{catalog.content.map((product, index) => <HomeProductCard key={product.id} product={product} rank={personalized ? index + 1 : undefined} scoreLabel={personalized ? "맞춤 화력" : undefined} favorited={favoriteIds.has(product.id)} isAuthenticated={Boolean(user)} returnTo={returnTo} />)}</div> : <div className={styles.empty}><FlaskConical size={25} /><h3>이 카테고리의 제품을 준비하고 있어요</h3><p>공개된 제품이 등록되면 여기에 보여드릴게요.</p></div>}
      <Link href={catalogHref} className={styles.seeAll}>{category || "전체"} 상품 더 보기 <ChevronRight size={16} /></Link>
    </section>

    <section id="rising-ranking" className={styles.shelf} aria-labelledby="rising-ranking-title">
      <div className={styles.shelfHeading}><div><p className={styles.sectionEyebrow}><MessageCircle size={14} /> 실제 사용자의 리뷰로</p><h2 id="rising-ranking-title">급상승 랭킹</h2></div><Link href={`/ranking/rising${categoryQuery}`}>전체보기 <ChevronRight size={17} /></Link></div>
      <p className={styles.catalogNote}>이전 7일보다 최근 7일의 리뷰가 늘어난 순서예요. 광고비는 반영하지 않아요.</p>
      {risingResult.failed ? <div className={styles.empty}><p role="status">급상승 랭킹을 잠시 불러오지 못했어요.</p><Link href={`/ranking/rising${categoryQuery}`} className="line-btn">다시 확인하기</Link></div> : risingResult.data?.content.length ? <div className={styles.products}>{risingResult.data.content.map((item) => <HomeProductCard key={item.product.id} product={item.product} rank={item.rank} growth={item} review={{ score: item.recentReviewScore, count: item.recentReviewCount }} favorited={favoriteIds.has(item.product.id)} isAuthenticated={Boolean(user)} returnTo={homeCatalogHref(category, "rising-ranking")} />)}</div> : <div className={styles.trendEmpty}><TrendingUp size={29} /><div><h3>새로운 리뷰가 모이면 순위가 생겨요</h3><p>{category ? `${category} 중 ` : ""}이전 7일보다 리뷰가 늘어난 제품이 아직 없어요. 첫 리뷰로 사용 경험을 나눠주세요.</p></div><Link href={catalogHref}>제품 둘러보기 <ArrowRight size={15} /></Link></div>}
    </section>

    <section className={styles.bottomGuide} aria-label="화력 추천과 집계 원칙">
      <Link href="/promotions" className={styles.promotionGuide}><Megaphone size={24} /><div><h2>새로운 브랜드를 만나는 화력 추천 <span>광고</span></h2><p>관리자 추천 제품은 별도의 광고 탭에서 확인하세요.</p></div><ChevronRight size={20} /></Link>
      <details className={styles.scoreDetails}><summary>맞춤 화력·사용자 리뷰·광고, 어떻게 다를까요?</summary><p className={styles.scoreNote}>맞춤 화력은 피부 조사와 성분 자료를 이용한 비교 지표이며 개인별 효과를 보장하지 않아요. 제품 리뷰점수, 급상승 리뷰 증가량, 광고 추천점수는 서로 별도로 집계해요. <Link href="/principles">집계 기준 보기</Link></p></details>
    </section>
  </div>;
}
