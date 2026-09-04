export default function PromotionsLoading() {
  return <div className="min-h-screen pb-24" aria-busy="true" aria-label="화력 추천을 불러오는 중"><section className="h-80 animate-pulse border-b border-[#ebcfd7] bg-[#fff2f5]" /><div className="container-page grid gap-6 py-12 lg:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-[28px] border border-[#e4c6ce] bg-[#fff8fa]" />)}</div></div>;
}
