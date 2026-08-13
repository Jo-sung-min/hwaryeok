export default function IngredientDetailLoading() {
  return <div className="container-page min-h-screen py-10" aria-busy="true" aria-label="성분 정보를 불러오는 중"><div className="h-[420px] animate-pulse rounded-[34px] bg-[#e9ddd0]" /><div className="mt-16 grid gap-5 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-[28px] bg-[#e3ddcf]" /><div className="h-80 animate-pulse rounded-[28px] bg-[#ead9d0]" /></div></div>;
}
