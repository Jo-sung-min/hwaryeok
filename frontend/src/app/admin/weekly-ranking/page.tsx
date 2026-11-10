import { notFound, redirect } from "next/navigation";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import { AdminHeader } from "@/app/admin/admin-ui";
import { getAdminProducts, getAdminWeeklyRanking } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import { WeeklyRankingForm } from "./weekly-ranking-form";

export default async function AdminWeeklyRankingPage() {
  const user = await requireSession("/admin/weekly-ranking");
  if (user.role !== "ADMIN") redirect("/");
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();

  const [allProducts, ranking] = await Promise.all([
    getAdminProducts(accessToken),
    getAdminWeeklyRanking(accessToken),
  ]).catch((error) => recoverAdminPageSession(error, "/admin/weekly-ranking"));
  const products = allProducts.filter((product) => product.publicationStatus === "PUBLISHED" && product.imageUrl);
  const formKey = `${ranking.weekStart}-${ranking.mode}-${ranking.content.map((item) => item.product.id).join("-")}`;

  return <div>
    <AdminHeader title="주간 랭킹" meta="매주 월요일 0시 자동 갱신" />

    <main className="container-page">
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
