export default function ReviewerLoading() {
  return <div className="min-h-screen pb-24" aria-busy="true" aria-label="사용자 리뷰를 불러오는 중"><section className="h-64 animate-pulse border-b border-[#efd8df] bg-[#fff4f7]" /><div className="container-page space-y-5 py-12">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-[26px] border border-[#efd8df] bg-[#fff8fa]" />)}</div></div>;
}
