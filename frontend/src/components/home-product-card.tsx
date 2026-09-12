import Link from "next/link";
import { Star, TrendingUp } from "lucide-react";
import { FavoriteButton, ProductVisual } from "@/components/product-ui";
import { RankingPetalIcon } from "@/components/ranking-petal-icon";
import { ReviewPetalRating } from "@/components/review-petal-rating";
import type { Product } from "@/lib/types";
import styles from "./home-catalog.module.css";

export function HomeProductCard({ product, rank, scoreLabel, favorited = false, isAuthenticated = false, returnTo = "/", growth, review }: {
  product: Product; rank?: number; scoreLabel?: string; favorited?: boolean; isAuthenticated?: boolean; returnTo?: string;
  growth?: { recentReviewCount: number; previousReviewCount: number; reviewGrowth: number };
  review?: { score: number | null; count: number };
}) {
  const firepowerLabel = scoreLabel ?? "성분 화력";
  const reviewMetric = review ?? { score: product.reviewScore ?? null, count: product.reviewCount ?? 0 };
  const safeReviewScore = typeof reviewMetric.score === "number" && Number.isFinite(reviewMetric.score)
    ? Math.max(0, Math.min(100, reviewMetric.score))
    : null;
  const reviewCount = Math.max(0, Math.trunc(reviewMetric.count));
  const reviewLabel = growth ? "최근 7일 리뷰" : "리뷰";

  return <article className={`group ${styles.product}`}>
    <Link href={`/products/${encodeURIComponent(product.id)}`} className={styles.productLink}>
      <div className={styles.productImage}>
        <div className={styles.productVisual}>
          <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt="" variant="catalog" />
        </div>
        {rank !== undefined && <span className={styles.rank} role="img" aria-label={`${rank}위`}><RankingPetalIcon rank={rank} /></span>}
        <div className={styles.imageInfo}>
          <p className={styles.brand}>{product.brand} · {product.category}</p>
          <h3>{product.name}</h3>
        </div>
      </div>
      <div className={styles.productText}>
        <p className={styles.firepower}>
          <span className={styles.firepowerCopy}><span>{firepowerLabel}</span><strong>{product.score}</strong><small> / 100</small></span>
          <span className={styles.firepowerPetals}><ReviewPetalRating score={product.score} label={firepowerLabel} compact /></span>
        </p>
        {growth && <><p className={styles.growth}><TrendingUp size={14} /><strong>+{growth.reviewGrowth}</strong> 리뷰 증가</p><p className={styles.review}>이전 7일 {growth.previousReviewCount} → 최근 7일 {growth.recentReviewCount}개</p></>}
        <p className={styles.review}>{safeReviewScore === null
          ? <span>{`리뷰 ${reviewCount.toLocaleString("ko-KR")}개 · 점수 집계 중`}</span>
          : <><Star className={styles.reviewStar} size={14} fill="currentColor" aria-hidden="true" /><span>{reviewLabel} <strong>{(safeReviewScore / 20).toFixed(1)}</strong> <span>({reviewCount.toLocaleString("ko-KR")})</span></span></>}
        </p>
        {scoreLabel && <div className={styles.matchReason}><span>추천 이유</span><p>{product.matchReasons?.[0] || "상세 페이지에서 성분 자료와 점수 기준을 확인해 주세요."}</p>{(product.confidenceLevel === "LOW" || product.confidenceLevel === "LEGACY") && <small>성분 근거가 충분하지 않아 추가 확인이 필요해요.</small>}</div>}
      </div>
    </Link>
    <div className={styles.favorite}><FavoriteButton productId={product.id} initialFavorited={favorited} isAuthenticated={isAuthenticated} returnTo={returnTo} small /></div>
  </article>;
}
