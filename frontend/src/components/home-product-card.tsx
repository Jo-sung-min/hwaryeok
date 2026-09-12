import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { FavoriteButton, ProductVisual } from "@/components/product-ui";
import { ReviewPetalRating } from "@/components/review-petal-rating";
import type { Product } from "@/lib/types";
import styles from "./home-catalog.module.css";

export function HomeProductCard({ product, rank, scoreLabel, favorited = false, isAuthenticated = false, returnTo = "/", growth, review }: {
  product: Product; rank?: number; scoreLabel?: string; favorited?: boolean; isAuthenticated?: boolean; returnTo?: string;
  growth?: { recentReviewCount: number; previousReviewCount: number; reviewGrowth: number };
  review?: { score: number | null; count: number };
}) {
  return <article className={styles.product}>
    <Link href={`/products/${encodeURIComponent(product.id)}`} className={styles.productLink}>
      <div className={styles.productImage}>
        <div className={styles.productVisual}>
          <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} variant="catalog" />
        </div>
        {rank !== undefined && <span className={styles.rank} aria-label={`${rank}위`}>{rank}</span>}
        <div className={styles.imageInfo}>
          <p className={styles.brand}>{product.brand} · {product.category}</p>
          <h3>{product.name}</h3>
        </div>
      </div>
      <div className={styles.productText}>
        {scoreLabel && <p className={styles.firepower}><span>{scoreLabel}</span><strong>{product.score}<small> / 100</small></strong></p>}
        <p className={styles.price}>{product.price}</p>
        {growth && <><p className={styles.growth}><TrendingUp size={14} /><strong>+{growth.reviewGrowth}</strong> 리뷰 증가</p><p className={styles.review}>이전 7일 {growth.previousReviewCount} → 최근 7일 {growth.recentReviewCount}개</p></>}
        {review && <p className={styles.review}>{review.score === null ? `리뷰 ${review.count}개 · 점수 집계 중` : <><ReviewPetalRating score={review.score} label={growth ? "최근 7일 리뷰점수" : "리뷰점수"} compact /><span>{growth ? "최근 7일 리뷰" : "리뷰"} <strong>{review.score.toFixed(1)}</strong> / 100 <span>({review.count})</span></span></>}</p>}
        {scoreLabel && <div className={styles.matchReason}><span>추천 이유</span><p>{product.matchReasons?.[0] || "상세 페이지에서 성분 자료와 점수 기준을 확인해 주세요."}</p>{(product.confidenceLevel === "LOW" || product.confidenceLevel === "LEGACY") && <small>성분 근거가 충분하지 않아 추가 확인이 필요해요.</small>}</div>}
      </div>
    </Link>
    <div className={styles.favorite}><FavoriteButton productId={product.id} initialFavorited={favorited} isAuthenticated={isAuthenticated} returnTo={returnTo} small /></div>
  </article>;
}
