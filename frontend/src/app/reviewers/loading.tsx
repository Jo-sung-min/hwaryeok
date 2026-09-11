import { RankingTabs } from "@/components/ranking-tabs";

export default function Loading() {
  return <div className="container-page pb-10 pt-4"><RankingTabs /><div className="py-10" role="status"><p className="text-sm text-[#957883]">리뷰어의 화력을 모으고 있어요…</p><div className="mt-6 grid animate-pulse gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 rounded-3xl bg-[#fff2f7]" />)}</div></div></div>;
}
