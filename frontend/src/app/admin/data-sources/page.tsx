import Link from "next/link";
import { notFound } from "next/navigation";
import { Database, ExternalLink, Layers3, ShieldCheck } from "lucide-react";
import { AdminHeader } from "@/app/admin/admin-ui";
import { KciaImportForm, MfdsSyncForm } from "@/app/admin/data-sources/data-source-forms";
import { IngredientRegulationReviewBoard } from "@/app/admin/data-sources/ingredient-regulation-review";
import { getAdminDataPipelineStatus, getAdminIngredientRegulationReviews, getIngredients } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import type { DataSourceStatus } from "@/lib/types";

export default async function AdminDataSourcesPage() {
  const user = await requireSession("/admin/data-sources");
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();
  const [status, ingredientPage, regulationReviews] = await Promise.all([
    getAdminDataPipelineStatus(accessToken),
    getIngredients({ page: 0, size: 50, sort: "name", direction: "asc" }),
    getAdminIngredientRegulationReviews(accessToken),
  ]).catch((error) => recoverAdminPageSession(error, "/admin/data-sources"));
  const mfdsSources = status.sources.filter((source) => source.id.startsWith("MFDS_"));
  const kciaSource = status.sources.find((source) => source.id === "KCIA_DICTIONARY")!;
  const brandSource = status.sources.find((source) => source.id === "BRAND_OFFICIAL")!;
  const mfdsConfigured = mfdsSources.some((source) => source.configured);

  return (
    <div>
      <AdminHeader title="원천 데이터" />

      <main className="container-page">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="표준 성분 레코드" value={status.ingredientReferenceCount} />
          <Stat label="식약처 품목" value={status.mfdsProductCount} />
          <Stat label="사용제한 원료" value={status.mfdsRegulationCount} />
          <Stat label="공식 전성분 등록" value={status.officialIngredientListCount} />
          <Stat label="검증·공개 완료" value={status.verifiedOfficialIngredientListCount} />
          <Stat label="성분 사용조건 연결" value={regulationReviews.length} />
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <PipelineCard title="식약처 API 동기화" sources={mfdsSources}>
            <MfdsSyncForm configured={mfdsConfigured} />
          </PipelineCard>
          <PipelineCard title="대한화장품협회 성분사전" sources={[kciaSource]} warning="협회 약관상 사전 승낙 없는 영리 목적 복제·배포가 제한됩니다. 사용권이 확인된 공식 파일만 올려 주세요.">
            <KciaImportForm />
          </PipelineCard>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#dca9b642] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">브랜드 공식 전성분</h2>
            <Link href="/admin/products" className="ink-btn shrink-0">상품별 전성분 등록 <Layers3 size={16} /></Link>
          </div>
          <SourceLine source={brandSource} />
        </section>

        <section className="mt-5 rounded-[26px] border border-[#dca9b642] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">성분별 식약처 사용조건 검수</h2>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#9ebea64d] bg-[#f1f7f2] px-4 py-2 text-xs font-bold text-[#55735e]"><ShieldCheck size={14} /> 검수 공개 {regulationReviews.length}건</span>
          </div>
          <IngredientRegulationReviewBoard ingredients={ingredientPage.content} initialReviews={regulationReviews} />
        </section>
      </main>
    </div>
  );
}

function PipelineCard({ title, sources, warning, children }: { title: string; sources: DataSourceStatus[]; warning?: string; children: React.ReactNode }) {
  return (
    <article className="rounded-[26px] border border-[#dca9b642] bg-white p-6 sm:p-8">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-5 space-y-2">{sources.map((source) => <SourceLine key={source.id} source={source} />)}</div>
      {warning && <p className="mt-4 rounded-2xl bg-[#fff3df] p-4 text-[11px] leading-5 text-[#7d622e]">{warning}</p>}
      {children}
    </article>
  );
}

function SourceLine({ source }: { source: DataSourceStatus }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#fff8fa] px-4 py-3 text-xs"><div className="min-w-0"><p className="font-bold text-[#634f56]">{source.displayName}</p><p className="mt-1 text-[10px] text-[#907d84]">{source.recordCount.toLocaleString("ko-KR")}건 · {source.configured ? "연결 준비됨" : "환경설정 필요"}</p></div>{source.id !== "BRAND_OFFICIAL" && <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-bold text-[#9d4e63]">공식 안내 <ExternalLink size={12} /></a>}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-[21px] border border-[#dca9b638] bg-white/80 p-4 sm:p-5"><Database size={17} className="text-[#a65368]" /><strong className="mt-3 block font-myeongjo text-2xl">{value.toLocaleString("ko-KR")}</strong><p className="mt-1 text-[11px] text-[#857179]">{label}</p></div>;
}
