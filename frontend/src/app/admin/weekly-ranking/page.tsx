import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ListOrdered, ShieldCheck, Trophy } from "lucide-react";
import { getAdminProducts, getAdminWeeklyRanking } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import { WeeklyRankingForm } from "./weekly-ranking-form";

export default async function AdminWeeklyRankingPage() {
  const user = await requireSession("/admin/weekly-ranking");
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();

  const [allProducts, ranking] = await Promise.all([
    getAdminProducts(accessToken),
    getAdminWeeklyRanking(accessToken),
  ]).catch((error) => recoverAdminPageSession(error, "/admin/weekly-ranking"));
  const products = allProducts.filter((product) => product.publicationStatus === "PUBLISHED" && product.imageUrl);
  const formKey = `${ranking.weekStart}-${ranking.mode}-${ranking.content.map((item) => item.product.id).join("-")}`;

  return <div className="min-h-screen pb-28">
    <section className="border-b border-[#e9cdd5] bg-[#fff2f5] py-9">
      <div className="container-page">
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#76646b]"><ArrowLeft size={16} /> 관리자 센터</Link>
        <div className="mt-4 flex flex-col gap-5">
          <div><p className="eyebrow mb-3">WEEKLY FIREPOWER</p><h1 className="font-myeongjo text-3xl font-semibold">이주의 화력 랭킹 관리</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#7b6970]">매주 월요일 0시(한국시간)에 평가 개수, 평가점수 순으로 상위 10개를 새로 계산합니다. 이번 주 배너만 직접 교체하거나 순서를 바꿀 수 있어요.</p></div>
          <span className="inline-flex self-start items-center gap-2 rounded-full border border-[#c7819540] bg-white px-4 py-2 text-xs font-semibold text-[#9b4a5f]"><ShieldCheck size={15} /> 관리자 전용</span>
        </div>
      </div>
    </section>

    <main className="container-page py-8">
      <section className="mb-5 grid grid-cols-2 gap-3" aria-label="주간 랭킹 상태">
        <div className="rounded-2xl border border-[#e6ccd3] bg-white p-4"><CalendarDays size={18} className="text-[#a44f65]" /><p className="mt-2 text-[10px] font-semibold text-[#806d74]">이번 주 · 다음 갱신</p><strong className="mt-1 block text-sm">{ranking.weekStart} · {ranking.nextRefreshOn}</strong></div>
        <div className="rounded-2xl border border-[#e6ccd3] bg-white p-4"><ListOrdered size={18} className="text-[#a44f65]" /><p className="mt-2 text-[10px] font-semibold text-[#806d74]">현재 운영 방식</p><strong className="mt-1 block text-sm">{ranking.mode === "AUTO" ? "자동 상위 10개" : "관리자 수동 편집"}</strong></div>
      </section>

      <section className="rounded-[26px] border border-[#e4c5cd] bg-white p-5 shadow-[0_14px_38px_rgba(139,67,87,.07)]">
        <div className="mb-6 flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f8e1e7] text-[#a44f65]"><Trophy size={20} /></span><div><h2 className="font-myeongjo text-2xl font-semibold">배너 노출 순서</h2><p className="mt-1 text-xs leading-5 text-[#88757c]">빈 순위는 노출되지 않습니다. 화살표로 순서를 바꾸거나 다른 공개 상품을 선택하세요.</p></div></div>
        {products.length > 0 ? <WeeklyRankingForm key={formKey} products={products} ranking={ranking} /> : <p className="rounded-2xl bg-[#fff5f7] p-5 text-sm text-[#806a71]">이미지가 있는 공개 상품을 먼저 등록해 주세요.</p>}
      </section>

      <p className="mt-5 rounded-2xl bg-[#f8f4f5] p-4 text-[11px] leading-6 text-[#817077]">{ranking.scoreBasis}</p>
    </main>
  </div>;
}
