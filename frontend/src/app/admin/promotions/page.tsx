import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarDays, Megaphone, ShieldCheck } from "lucide-react";
import { getAdminProducts, getAdminPromotions } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import { PromotionDeleteForm } from "./promotion-delete-form";
import { PromotionForm } from "./promotion-form";

export default async function AdminPromotionsPage() {
  const user = await requireSession("/admin/promotions");
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();
  const [products, promotions] = await Promise.all([
    getAdminProducts(accessToken),
    getAdminPromotions(accessToken),
  ]).catch((error) => recoverAdminPageSession(error, "/admin/promotions"));
  const promotedProductIds = new Set(promotions.map((item) => item.product.id));
  const availableProducts = products.filter((product) => !promotedProductIds.has(product.id));

  return <div className="min-h-screen pb-28">
    <section className="border-b border-[#e9cdd5] bg-[#fff2f5] py-9 md:py-14"><div className="container-page"><Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#76646b]"><ArrowLeft size={16} /> 관리자 센터</Link><div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow mb-3">SPONSORED RECOMMENDATIONS</p><h1 className="font-myeongjo text-3xl font-semibold md:text-4xl">화력 추천 광고 관리</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#7b6970]">광고비는 추천점수를 사는 값이 아닙니다. 관리자가 제품 근거를 검토해 점수를 매기고, 광고 탭 안에서 신생 브랜드와 높은 점수를 우선 노출합니다.</p></div><span className="inline-flex self-start items-center gap-2 rounded-full border border-[#c7819540] bg-white px-4 py-2 text-xs font-semibold text-[#9b4a5f]"><ShieldCheck size={15} /> 관리자 전용</span></div></div></section>

    <main className="container-page py-8 md:py-12">
      <section className="mb-7 grid gap-3 sm:grid-cols-5" aria-label="관리자 추천점수 가이드">{[["성분 구성", "30점"], ["제품 차별성", "25점"], ["근거 완성도", "20점"], ["사용자 적합", "15점"], ["판매처 신뢰", "10점"]].map(([label, score]) => <div key={label} className="rounded-2xl border border-[#e6ccd3] bg-[#fff8fa] p-4"><strong className="font-myeongjo text-xl text-[#ae4866]">{score}</strong><p className="mt-1 text-[10px] font-semibold text-[#806d74]">{label}</p></div>)}</section>
      <section className="rounded-[28px] border border-[#e4c5cd] bg-white p-5 shadow-[0_14px_38px_rgba(139,67,87,.07)] sm:p-7 md:p-9"><div className="mb-7 flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f8e1e7] text-[#a44f65]"><Megaphone size={20} /></span><div><h2 className="font-myeongjo text-2xl font-semibold">새 광고 등록</h2><p className="mt-1 text-xs leading-5 text-[#88757c]">기본값은 초안입니다. 공식 판매처와 노출 기간을 확인한 뒤 활성화하세요.</p></div></div>{availableProducts.length > 0 ? <PromotionForm products={availableProducts} /> : <p className="rounded-2xl bg-[#fff5f7] p-5 text-sm text-[#806a71]">모든 등록 제품에 광고가 연결되어 있어요. 아래 기존 광고를 수정해 주세요.</p>}</section>

      <section className="mt-12"><div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">CAMPAIGNS</p><h2 className="font-myeongjo text-2xl font-semibold">등록 광고 {promotions.length}개</h2></div><p className="text-xs text-[#89747c]">현재 사용자에게 노출 중 {promotions.filter((item) => item.currentlyVisible).length}개</p></div><div className="space-y-5">{promotions.map((promotion) => <article key={promotion.id} className="overflow-hidden rounded-[26px] border border-[#e1bec8] bg-white"><header className="flex flex-col gap-4 border-b border-[#efdae0] bg-[#fff7f9] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#c94f70] px-2.5 py-1 text-[10px] font-bold text-white">광고</span>{promotion.emergingBrand && <span className="inline-flex items-center gap-1 rounded-full bg-[#f7e8bd] px-2.5 py-1 text-[10px] font-bold text-[#815f1c]"><BadgeCheck size={11} /> 신생 브랜드 우선</span>}<span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${promotion.currentlyVisible ? "bg-[#e5f1e8] text-[#4e7258]" : "bg-[#eee9eb] text-[#75676c]"}`}>{promotion.currentlyVisible ? "노출 중" : promotion.status === "ACTIVE" ? "기간 밖·제품 비공개" : promotion.status === "PAUSED" ? "일시중지" : "초안"}</span></div><h3 className="mt-2 font-myeongjo text-xl font-semibold">{promotion.product.brand} · {promotion.product.name}</h3></div><div className="flex items-center gap-4"><p className="flex items-center gap-1.5 text-xs text-[#806d74]"><CalendarDays size={14} /> {promotion.startsOn ?? "즉시"} ~ {promotion.endsOn ?? "계속"}</p><div className="text-right"><strong className="font-myeongjo text-3xl text-[#b34766]">{promotion.recommendationScore}</strong><p className="text-[9px] text-[#8c747c]">관리자 추천점수</p></div></div></header><div className="p-5 sm:p-7"><PromotionForm products={[promotion.product]} promotion={promotion} /><PromotionDeleteForm promotionId={promotion.id} /></div></article>)}{promotions.length === 0 && <div className="rounded-[26px] border border-dashed border-[#d8b6bf] py-14 text-center text-sm text-[#826f75]">아직 등록된 광고가 없어요.</div>}</div></section>
    </main>
  </div>;
}
