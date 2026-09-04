import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, ExternalLink, Megaphone, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import { getPromotions } from "@/lib/api";

export const metadata: Metadata = {
  title: "화력 추천",
  description: "화력 관리자가 평가한 신생 화장품 광고와 추천 이유를 투명하게 확인하세요.",
  alternates: { canonical: "/promotions" },
};

export default async function PromotionsPage() {
  const promotions = await getPromotions(20);

  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#ebcfd7] bg-[#fff2f5] py-11 md:py-20">
      <div className="container-page grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#c94f70] px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-white"><Megaphone size={13} /> SPONSORED · 광고</span><h1 className="mt-5 text-balance font-myeongjo text-4xl font-semibold leading-tight md:text-5xl">아직 낯설지만,<br />먼저 볼 이유가 있는 화장품</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-[#76636a]">화력이 검토한 신생 브랜드와 광고 제품을 모았습니다. 이 탭의 추천점수는 사용자 리뷰점수가 아니라 관리자가 성분 정보와 제품 차별점을 살펴 매긴 광고 전용 점수입니다.</p></div>
        <div className="rounded-[24px] border border-[#e3c2cb] bg-white p-5 text-xs leading-6 text-[#755f67] shadow-[0_12px_34px_rgba(137,63,84,.07)]"><p className="flex items-center gap-2 font-bold text-[#a24762]"><ShieldCheck size={16} /> 점수 분리 원칙</p><p className="mt-2">일반 리뷰점수는 사용자 경험으로만 계산<br />광고 추천점수는 이 탭에서만 별도 표시</p></div>
      </div>
    </section>

    <main className="container-page py-10 md:py-16">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">HWA:RYEOK PICKS</p><h2 className="mt-2 font-myeongjo text-3xl font-semibold">신생 브랜드 우선 추천</h2></div><p className="text-xs leading-5 text-[#806d74]">신생 브랜드를 먼저, 같은 조건에서는 관리자 추천점수가 높은 순서예요.</p></div>

      {promotions.length > 0 ? <div className="grid gap-6 lg:grid-cols-2">{promotions.map((promotion, index) => <article key={promotion.id} className="overflow-hidden rounded-[28px] border border-[#e4c6ce] bg-white shadow-[0_14px_38px_rgba(121,62,78,.07)]"><div className="grid sm:grid-cols-[220px_1fr]"><Link href={`/products/${promotion.product.id}`} className="relative block border-b border-[#f2dfe5] sm:border-b-0 sm:border-r"><ProductVisual tone={promotion.product.tone} imageUrl={promotion.product.imageUrl} alt={`${promotion.product.brand} ${promotion.product.name}`} variant="panel" /><div className="absolute left-4 top-4 flex items-center gap-2"><span className="rounded-full bg-[#c94f70] px-2.5 py-1 text-[10px] font-bold text-white">광고</span>{promotion.emergingBrand && <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7df] px-2.5 py-1 text-[10px] font-bold text-[#80601f]"><BadgeCheck size={11} /> 신생 브랜드</span>}</div><span className="absolute bottom-4 left-4 rounded-full border border-[#eccfd7] bg-white px-3 py-1.5 text-[10px] font-bold text-[#9c4a61]">추천 순서 {index + 1}</span></Link><div className="flex flex-col p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9b7580]">{promotion.product.brand} · {promotion.product.category}</p><Link href={`/products/${promotion.product.id}`} className="mt-1 font-myeongjo text-xl font-semibold leading-snug hover:text-[#b54868]">{promotion.product.name}</Link><p className="mt-4 font-semibold leading-6 text-[#684f58]">{promotion.headline}</p><p className="mt-2 line-clamp-3 text-xs leading-6 text-[#806f75]">{promotion.recommendationReason}</p><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-[#fff0f4] p-3"><strong className="font-myeongjo text-3xl text-[#b34766]">{promotion.recommendationScore}</strong><p className="mt-1 text-[9px] font-bold text-[#9a6d7a]">관리자 추천점수 · 광고</p></div><div className="rounded-2xl border border-[#edd8de] bg-white p-3"><strong className="font-myeongjo text-2xl text-[#63555a]">{promotion.userReviewScore === null ? "—" : Number(promotion.userReviewScore).toFixed(1)}</strong><p className="mt-1 text-[9px] font-bold text-[#8e7b81]">사용자 리뷰점수 · {promotion.userReviewCount}개</p></div></div><div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-5"><a href={promotion.product.coupangPartnersUrl ?? promotion.destinationUrl} target="_blank" rel="noopener noreferrer sponsored nofollow" className="ink-btn min-w-0">{promotion.product.coupangPartnersUrl ? "쿠팡 파트너스" : "공식판매처"} <ExternalLink size={14} /></a><Link href={`/products/${promotion.product.id}#reviews`} className="line-btn !px-3" aria-label={`${promotion.product.name} 사용자 리뷰 보기`}><MessageCircle size={16} /></Link></div></div></div></article>)}</div> : <div className="rounded-[28px] border border-dashed border-[#dab8c1] bg-[#fff8fa] px-6 py-20 text-center"><Sparkles className="mx-auto text-[#bd5a75]" size={28} /><h2 className="mt-5 font-myeongjo text-2xl font-semibold">검토 중인 화력 추천이 있어요</h2><p className="mt-3 text-sm leading-7 text-[#806e74]">공식판매처와 추천 근거를 확인한 광고만 이곳에 공개합니다.</p><Link href="/products" className="line-btn mt-6">일반 화장품 둘러보기 <ArrowRight size={15} /></Link></div>}

      {promotions.some((promotion) => promotion.product.coupangPartnersUrl) && <aside className="mt-6 rounded-2xl border border-[#e8cbd3] bg-white px-5 py-4 text-[11px] leading-6 text-[#775f67]">이 페이지에는 쿠팡 파트너스 링크가 포함되어 있으며, 링크를 통한 구매가 발생하면 화력이 일정액의 수수료를 제공받을 수 있습니다.</aside>}

      <aside className="mt-10 rounded-[24px] border border-[#e8cbd3] bg-[#fff5f7] p-5 text-xs leading-6 text-[#775f67] sm:p-6"><strong className="text-[#9f4861]">광고 운영 원칙</strong><span className="ml-2">광고 계약 여부는 일반 랭킹과 사용자 리뷰점수에 영향을 주지 않습니다. 화력 추천 광고는 관리자가 입력한 별도 점수와 추천 이유로만 이 탭 안에서 정렬됩니다.</span></aside>
    </main>
  </div>;
}
