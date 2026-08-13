export default function IngredientsLoading() {
  return (
    <div className="min-h-screen pb-24" aria-busy="true" aria-label="성분 사전을 불러오는 중">
      <div className="h-80 animate-pulse bg-[#eee2d4]" />
      <div className="container-page py-10">
        <div className="mb-8 h-16 animate-pulse rounded-2xl bg-[#e5d8c9]" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="paper-card h-56 animate-pulse rounded-[24px]" />)}
        </div>
      </div>
    </div>
  );
}
