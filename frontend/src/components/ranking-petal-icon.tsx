import styles from "./ranking-petal-icon.module.css";

export type RankingPetalTone = "gold" | "silver" | "bronze" | "pink";

export function rankingPetalTone(rank: number): RankingPetalTone {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "pink";
}

export function RankingPetalIcon({ rank, className }: { rank: number; className?: string }) {
  const tone = rankingPetalTone(rank);
  return (
    <span
      className={[styles.petal, styles[tone], className].filter(Boolean).join(" ")}
      data-rank-petal={tone}
      aria-hidden="true"
    >
      <span className={styles.number}>{rank}</span>
    </span>
  );
}
