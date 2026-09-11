import styles from "./product-detail.module.css";

export default function ProductDetailLoading() {
  return <div className="container-page py-3" aria-busy="true" aria-label="제품 상세 정보를 불러오는 중">
    <div className="mb-3 h-10 w-24 animate-pulse rounded-lg bg-[#f1edf0]" />
    <div className={styles.hero}>
      <div className={styles.heroVisual}><div className="absolute inset-0 animate-pulse bg-[#f5f2f4]" /></div>
      <div className={`${styles.heroBody} space-y-4`}><div className="h-3 w-28 animate-pulse rounded bg-[#eee8ec]"/><div className="h-8 w-4/5 animate-pulse rounded-lg bg-[#eee8ec]"/><div className="h-4 w-24 animate-pulse rounded bg-[#f1edf0]"/><div className="h-24 animate-pulse rounded-xl bg-[#fff3f7]"/><div className="h-12 animate-pulse rounded-xl bg-[#ead4dc]"/></div>
    </div>
  </div>;
}
