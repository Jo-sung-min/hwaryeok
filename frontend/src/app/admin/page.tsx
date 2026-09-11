import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Boxes, CircleOff, DatabaseZap, FileWarning, Megaphone, MessageSquareText, PackagePlus, Send, ShieldCheck, Stethoscope, Trophy, UsersRound } from "lucide-react";
import { getAdminExpertApplications, getAdminProducts, getAdminPromotions, getAdminReviews } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";

export default async function AdminPage() {
  const user = await requireSession("/admin");
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();

  const [products, applications, promotions, reviews] = await Promise.all([
    getAdminProducts(accessToken),
    getAdminExpertApplications(accessToken),
    getAdminPromotions(accessToken),
    getAdminReviews(accessToken, { page: 0, size: 1 }),
  ]).catch((error) => recoverAdminPageSession(error, "/admin"));
  const pendingApplications = applications.filter((application) => application.status === "PENDING").length;
  const publishedProducts = products.filter((product) => product.publicationStatus === "PUBLISHED").length;
  const draftProducts = products.filter((product) => product.publicationStatus === "DRAFT").length;
  const hiddenProducts = products.filter((product) => product.publicationStatus === "HIDDEN").length;
  const missingSources = products.filter((product) => !product.sourceUrl || !product.sourceCheckedAt).length;

  return (
    <div className="min-h-screen pb-28">
      <section className="border-b border-[#dfa6b52b] bg-[#fff0f3] py-10 md:py-16">
        <div className="container-page">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#c7819540] bg-white/75 px-4 py-2 text-xs font-semibold text-[#9b4a5f]"><ShieldCheck size={15} className="shrink-0" /><span className="truncate">{user.email}</span></div>
          <p className="eyebrow mb-3 mt-6">ADMIN CENTER</p>
          <h1 className="font-myeongjo text-4xl font-semibold md:text-5xl">화력 관리자 센터</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#78666d]">공개 상태와 누락된 근거를 살피고, 확인을 마친 정보만 사용자에게 보여 주세요.</p>
        </div>
      </section>

      <main className="container-page py-9 md:py-14">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <AdminStat icon={Boxes} label="등록 상품" value={`${products.length}개`} />
          <AdminStat icon={Send} label="공개" value={`${publishedProducts}개`} />
          <AdminStat icon={PackagePlus} label="초안" value={`${draftProducts}개`} />
          <AdminStat icon={CircleOff} label="숨김" value={`${hiddenProducts}개`} />
          <AdminStat icon={FileWarning} label="출처 보완" value={`${missingSources}개`} />
          <AdminStat icon={Megaphone} label="노출 광고" value={`${promotions.filter((item) => item.currentlyVisible).length}개`} />
          <AdminStat icon={MessageSquareText} label="전체 리뷰" value={`${reviews.totalElements}개`} />
          <AdminStat icon={UsersRound} label="인증 검토 대기" value={`${pendingApplications}건`} />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/weekly-ranking" className="paper-card group rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(145,74,94,.12)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7e4e9] text-[#a44f65]"><Trophy size={22} /></span>
            <p className="eyebrow mb-2 mt-6">WEEKLY RANKING</p><h2 className="font-myeongjo text-2xl font-semibold">이주의 화력 랭킹</h2>
            <p className="mt-3 text-sm leading-7 text-[#7d6b72]">평가 개수와 평가점수로 자동 선정된 메인 배너의 상품과 노출 순서를 관리합니다.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#994c60]">주간 랭킹 관리 열기 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/admin/usage-videos" className="paper-card group rounded-[26px] p-6 transition hover:-translate-y-0.5 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f8e1e7] text-[#a44f65]"><ShieldCheck size={22} /></span>
            <p className="eyebrow mb-2 mt-6">CREATOR VIDEOS</p><h2 className="font-myeongjo text-2xl font-semibold">사용법 영상 검토</h2>
            <p className="mt-3 text-sm leading-7 text-[#7d6b72]">사용자가 등록한 유튜브 영상과 홍보 채널을 검토하고 승인·숨김·추천 노출 순서를 관리합니다.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#994c60]">영상 관리 열기 <ArrowRight size={16} /></span>
          </Link>
          <Link href="/admin/reviews" className="paper-card group rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(145,74,94,.12)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f8e1e7] text-[#a44f65]"><MessageSquareText size={22} /></span>
            <p className="eyebrow mb-2 mt-6">REVIEWS</p><h2 className="font-myeongjo text-2xl font-semibold">사용자 리뷰 관리</h2>
            <p className="mt-3 text-sm leading-7 text-[#7d6b72]">사용자 리뷰와 제품별 화면 예시를 검색하고, 운영 원칙에 어긋난 내용을 삭제합니다.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#994c60]">리뷰 관리 열기 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/admin/products" className="paper-card group rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(145,74,94,.12)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f8e1e7] text-[#a44f65]"><PackagePlus size={22} /></span>
            <p className="eyebrow mb-2 mt-6">PRODUCTS</p><h2 className="font-myeongjo text-2xl font-semibold">상품 등록·관리</h2>
            <p className="mt-3 text-sm leading-7 text-[#7d6b72]">제품의 초안·공개·숨김 상태, 정보 출처, 이미지와 연결 성분을 한곳에서 점검합니다.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#994c60]">상품 관리 열기 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/admin/promotions" className="paper-card group rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(145,74,94,.12)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7e4e9] text-[#a44f65]"><Megaphone size={22} /></span>
            <p className="eyebrow mb-2 mt-6">SPONSORED</p><h2 className="font-myeongjo text-2xl font-semibold">화력 추천 광고 관리</h2>
            <p className="mt-3 text-sm leading-7 text-[#7d6b72]">신생 브랜드 광고의 추천점수, 추천 이유, 노출 기간과 쿠팡 공식판매처를 관리합니다.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#994c60]">광고 관리 열기 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/admin/experts" className="paper-card group rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(145,74,94,.12)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf2e9] text-[#63745d]"><Stethoscope size={22} /></span>
            <p className="eyebrow mb-2 mt-6">EXPERTS</p><h2 className="font-myeongjo text-2xl font-semibold">전문가 인증 관리</h2>
            <p className="mt-3 text-sm leading-7 text-[#7d6b72]">의사 면허, 전문의 자격, 근무지 확인 결과를 검토하고 신청 상태를 처리합니다.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#994c60]">인증 관리 열기 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/admin/data-sources" className="paper-card group rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(145,74,94,.12)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7e4e9] text-[#a44f65]"><DatabaseZap size={22} /></span>
            <p className="eyebrow mb-2 mt-6">DATA SOURCES</p><h2 className="font-myeongjo text-2xl font-semibold">원천 데이터 관리</h2>
            <p className="mt-3 text-sm leading-7 text-[#7d6b72]">식약처 API, 협회 표준 성분명, 브랜드 공식 전성분의 적재와 검수 상태를 관리합니다.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#994c60]">데이터 관리 열기 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </main>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: string }) {
  return <div className="rounded-[22px] border border-[#dca9b638] bg-white/70 p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#857179]">{label}</span><Icon size={18} className="text-[#a65368]" /></div><strong className="mt-3 block font-myeongjo text-2xl">{value}</strong></div>;
}
