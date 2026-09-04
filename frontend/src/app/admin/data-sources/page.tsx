import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, ExternalLink, Layers3, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen pb-28">
      <section className="border-b border-[#dfa6b52b] bg-[#fff0f3] py-9 md:py-14">
        <div className="container-page">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#76646b]"><ArrowLeft size={16} /> 관리자 센터</Link>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="eyebrow mb-3">DATA PROVENANCE</p><h1 className="font-myeongjo text-3xl font-semibold md:text-4xl">화장품 원천 데이터 관리</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[#7b6970]">식약처 품목·규제 정보, 협회 표준 성분명, 브랜드 공식 전성분을 분리해 적재하고 출처와 확인일을 남깁니다.</p></div>
            <span className="inline-flex self-start items-center gap-2 rounded-full border border-[#c7819540] bg-white/80 px-4 py-2 text-xs font-semibold text-[#9b4a5f]"><ShieldCheck size={15} /> 관리자 검수 파이프라인</span>
          </div>
        </div>
      </section>

      <main className="container-page py-8 md:py-12">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="표준 성분 레코드" value={status.ingredientReferenceCount} />
          <Stat label="식약처 품목" value={status.mfdsProductCount} />
          <Stat label="사용제한 원료" value={status.mfdsRegulationCount} />
          <Stat label="공식 전성분 등록" value={status.officialIngredientListCount} />
          <Stat label="검증·공개 완료" value={status.verifiedOfficialIngredientListCount} />
          <Stat label="성분 사용조건 연결" value={regulationReviews.length} />
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <PipelineCard eyebrow="01 · GOVERNMENT API" title="식약처 API 동기화" description="기능성화장품 보고품목과 사용제한 원료를 원문 JSON과 함께 저장합니다." sources={mfdsSources}>
            <MfdsSyncForm configured={mfdsConfigured} />
          </PipelineCard>
          <PipelineCard eyebrow="02 · STANDARD DICTIONARY" title="대한화장품협회 성분사전" description="표준명·영문명·CAS No·구명칭을 이름 매칭 기준사전으로 초기 적재합니다." sources={[kciaSource]} warning="협회 약관상 사전 승낙 없는 영리 목적 복제·배포가 제한됩니다. 사용권이 확인된 공식 파일만 올려 주세요.">
            <KciaImportForm />
          </PipelineCard>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#dca9b642] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><p className="eyebrow mb-2">03 · PRODUCT INGREDIENTS</p><h2 className="font-myeongjo text-2xl font-semibold">브랜드 공식 전성분 보강</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#786970]">상품 관리에서 브랜드 공식 URL과 전성분 원문을 붙여 넣으면 표준 성분명과 자동 대조합니다. 전부 일치할 때만 사용자 화면에 공개합니다.</p></div>
            <Link href="/admin/products" className="ink-btn shrink-0">상품별 전성분 등록 <Layers3 size={16} /></Link>
          </div>
          <SourceLine source={brandSource} />
        </section>

        <section className="mt-5 rounded-[26px] border border-[#dca9b642] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="eyebrow mb-2">04 · INGREDIENT CONDITIONS</p>
              <h2 className="font-myeongjo text-2xl font-semibold">성분별 식약처 사용조건 검수</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#786970]">화력 성분과 식약처 사용제한 원료 후보를 대조합니다. 이름이 비슷하다는 이유만으로 자동 공개하지 않고, 국가·CAS No·제품 유형·농도와 단서를 관리자가 확인한 뒤 연결합니다.</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#9ebea64d] bg-[#f1f7f2] px-4 py-2 text-xs font-bold text-[#55735e]"><ShieldCheck size={14} /> 검수 공개 {regulationReviews.length}건</span>
          </div>
          <IngredientRegulationReviewBoard ingredients={ingredientPage.content} initialReviews={regulationReviews} />
        </section>
      </main>
    </div>
  );
}

function PipelineCard({ eyebrow, title, description, sources, warning, children }: { eyebrow: string; title: string; description: string; sources: DataSourceStatus[]; warning?: string; children: React.ReactNode }) {
  return (
    <article className="rounded-[26px] border border-[#dca9b642] bg-white p-6 sm:p-8">
      <p className="eyebrow mb-2">{eyebrow}</p><h2 className="font-myeongjo text-2xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-[#786970]">{description}</p>
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
