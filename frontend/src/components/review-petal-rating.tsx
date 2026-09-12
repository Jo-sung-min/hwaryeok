import styles from "./review-petal-rating.module.css";

type ReviewPetalRatingProps = {
  score: number | null | undefined;
  label?: string;
  compact?: boolean;
  className?: string;
};

const REVIEW_SCORE_MAX = 100;
const PETAL_SCORE_STEP = 20;
const MAX_PETALS = 5;

function safeReviewScore(score: number | null | undefined) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(REVIEW_SCORE_MAX, score));
}

export function getReviewPetalCount(score: number | null | undefined) {
  const safeScore = safeReviewScore(score);
  if (safeScore === null) return 0;
  return Math.max(0, Math.min(MAX_PETALS, Math.floor(safeScore / PETAL_SCORE_STEP)));
}

export function ReviewPetalRating({ score, label = "리뷰점수", compact = false, className }: ReviewPetalRatingProps) {
  const safeScore = safeReviewScore(score);
  const petalCount = getReviewPetalCount(safeScore);
  if (safeScore === null || petalCount === 0) return null;

  const scoreOnFivePointScale = safeScore / PETAL_SCORE_STEP;
  const classNames = [styles.rating, compact ? styles.compact : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <span
      className={classNames}
      role="img"
      aria-label={`${label} ${safeScore.toFixed(1)} / 100, 5점 환산 ${scoreOnFivePointScale.toFixed(1)}점, 꽃잎 ${petalCount}개`}
      data-petal-count={petalCount}
      data-score-on-five={scoreOnFivePointScale.toFixed(1)}
    >
      {Array.from({ length: petalCount }, (_, index) => <span key={index} className={styles.petal} aria-hidden="true" />)}
    </span>
  );
}
