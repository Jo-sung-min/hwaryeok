export default function ProductsLoading() {
  return (
    <div className="min-h-screen pb-24" aria-busy="true" aria-label="화장품을 불러오는 중">
      <section className="border-b border-[#74513f16] bg-[#f4ebdc86] py-14 md:py-20">
        <div className="container-page text-center">
          <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-[#c9b6a75c]" />
          <div className="mx-auto mt-5 h-12 w-80 max-w-full animate-pulse rounded-2xl bg-[#c9b6a750]" />
          <div className="mx-auto mt-8 h-14 max-w-2xl animate-pulse rounded-full bg-[#fffdf7]" />
        </div>
      </section>
      <div className="container-page py-10">
        <div className="mb-8 flex gap-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-10 w-20 animate-pulse rounded-full bg-[#d9cbbd66]" />)}</div>
        <div className="grid gap-5 sm:grid-cols-2 lg:ml-[248px] xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="paper-card overflow-hidden rounded-[26px]"><div className="h-56 animate-pulse bg-[#e5d9ca]" /><div className="space-y-3 p-5"><div className="h-3 w-16 animate-pulse rounded bg-[#d9cbbd]" /><div className="h-6 w-4/5 animate-pulse rounded bg-[#d9cbbd]" /><div className="h-8 w-2/5 animate-pulse rounded bg-[#dec5b9]" /></div></div>)}</div>
      </div>
    </div>
  );
}
