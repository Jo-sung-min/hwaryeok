import { RankingTabs } from "@/components/ranking-tabs";

export default function RankingLoading() {
  return <><div className="container-page pt-4"><RankingTabs /></div><div className="container-page py-8" role="status" aria-label="랭킹 상품을 불러오는 중"><div className="mb-6 h-9 w-64 rounded-lg bg-[#fff0f5]" /><div className="mb-6 h-24 rounded-2xl bg-[#fff7fa]" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] rounded-2xl border border-[#f0dfe6] bg-[#fffafb]" />)}</div><span className="sr-only">랭킹 상품을 불러오는 중이에요.</span></div></>;
}
