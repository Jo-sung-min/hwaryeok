import Link from "next/link";
import { ArrowRight, Bubbles, ChevronRight, Droplet, Droplets, FlaskConical, Grid2X2, Leaf, Megaphone, Pipette, Search, Shield, Sparkles, Sun, type LucideIcon } from "lucide-react";
import { getIngredientRanking, getIngredientRankingOptions, getUserPreferredIngredients } from "@/lib/api";
import { getFavoriteViewState, readAuthTokens } from "@/lib/auth-session";
import { rankingHref, type IngredientRankingFilters } from "@/lib/ingredient-ranking";
import { homeCategoryId, orderHomeCategories } from "@/lib/home-catalog";
import type { IngredientRankingItem } from "@/lib/types";
import { IngredientPicker } from "@/components/ingredient-picker";
import { FavoriteButton, ProductVisual } from "@/components/product-ui";
import { HomeBanner, type HomeBannerSlide } from "@/components/home-banner";
import styles from "./home-catalog.module.css";

const categoryIcons: Record<string, LucideIcon> = {
  앰플: Pipette, 세럼: Droplets, 크림: Shield, 토너: Droplet, 에센스: FlaskConical,
  로션: Droplets, 선케어: Sun, 클렌저: Bubbles, 마스크팩: Sparkles, 젤: Leaf,
};

const bannerGuides = [
  { ingredient: "hyaluronic-acid", category: "앰플", label: "히알루론산 × 앰플", title: "내가 찾던 성분,\n앰플에서 만나보세요", description: "히알루론산이 포함된 앰플 모아보기" },
  { ingredient: "panthenol", category: "크림", label: "판테놀 × 크림", title: "크림을 고르는 기준,\n이번에는 판테놀", description: "성분부터 살펴보는 나의 크림" },
  { ingredient: "heartleaf", category: "토너", label: "어성초 × 토너", title: "토너 한 병도,\n나의 관심 성분으로", description: "어성초가 포함된 토너 살펴보기" },
];

async function preferredIngredientIds() {
  const { accessToken } = await readAuthTokens();
  if (!accessToken) return [];
  try {
    return (await getUserPreferredIngredients(accessToken)).content.map((item) => item.ingredient.id);
  } catch {
    return [];
  }
}

export async function HomeCatalog({ filters }: { filters: IngredientRankingFilters }) {
  const [options, favoriteState, preferredIds] = await Promise.all([
    getIngredientRankingOptions(), getFavoriteViewState(), preferredIngredientIds(),
  ]);
  const selected = options.ingredients.find((item) => item.id === filters.ingredient);
  const unknownIngredient = Boolean(filters.ingredient && !selected);
  const ingredient = selected?.id ?? "";
  const homeFilters = { ...filters, ingredient, category: "", page: 0 };
  const returnTo = rankingHref("/", homeFilters);
  const favoriteIds = new Set(favoriteState.favoriteIds);

  const [overview, banners] = await Promise.all([
    getIngredientRanking({ ingredientId: ingredient, size: 1 }),
    Promise.all(bannerGuides.filter((guide) => options.ingredients.some((item) => item.id === guide.ingredient)).map(async (guide) => {
      const result = await getIngredientRanking({ ingredientId: guide.ingredient, category: guide.category, size: 1 });
      const product = result.content[0]?.product;
      if (!product?.imageUrl) return null;
      return { id: guide.ingredient, label: guide.label, title: guide.title, description: guide.description,
        href: rankingHref("/ranking", { ingredient: guide.ingredient, category: guide.category }), product } satisfies HomeBannerSlide;
    })),
  ]);
  const categories = orderHomeCategories(overview.categories.filter((item) => item.productCount > 0));
  const shelves = await Promise.all(categories.map(async (category) => ({
    category: category.name,
    result: await getIngredientRanking({ ingredientId: ingredient, category: category.name, size: 4 }),
  })));
  const slides = banners.filter((slide): slide is HomeBannerSlide => slide !== null);

  return (
    <div className={`container-page ${styles.home}`}>
      <div className={styles.searchRow}>
        <h1>나에게 맞는 성분, <span>화력</span></h1>
        <form action="/products" role="search" aria-label="화장품 찾기" className={styles.search}>
          <Search size={19} aria-hidden="true" />
          <label htmlFor="home-product-search" className="sr-only">제품명 또는 브랜드</label>
          <input id="home-product-search" name="query" placeholder="궁금한 제품명·브랜드를 검색하세요" />
          <button type="submit">검색</button>
        </form>
      </div>

      <div className={slides.length ? styles.bannerGrid : styles.bannerGridEmpty}>
        <HomeBanner slides={slides} />
        <Link href="/skin-check" className={styles.guideBanner}>
          <span className={styles.guideEyebrow}><Sparkles size={17} /> 나의 성분 찾기</span>
          <h2>어떤 성분부터<br />골라야 할지 고민이라면</h2>
          <span className={styles.guideCta}>1분 피부 체크 <ArrowRight size={17} /></span>
        </Link>
      </div>

      <nav className={styles.categoryNav} aria-label="홈 제품 카테고리 바로가기">
        <Link href={rankingHref("/ranking", { ingredient })}><span className={styles.categoryIcon}><Grid2X2 size={24} strokeWidth={1.7} /></span><span>전체보기</span></Link>
        {categories.map(({ name }) => {
          const Icon = categoryIcons[name] ?? FlaskConical;
          return <Link key={name} href={`#${homeCategoryId(name)}`}><span className={styles.categoryIcon}><Icon size={24} strokeWidth={1.7} /></span><span>{name}</span></Link>;
        })}
      </nav>

      <section className={styles.ingredientFilter} aria-label="성분별 카테고리 선택">
        <div className={styles.filterHeading}><h2>어떤 성분을 찾으세요?</h2><Link href="/ingredients">성분 사전 <ChevronRight size={15} /></Link></div>
        <IngredientPicker ingredients={options.ingredients} filters={homeFilters} basePath="/" preferredIds={preferredIds} />
        {unknownIngredient && <p role="status" className={styles.filterNote}>해당 성분을 찾지 못해 전체 성분의 제품을 보여드려요.</p>}
        {selected && <p role="status" className={styles.filterNote}><strong>{selected.name}</strong> 포함 제품 {overview.totalElements}개 · 아래 모든 카테고리에 적용 중</p>}
      </section>

      <div className={styles.shelves}>
        {shelves.map(({ category, result }) => {
          const href = rankingHref("/ranking", { ingredient, category });
          const title = selected ? `${selected.name} ${category}` : category;
          return <section key={category} id={homeCategoryId(category)} aria-label={`${title} 제품`} className={styles.shelf}>
            <div className={styles.shelfHeading}>
              <div>{selected && <p>성분으로 찾는 제품 랭킹</p>}<h2>{title}<span>{result.totalElements}</span></h2></div>
              <Link href={href} aria-label={`${title} 전체보기`}>전체보기 <ChevronRight size={17} /></Link>
            </div>
            <div className={styles.products}>
              {result.content.map((item) => <HomeProductCard key={item.product.id} item={item} ingredientName={selected?.name ?? null}
                favorited={favoriteIds.has(item.product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={returnTo} />)}
            </div>
            <Link href={href} className={styles.seeAll}>{title} 전체보기 <ChevronRight size={16} /></Link>
          </section>;
        })}
        {shelves.length === 0 && <section className={styles.empty}>
          <FlaskConical size={30} /><h2>{selected ? `${selected.name} 제품을 준비하고 있어요` : "등록된 제품을 준비하고 있어요"}</h2>
          <p>성분이 연결된 공개 제품이 등록되면 카테고리별로 보여드릴게요.</p><Link href="/" className="line-btn">전체 성분으로 둘러보기</Link>
        </section>}
      </div>

      <section className={styles.bottomGuide} aria-label="화력 추천과 집계 원칙">
        <Link href="/promotions" className={styles.promotionGuide}><Megaphone size={24} /><div><h2>새로운 브랜드를 만나는 화력 추천 <span>광고</span></h2><p>관리자 추천 제품은 별도의 광고 탭에서 확인하세요.</p></div><ChevronRight size={20} /></Link>
        <p className={styles.scoreNote}>성분 랭킹은 성분 비교 지표이며 실제 함량이나 개인별 효과를 뜻하지 않아요. 사용자 리뷰점수와 광고 추천점수는 별도로 집계합니다. <Link href="/principles">집계 기준 보기</Link></p>
      </section>
    </div>
  );
}

function HomeProductCard({ item, ingredientName, favorited, isAuthenticated, returnTo }: {
  item: IngredientRankingItem; ingredientName: string | null; favorited: boolean; isAuthenticated: boolean; returnTo: string;
}) {
  const { product } = item;
  return <article className={styles.product}>
    <Link href={`/products/${product.id}`} className={styles.productLink}>
      <div className={styles.productImage}>
        <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} variant="catalog" />
        {ingredientName && item.rank !== null && <span className={styles.rank} aria-label={`${item.rank}위`}>{item.rank}</span>}
      </div>
      <div className={styles.productText}>
        <p className={styles.brand}>{product.brand}</p><h3>{product.name}</h3>
        <p className={styles.price}>{product.price}</p>
        {ingredientName && item.firepowerScore !== null && <p className={styles.firepower}><strong>{item.firepowerScore}</strong> 성분 화력 / 100</p>}
        <p className={styles.review}>{item.reviewScore === null ? "첫 리뷰를 기다려요" : <>리뷰 <strong>{item.reviewScore.toFixed(1)}</strong> / 100 <span>({item.reviewCount})</span></>}</p>
      </div>
    </Link>
    <div className={styles.favorite}><FavoriteButton productId={product.id} initialFavorited={favorited} isAuthenticated={isAuthenticated} returnTo={returnTo} small /></div>
  </article>;
}
