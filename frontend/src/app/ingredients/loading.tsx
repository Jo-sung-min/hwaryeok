import styles from "./ingredients.module.css";

export default function IngredientsLoading() {
  return <div className={styles.page} aria-busy="true" role="status">
    <div className={styles.header}>
      <div className={`container-page ${styles.headerInner}`}>
        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeleton} ${styles.skeletonIntro}`} />
        <div className={`${styles.skeleton} ${styles.skeletonSearch}`} />
      </div>
    </div>
    <div className={`container-page ${styles.content}`}>
      <div className={`${styles.skeleton} ${styles.skeletonFilter}`} />
      <div className={`${styles.skeleton} ${styles.skeletonCount}`} />
      <div className={styles.skeletonList}>{Array.from({ length: 7 }, (_, index) => <div key={index} className={`${styles.skeleton} ${styles.skeletonRow}`} />)}</div>
    </div>
    <span className="sr-only">성분 목록을 불러오는 중이에요.</span>
  </div>;
}
