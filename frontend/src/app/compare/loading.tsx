export default function CompareLoading() {
  return <div className="min-h-screen pb-24" aria-busy="true" aria-label="제품 비교를 불러오는 중"><section className="h-56 animate-pulse bg-[#fff2f5]"/><div className="container-page py-12"><div className="grid min-h-[620px] grid-cols-[78px_1fr_1fr] overflow-hidden rounded-[30px] border border-[#efd9df] sm:grid-cols-[170px_1fr_1fr]">{Array.from({ length: 15 }, (_, index) => <div key={index} className={`animate-pulse border-b border-r border-[#efd9df] ${index % 3 === 0 ? "bg-[#f5dce3]" : "bg-[#fff7f9]"}`} />)}</div></div></div>;
}
