export default function ProductDetailLoading() {
  return <div className="container-page py-10" aria-busy="true" aria-label="제품 상세 정보를 불러오는 중">
    <div className="grid min-h-[590px] overflow-hidden rounded-[32px] border border-[#74513f1a] lg:grid-cols-2">
      <div className="animate-pulse bg-[#dfd4c8]" />
      <div className="space-y-5 bg-[#fffaf2a8] p-8 md:p-14"><div className="h-3 w-28 animate-pulse rounded bg-[#d9cbbd]"/><div className="h-10 w-4/5 animate-pulse rounded-xl bg-[#d9cbbd]"/><div className="h-4 w-24 animate-pulse rounded bg-[#e3d8cb]"/><div className="my-8 h-px bg-[#75564518]"/><div className="h-28 animate-pulse rounded-2xl bg-[#eadfd2]"/><div className="h-20 animate-pulse rounded-2xl bg-[#eadfd2]"/></div>
    </div>
  </div>;
}
