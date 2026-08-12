export default function CompareLoading() {
  return <div className="min-h-screen pb-24" aria-busy="true" aria-label="제품 비교를 불러오는 중"><section className="h-56 animate-pulse bg-[#f0e5d7]"/><div className="container-page py-12"><div className="grid min-h-[620px] grid-cols-[78px_1fr_1fr] overflow-hidden rounded-[30px] border border-[#74513f1a] sm:grid-cols-[170px_1fr_1fr]">{Array.from({ length: 15 }, (_, index) => <div key={index} className={`animate-pulse border-b border-r border-[#74513f18] ${index % 3 === 0 ? "bg-[#e7dbcd]" : "bg-[#f7efe5]"}`} />)}</div></div></div>;
}
