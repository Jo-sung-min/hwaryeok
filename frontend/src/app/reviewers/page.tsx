import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Droplets, Flame, MessageCircle, UsersRound } from "lucide-react";
import { RankingFilterSheet } from "@/components/ranking-filter-sheet";
import { RankingTabs } from "@/components/ranking-tabs";
import { ReviewerFirepower } from "@/components/reviewer-firepower";
import { getReviewerRanking } from "@/lib/api";

export const metadata: Metadata = {
  title: "리뷰어 랭킹 · 리뷰 화력",
  description: "사용자들이 평가한 리뷰 화력순으로 리뷰어를 만나보세요. 피부타입과 실제 작성 리뷰를 함께 확인할 수 있어요.",
  alternates: { canonical: "/reviewers" },
};

const skinTypes = ["건성", "지성", "복합성", "수부지", "중성", "민감"];
type Search = { skinType?: string | string[]; page?: string | string[] };

export default async function ReviewersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const requestedSkin = first(search.skinType);
  const skinType = skinTypes.includes(requestedSkin) ? requestedSkin : "";
  const rawPage = Number(first(search.page));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 && rawPage <= 100000 ? rawPage : 0;
  const data = await getReviewerRanking(skinType, page, 20);

  return <div className="container-page pb-24 pt-4 sm:pt-7">
    <RankingTabs />
    <section className="py-8 sm:py-12">
      <p className="eyebrow">PEOPLE WHO HELP YOUR SKIN</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-5">
        <div><h1 className="font-myeongjo text-3xl font-semibold sm:text-4xl">좋은 리뷰에는, 화력이 쌓여요</h1><p className="mt-4 text-sm leading-7 text-[#857079]">다른 사용자에게 도움이 된 리뷰어를 만나보세요.<br className="sm:hidden" /> 나와 같은 피부의 사용 경험부터 살펴볼 수 있어요.</p></div>
        <span className="hidden h-16 w-16 place-items-center rounded-2xl bg-[#fff0f5] text-[#cd5f80] sm:grid" aria-hidden="true"><Flame size={30} /></span>
      </div>
      <details className="mt-6 rounded-2xl border border-[#f0dbe3] bg-[#fff8fa] px-5 py-4 text-xs leading-6 text-[#806b74]">
        <summary className="cursor-pointer font-bold text-[#a24966]">리뷰 화력은 어떻게 정해지나요?</summary>
        <p className="mt-3">제품 자체에 매긴 점수와 별개로, 다른 사용자들이 리뷰의 도움 정도를 1~5점으로 평가해요. 같은 평가자가 여러 리뷰에 남긴 점수는 먼저 평균을 내어 한 사람의 영향이 지나치게 커지지 않도록 해요.</p>
        <p className="mt-2">평가자별 평균을 100점으로 환산한 뒤, 서로 다른 평가자 수에 따라 기준값 50과 함께 보정해요. 화력은 온도 모양으로 표현한 활동 지표이며 제품 효능이나 신원을 보증하지 않아요. 평가가 없으면 ‘집계 전’이며 순위는 부여하지 않아요.</p>
        <p className="mt-2 break-words text-[11px]">산식: 50 + (평가자별 평균의 평균 × 20 − 50) × 평가자 수 ÷ (평가자 수 + 5). 비공개 제품과 비활성 사용자의 활동은 집계에서 제외해요.</p>
      </details>
    </section>

    <section aria-labelledby="reviewers-heading">
      <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="reviewers-heading" className="text-lg font-bold">리뷰어 랭킹 <span className="ml-1 text-sm font-medium text-[#ae8594]">{data.totalElements.toLocaleString("ko-KR")}명</span></h2><span className="text-xs text-[#8e7781]">리뷰 화력순 · 공개 리뷰 기준</span></div>
      <RankingFilterSheet variant="reviewers" basePath="/reviewers" resultCount={data.totalElements} axes={[
        { id: "skinType", param: "skinType", label: "피부 타입", shortLabel: "피부타입", value: skinType, options: [{ value: "", label: "피부 전체" }, ...skinTypes.map((skin) => ({ value: skin, label: `${skin === "민감" ? "민감성" : skin} 피부` }))] },
      ]} />

      {data.content.length === 0 ? <div className="rounded-3xl border border-dashed border-[#e6bdcc] bg-[#fffafb] px-5 py-16 text-center">
        <UsersRound className="mx-auto text-[#c76b8a]" size={30} /><h3 className="mt-4 text-xl font-semibold">{page > 0 ? "이 페이지에는 리뷰어가 없어요" : "첫 리뷰어를 기다리고 있어요"}</h3>
        <p className="mt-3 text-sm leading-7 text-[#8a727d]">{skinType ? "이 피부타입으로 등록한 사용자의 공개 리뷰가 아직 없어요." : "제품에 솔직한 리뷰를 남기면 리뷰어 목록에 표시돼요."}<br />다른 사용자의 평가가 모이면 리뷰 화력과 순위가 생겨요.</p>
        <Link href={skinType || page > 0 ? "/reviewers" : "/products"} className="line-btn mt-6">{skinType || page > 0 ? "전체 리뷰어 보기" : "리뷰할 제품 찾기"}<ArrowRight size={15} /></Link>
      </div> : <ol className="divide-y divide-[#f1e2e8] overflow-hidden rounded-3xl border border-[#eedbe3] bg-white">
        {data.content.map((reviewer) => <li key={reviewer.userId}>
          <Link href={`/reviewers/${encodeURIComponent(reviewer.userId)}`} className="grid grid-cols-[28px_44px_1fr] items-center gap-x-3 gap-y-3 px-4 py-5 transition hover:bg-[#fff9fb] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#c86483] sm:grid-cols-[40px_60px_1fr_auto] sm:gap-x-5 sm:px-7 sm:py-6">
            <span className={`text-center text-lg font-bold tabular-nums ${reviewer.rank !== null && reviewer.rank <= 3 ? "text-[#be4e72]" : "text-[#a58b95]"}`} aria-label={reviewer.rank === null ? "순위 집계 전" : `${reviewer.rank}위`}>{reviewer.rank ?? "—"}</span>
            <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full border border-[#efcedb] bg-[#fff0f5] text-lg font-semibold text-[#b45876] sm:h-15 sm:w-15 sm:text-2xl">{Array.from(reviewer.nickname)[0]}</span>
            <div className="min-w-0"><h3 className="break-words text-base font-bold sm:text-lg">{reviewer.nickname}</h3><p className="mt-1.5 flex items-center gap-1 text-xs text-[#9b6c80]"><Droplets size={12} />{reviewer.skinType ? `${reviewer.skinType === "민감" ? "민감성" : reviewer.skinType} 피부` : "피부타입 미등록"}</p><p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#94818a]"><span>작성 리뷰 {reviewer.reviewCount}개</span><span>평가자 {reviewer.uniqueRaterCount}명 · 받은 평가 {reviewer.receivedRatingCount}개</span></p></div>
            <div className="col-start-3 flex flex-wrap items-center justify-between gap-3 sm:col-start-auto sm:flex-col sm:items-end"><ReviewerFirepower score={reviewer.reviewFirepower} compact /><span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a25370]">작성 리뷰 보기 <ArrowRight size={13} /></span></div>
          </Link>
        </li>)}
      </ol>}
      {data.totalPages > 1 && <nav aria-label="리뷰어 랭킹 페이지" className="mt-8 flex items-center justify-center gap-4">{page > 0 && <Link href={rankingHref(skinType, page - 1)} className="line-btn">이전</Link>}<span className="text-xs text-[#917883]">{page + 1} / {data.totalPages}</span>{data.hasNext && <Link href={rankingHref(skinType, page + 1)} className="line-btn">다음</Link>}</nav>}
      <p className="mt-6 flex items-center justify-center gap-2 text-xs leading-6 text-[#9b858e]"><MessageCircle size={14} className="shrink-0" />프로필을 누르면 피부타입과 그 사용자가 남긴 리뷰를 볼 수 있어요.</p>
    </section>
  </div>;
}

function first(value: string | string[] | undefined) { return (Array.isArray(value) ? value[0] : value) ?? ""; }
function rankingHref(skinType: string, page: number) {
  const search = new URLSearchParams();
  if (skinType) search.set("skinType", skinType);
  if (page > 0) search.set("page", String(page));
  return search.size ? `/reviewers?${search}` : "/reviewers";
}
