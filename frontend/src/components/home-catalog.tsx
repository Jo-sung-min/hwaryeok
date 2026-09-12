import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, ChevronRight, Droplets, FlaskConical, MessageCircle, SlidersHorizontal, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { getIngredientRanking, getIngredientRankingOptions, getProductPage, getReviewerRanking, getRisingProductRanking, getWeeklyRanking } from "@/lib/api";
import { getCurrentSession, getFavoriteViewState, getOptionalSkinProfile } from "@/lib/auth-session";
import { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, homeProductListHref, orderHomeCategories, type HomeCatalogFilters, type HomeCatalogPath } from "@/lib/home-catalog";
import { rankingHref } from "@/lib/ingredient-ranking";
import { HomeBanner } from "@/components/home-banner";
import { HomeRankingCarousel } from "@/components/home-ranking-carousel";
import { IngredientRankingCard } from "@/components/ingredient-ranking-card";
import { HomeProductFilters } from "@/components/home-product-filters";
import { HomeProductCard } from "@/components/home-product-card";
import { HomePersonalization } from "@/components/home-personalization";
import { ReviewerFirepower } from "@/components/reviewer-firepower";
import styles from "./home-catalog.module.css";

const HOME_RANKING_PREVIEW_LIMIT = 4;

async function safelyLoad<T>(request: Promise<T>) {
  try {
    return { data: await request, failed: false } as const;
  } catch {
    return { data: null, failed: true } as const;
  }
}

export async function HomeCatalog({ requestedFilters, homePath = "/", intro }: {
  requestedFilters: HomeCatalogFilters;
  homePath?: HomeCatalogPath;
  intro?: ReactNode;
}) {
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
  const returnTo = homeCatalogHref(filters, "home-products", homePath);
  const categoryQuery = category ? `?${new URLSearchParams({ category })}` : "";
  const catalogHref = homeProductListHref(filters, personalized);
  const hasNonCategoryFilters = Boolean(ingredientId || filters.minReviewScore != null || filters.minFirepowerScore != null);
  const previewIngredient = ingredients.find((item) => item.id === ingredientId) ?? ingredients[0];
  const personalRankingHref = `/ranking/personal${categoryQuery}`;
  const ingredientRankingHref = previewIngredient
    ? rankingHref("/ranking", { ingredient: previewIngredient.id, category })
    : "/ranking";
  const risingRankingHref = `/ranking/rising${categoryQuery}`;

  const [catalog, personalResult, ingredientResult, risingResult, reviewerResult] = await Promise.all([
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
    profile
      ? safelyLoad(getProductPage({ profile, category: category || undefined, size: HOME_RANKING_PREVIEW_LIMIT, sort: "score", direction: "desc" }))
      : Promise.resolve({ data: null, failed: false } as const),
    previewIngredient
      ? safelyLoad(getIngredientRanking({ ingredientId: previewIngredient.id, category: category || undefined, sort: "FIREPOWER", size: HOME_RANKING_PREVIEW_LIMIT }))
      : Promise.resolve({ data: null, failed: false } as const),
    safelyLoad(getRisingProductRanking({ category: category || undefined, size: HOME_RANKING_PREVIEW_LIMIT })),
    safelyLoad(getReviewerRanking("", 0, HOME_RANKING_PREVIEW_LIMIT)),
  ]);
  const slides = buildWeeklyRankingSlides(weeklyRanking, catalog.content);

  return <div className={`container-page ${styles.home}`} data-home-page={homePath === "/" ? "true" : undefined}>
    <HomePersonalization user={user} profile={savedProfile} />
    {intro ?? <div className={styles.pageIntro}><p className={styles.eyebrow}>나만의 성분, 나만의 랭킹</p><h1>화장품의 기준을, <span>내 피부로.</span></h1></div>}
    <HomeBanner slides={slides} />

    <section id="home-products" className={styles.shelf} aria-labelledby="home-products-title">
      <div className={styles.shelfHeading}><div><p>{personalized ? "내 피부 설정을 반영한 상품 진열" : "궁금한 제품부터 가볍게 둘러보세요"}</p><h2 id="home-products-title">{personalized ? `${user?.nickname}님의 맞춤 상품` : "전체 상품"}<span>{catalog.totalElements}</span></h2></div><Link href={catalogHref}>전체보기 <ChevronRight size={17} /></Link></div>
      <HomeProductFilters filters={filters} categories={categories} ingredients={ingredients} resultCount={catalog.totalElements} homePath={homePath} />
      {discardedInvalidFilter && <p className={styles.filterNote} role="status">사용할 수 없는 필터를 제외하고 상품을 보여드려요.</p>}
      <div className={styles.catalogMeta}><p>{personalized ? "같은 제품도, 피부 설정에 따라 순위가 달라져요." : "피부 설정을 저장하면 나에게 맞는 순서로 바뀌어요."}</p><span><SlidersHorizontal size={14} />{personalized ? "맞춤 화력 높은 순" : "제품명순"}</span></div>
      {category && <p className={styles.filterNote}>‘{category}’ 제품 유형은 아래 제품 랭킹 미리보기에도 적용돼요.</p>}
      {catalog.content.length > 0 ? <div className={styles.catalogProducts}>{catalog.content.map((product, index) => <HomeProductCard key={product.id} product={product} rank={personalized ? index + 1 : undefined} scoreLabel={personalized ? "맞춤 화력" : undefined} favorited={favoriteIds.has(product.id)} isAuthenticated={Boolean(user)} returnTo={returnTo} />)}</div> : <div className={styles.empty} role="status"><FlaskConical size={25} /><h3>선택한 조건에 맞는 제품이 없어요</h3><p>필터 조건을 조금 줄여서 다시 살펴보세요.</p><Link href={homeCatalogHref({}, "home-products", homePath)} className="line-btn">필터 초기화</Link></div>}
      <Link href={catalogHref} className={styles.seeAll}>{hasNonCategoryFilters ? "필터 결과" : category || "전체"} 상품 더 보기 <ChevronRight size={16} /></Link>
    </section>

    <section id="personal-ranking" className={`${styles.shelf} ${styles.rankingPreview}`} aria-labelledby="personal-ranking-title" data-ranking-preview="personal">
      <PreviewHeading eyebrow={<><Sparkles size={14} /> 나를 기준으로</>} title="내 피부 랭킹" href={personalRankingHref} id="personal-ranking-title" />
      {profile ? personalResult.failed ? <PreviewState icon={<Sparkles size={22} />} title="맞춤 랭킹을 잠시 불러오지 못했어요" href={personalRankingHref} linkLabel="랭킹에서 다시 보기" /> : personalResult.data?.content.length ? <HomeRankingCarousel label="내 피부 랭킹" itemCount={personalResult.data.content.length} previewLimit={HOME_RANKING_PREVIEW_LIMIT} listClassName={styles.rankingPreviewList}>{personalResult.data.content.slice(0, HOME_RANKING_PREVIEW_LIMIT).map((product, index) => <HomeProductCard key={product.id} product={product} rank={index + 1} scoreLabel="맞춤 화력" favorited={favoriteIds.has(product.id)} isAuthenticated={Boolean(user)} returnTo={homeCatalogHref(filters, "personal-ranking", homePath)} />)}</HomeRankingCarousel> : <PreviewState icon={<Sparkles size={22} />} title="선택한 제품 유형에는 아직 맞춤 상품이 없어요" href={personalRankingHref} linkLabel="전체 랭킹 보기" /> : <PreviewState icon={<Sparkles size={22} />} title={user ? "피부 체크를 마치면 내 순위가 보여요" : "내 피부 기준을 만들면 순위가 달라져요"} description="피부 답변을 저장하면 내 기준에 맞춘 순위를 보여드려요." href="/skin-check" linkLabel="피부 체크하기" />}
    </section>

    <section id="ingredient-ranking" className={`${styles.shelf} ${styles.rankingPreview}`} aria-labelledby="ingredient-ranking-title" data-ranking-preview="ingredients">
      <PreviewHeading eyebrow={<><BarChart3 size={14} /> 성분을 기준으로</>} title={`${previewIngredient?.name ?? "성분별"} 랭킹`} href={ingredientRankingHref} id="ingredient-ranking-title" />
      {ingredientResult.failed ? <PreviewState icon={<BarChart3 size={22} />} title="성분 랭킹을 잠시 불러오지 못했어요" href={ingredientRankingHref} linkLabel="랭킹에서 다시 보기" /> : ingredientResult.data?.content.length ? <HomeRankingCarousel label={`${previewIngredient?.name ?? "성분별"} 랭킹`} itemCount={ingredientResult.data.content.length} previewLimit={HOME_RANKING_PREVIEW_LIMIT} listClassName={styles.rankingPreviewList}>{ingredientResult.data.content.slice(0, HOME_RANKING_PREVIEW_LIMIT).map((item) => <IngredientRankingCard key={item.product.id} item={item} ingredientName={ingredientResult.data?.ingredientName ?? previewIngredient?.name ?? null} sort="FIREPOWER" favorited={favoriteIds.has(item.product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={homeCatalogHref(filters, "ingredient-ranking", homePath)} />)}</HomeRankingCarousel> : <PreviewState icon={<BarChart3 size={22} />} title={previewIngredient ? `${previewIngredient.name} 제품을 준비하고 있어요` : "연결된 성분 제품을 준비하고 있어요"} href={ingredientRankingHref} linkLabel="성분 랭킹 보기" />}
    </section>

    <section id="rising-ranking" className={`${styles.shelf} ${styles.rankingPreview}`} aria-labelledby="rising-ranking-title" data-ranking-preview="rising">
      <PreviewHeading eyebrow={<><MessageCircle size={14} /> 실제 사용자의 리뷰로</>} title="급상승 랭킹" href={risingRankingHref} id="rising-ranking-title" />
      {risingResult.failed ? <PreviewState icon={<TrendingUp size={22} />} title="급상승 랭킹을 잠시 불러오지 못했어요" href={risingRankingHref} linkLabel="랭킹에서 다시 보기" /> : risingResult.data?.content.length ? <HomeRankingCarousel label="급상승 랭킹" itemCount={risingResult.data.content.length} previewLimit={HOME_RANKING_PREVIEW_LIMIT} listClassName={styles.rankingPreviewList}>{risingResult.data.content.slice(0, HOME_RANKING_PREVIEW_LIMIT).map((item) => <HomeProductCard key={item.product.id} product={item.product} rank={item.rank} growth={item} review={{ score: item.recentReviewScore, count: item.recentReviewCount }} favorited={favoriteIds.has(item.product.id)} isAuthenticated={Boolean(user)} returnTo={homeCatalogHref(filters, "rising-ranking", homePath)} />)}</HomeRankingCarousel> : <PreviewState icon={<TrendingUp size={22} />} title="새로운 리뷰가 모이면 순위가 생겨요" description={`${category ? `${category} 중 ` : ""}이전 7일보다 리뷰가 늘어난 제품이 아직 없어요.`} href={risingRankingHref} linkLabel="급상승 랭킹 보기" />}
    </section>

    <section id="reviewer-ranking" className={`${styles.shelf} ${styles.rankingPreview}`} aria-labelledby="reviewer-ranking-title" data-ranking-preview="reviewers">
      <PreviewHeading eyebrow={<><UsersRound size={14} /> 도움이 된 리뷰로</>} title="리뷰어 랭킹" href="/reviewers" id="reviewer-ranking-title" />
      {reviewerResult.failed ? <PreviewState icon={<UsersRound size={22} />} title="리뷰어 랭킹을 잠시 불러오지 못했어요" href="/reviewers" linkLabel="랭킹에서 다시 보기" /> : reviewerResult.data?.content.length ? <HomeRankingCarousel label="리뷰어 랭킹" itemCount={reviewerResult.data.content.length} previewLimit={HOME_RANKING_PREVIEW_LIMIT} listClassName={`${styles.rankingPreviewList} ${styles.reviewerItems}`} ordered>{reviewerResult.data.content.slice(0, HOME_RANKING_PREVIEW_LIMIT).map((reviewer) => <li key={reviewer.userId} className={styles.reviewerCard}><Link href={`/reviewers/${encodeURIComponent(reviewer.userId)}`}><div className={styles.reviewerTop}><span className={styles.reviewerRank} aria-label={reviewer.rank === null ? "순위 집계 전" : `${reviewer.rank}위`}>{reviewer.rank ?? "—"}</span><span className={styles.reviewerAvatar} aria-hidden="true">{reviewer.profileImageUrl ? <Image src={reviewer.profileImageUrl} alt="" fill sizes="38px" /> : Array.from(reviewer.nickname)[0]}</span></div><h3>{reviewer.nickname}</h3><p className={styles.reviewerSkin}><Droplets size={12} />{reviewer.skinType ? `${reviewer.skinType === "민감" ? "민감성" : reviewer.skinType} 피부` : "피부타입 미등록"}</p><p className={styles.reviewerMeta}>작성 리뷰 {reviewer.reviewCount}개 · 평가자 {reviewer.uniqueRaterCount}명</p><ReviewerFirepower score={reviewer.reviewFirepower} compact /></Link></li>)}</HomeRankingCarousel> : <PreviewState icon={<UsersRound size={22} />} title="첫 리뷰어를 기다리고 있어요" description="솔직한 리뷰에 다른 사용자의 평가가 모이면 리뷰 화력 순위가 생겨요." href="/products" linkLabel="리뷰할 제품 찾기" />}
    </section>

    <section className={styles.bottomGuide} aria-label="화력 집계 원칙">
      <details className={styles.scoreDetails}><summary>맞춤 화력·사용자 리뷰·광고, 어떻게 다를까요?</summary><p className={styles.scoreNote}>맞춤 화력은 피부 조사와 성분 자료를 이용한 비교 지표이며 개인별 효과를 보장하지 않아요. 제품 리뷰점수, 급상승 리뷰 증가량, 광고 추천점수는 서로 별도로 집계해요. <Link href="/principles">집계 기준 보기</Link></p></details>
    </section>
  </div>;
}

function PreviewHeading({ eyebrow, title, href, id }: { eyebrow: ReactNode; title: string; href: string; id: string }) {
  return <div className={styles.shelfHeading}><div><p className={styles.sectionEyebrow}>{eyebrow}</p><h2 id={id}>{title}</h2></div><Link href={href}>전체보기 <ChevronRight size={17} /></Link></div>;
}

function PreviewState({ icon, title, description, href, linkLabel }: { icon: ReactNode; title: string; description?: string; href: string; linkLabel: string }) {
  return <div className={styles.previewState}>{icon}<div><h3>{title}</h3>{description && <p>{description}</p>}</div><Link href={href}>{linkLabel}<ArrowRight size={14} /></Link></div>;
}
