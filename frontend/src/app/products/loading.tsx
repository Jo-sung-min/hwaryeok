import styles from "./product-catalog-grid.module.css";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen pb-24" aria-busy="true" aria-label="화장품을 불러오는 중">
      <header className="border-b border-[#ece8eb] bg-white py-6">
        <div className="container-page">
          <div className="h-3 w-28 animate-pulse rounded bg-[#eee9ec]" />
          <div className="mt-3 h-8 w-40 animate-pulse rounded bg-[#eee9ec]" />
          <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-[#f3eff1]" />
          <div className="mt-5 h-14 animate-pulse rounded-full bg-[#f4f1f3]" />
        </div>
      </header>
      <div className="container-page pb-7">
        <div className="mb-5 mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-10 w-20 shrink-0 animate-pulse rounded-full bg-[#f0ecef]" />)}
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-[#eee9ec]" />
          <div className="h-11 w-40 animate-pulse rounded-full bg-[#f0ecef]" />
        </div>
        <div className={styles.gridFrame}>
          <ul className={styles.grid} aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => (
              <li key={index}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonCopy}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
