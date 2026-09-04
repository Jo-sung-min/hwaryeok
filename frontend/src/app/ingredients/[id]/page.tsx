import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, FlaskConical, Leaf, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { ProductCard } from "@/components/product-ui";
import { ApiRequestError, getIngredient, getIngredientFirepower, getIngredientRegulations } from "@/lib/api";
import { getFavoriteViewState } from "@/lib/auth-session";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const ingredient = await getIngredient(id);
    return {
      title: `${ingredient.name} 성분`,
      description: `${ingredient.name}(${ingredient.englishName})의 역할, 근거 수준, 피부별 특징과 포함 제품을 확인하세요.`,
      alternates: { canonical: `/ingredients/${ingredient.id}` },
      openGraph: {
        title: `${ingredient.name} 성분 사전`,
        description: ingredient.description,
        url: `/ingredients/${ingredient.id}`,
      },
    };
  } catch {
    return { title: "성분을 찾을 수 없어요", robots: { index: false, follow: false } };
  }
}

export default async function IngredientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [ingredient, firepower, regulations, favoriteState] = await Promise.all([
      getIngredient(id),
      getIngredientFirepower(id),
      getIngredientRegulations(id),
      getFavoriteViewState(),
    ]);
    const favoriteIds = new Set(favoriteState.favoriteIds);
    const skinFeatures = Object.entries(ingredient.skinTypeFeatures);
    const concernFeatures = Object.entries(ingredient.concernFeatures);
    const isCaution = ingredient.status === "CAUTION";

    return (
      <div className="pb-24">
        <div className="container-page py-4 md:py-9">
          <Link href="/ingredients" className="inline-flex items-center gap-2 text-sm text-[#766960]"><ArrowLeft size={16} /> 성분 사전</Link>
        </div>

        <section className="container-page">
          <div className="relative overflow-hidden rounded-[26px] border border-[#74513f1a] bg-[#fffaf2a8] px-5 py-10 sm:rounded-[34px] sm:px-6 sm:py-12 md:px-12 md:py-16">
            <div className="relative max-w-3xl">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${isCaution ? "bg-[#d3957d1c] text-[#9b5945]" : "bg-[#84917a1a] text-[#65715f]"}`}>
                {isCaution ? <TriangleAlert size={15} /> : <Check size={15} />}
                {isCaution ? "피부 상태를 살피며 사용해요" : "피부에 도움을 줄 수 있어요"}
              </span>
              <p className="mt-8 text-xs font-bold uppercase tracking-[.14em] text-[#a06b5d]">{ingredient.role}</p>
              <h1 className="mt-3 break-keep font-myeongjo text-[34px] font-semibold leading-tight md:text-6xl">{ingredient.name}</h1>
              <p className="mt-3 text-sm text-[#98877b] md:text-base">{ingredient.englishName}</p>
              <p className="mt-8 max-w-2xl text-base leading-8 text-[#655a52]">{ingredient.description}</p>
              <div className="mt-7 flex flex-wrap gap-2">{ingredient.tags.map((tag) => <span key={tag} className="rounded-full border border-[#a45a5025] bg-[#fff9f1] px-3 py-1.5 text-xs text-[#91564d]">#{tag}</span>)}</div>
            </div>
          </div>
        </section>

        <section className="container-page py-12 md:py-24">
          <div className="mb-9">
            <p className="eyebrow mb-4">PERSONAL FIT</p>
            <h2 className="section-title font-myeongjo">내 피부에는 어떻게 느껴질까요?</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#76846d24] bg-[#edf1e84f] p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#7b8973] text-white"><Leaf size={18} /></span><h3 className="font-myeongjo text-xl font-semibold">피부 타입별 특징</h3></div>
              {skinFeatures.length > 0 ? <dl className="mt-7 grid gap-5">{skinFeatures.map(([skinType, feature]) => <div key={skinType} className="border-b border-[#76846d1c] pb-5 last:border-0 last:pb-0"><dt className="text-xs font-bold text-[#667260]">{skinType} 피부</dt><dd className="mt-2 text-sm leading-7 text-[#605e55]">{feature}</dd></div>)}</dl> : <p className="mt-7 text-sm text-[#746d65]">피부 타입별 정보가 준비 중이에요.</p>}
            </div>
            <div className="rounded-[28px] border border-[#c78e762a] bg-[#f4e4dc69] p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#c1856f] text-white"><Sparkles size={18} /></span><h3 className="font-myeongjo text-xl font-semibold">피부 고민별 특징</h3></div>
              {concernFeatures.length > 0 ? <dl className="mt-7 grid gap-5">{concernFeatures.map(([concern, feature]) => <div key={concern} className="border-b border-[#c78e761f] pb-5 last:border-0 last:pb-0"><dt className="text-xs font-bold text-[#9b6553]">{concern}</dt><dd className="mt-2 text-sm leading-7 text-[#685c55]">{feature}</dd></div>)}</dl> : <p className="mt-7 text-sm text-[#746d65]">피부 고민별 정보가 준비 중이에요.</p>}
            </div>
          </div>

          {ingredient.caution && (
            <div className="mt-5 flex gap-4 rounded-[24px] border border-[#b8745d2a] bg-[#fff8ee] p-6 md:p-7">
              <ShieldAlert className="mt-0.5 shrink-0 text-[#a76551]" size={22} />
              <div><h3 className="font-myeongjo text-lg font-semibold">사용 전에 확인해보세요</h3><p className="mt-2 text-sm leading-7 text-[#716158]">{ingredient.caution}</p></div>
            </div>
          )}

          {regulations.length > 0 && (
            <div className="mt-8 rounded-[28px] border border-[#d9a8b54d] bg-white p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="eyebrow mb-3">MFDS VERIFIED CONDITIONS</p>
                  <h2 className="flex items-center gap-2 font-myeongjo text-2xl font-semibold"><ShieldCheck size={22} className="text-[#9b4a5f]" /> 공식 사용조건 참고</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#786970]">식약처 사용제한 원료정보에서 관리자가 성분명과 원문을 확인해 연결한 내용이에요.</p>
                </div>
                <span className="inline-flex shrink-0 self-start rounded-full bg-[#fff0f3] px-3 py-1.5 text-[11px] font-bold text-[#9b4a5f]">검수 완료 {regulations.length}건</span>
              </div>

              <div className="mt-6 space-y-4">
                {regulations.map((regulation) => (
                  <article key={regulation.sourceRecordId} className="rounded-[22px] border border-[#e8d4d9] bg-[#fffafb] p-5 md:p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#dca9b659] bg-white px-3 py-1.5 text-[10px] font-bold text-[#875867]">적용 국가 · {regulation.country ?? "원문 미기재"}</span>
                      <span className="rounded-full border border-[#dca9b659] bg-white px-3 py-1.5 text-[10px] font-bold text-[#875867]">제한 유형 · {regulation.restrictionType ?? "원문 미기재"}</span>
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-[#54474c]">{regulation.standardName}</h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#8b767e]">{regulation.englishName ?? ingredient.englishName}{regulation.casNo ? ` · CAS ${regulation.casNo}` : ""}</p>
                    {regulation.noticeIngredientName && <p className="mt-2 whitespace-pre-line text-[11px] leading-5 text-[#8b767e]">고시 원료명 · {regulation.noticeIngredientName}</p>}
                    <details className="group mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[#68595f]">
                      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 font-bold text-[#805664] marker:hidden">사용 조건 원문 확인 <span className="text-[10px] font-semibold text-[#a17b87] group-open:hidden">펼치기</span><span className="hidden text-[10px] font-semibold text-[#a17b87] group-open:inline">접기</span></summary>
                      <p className="mt-2 whitespace-pre-line border-t border-[#eadde1] pt-3">{regulation.restrictionText || "원문에 별도 제한 문구가 기재되지 않았어요."}</p>
                      {regulation.proviso && <p className="mt-3 whitespace-pre-line border-t border-[#eadde1] pt-3 text-xs text-[#806c73]">단서 · {regulation.proviso}</p>}
                    </details>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#917e85]">
                      <span>{regulation.checkedAt ? `${formatRegulationDate(regulation.checkedAt)} 수집 자료` : "수집일 미기재"}</span>
                      <a href={regulation.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-10 items-center gap-1.5 font-bold text-[#954e62] underline underline-offset-4">식약처 공식 데이터 안내 <ExternalLink size={12} /></a>
                    </div>
                  </article>
                ))}
              </div>
              <p className="mt-5 rounded-2xl bg-[#fff3df] px-4 py-3 text-[11px] leading-6 text-[#796333]">{regulations[0].disclaimer}</p>
            </div>
          )}
        </section>

        <section className="border-y border-[#dfa6b51f] bg-[#fff1f4] py-12 md:py-20">
          <div className="container-page">
            <div className="mb-9 flex items-end justify-between gap-5">
              <div><p className="eyebrow mb-4">INGREDIENT FIREPOWER</p><h2 className="section-title font-myeongjo">{ingredient.name} 화력 TOP</h2><p className="mt-3 max-w-2xl text-xs leading-6 text-[#826f76]">{firepower.disclaimer}</p></div>
              <FlaskConical className="hidden text-[#b47664] md:block" size={32} strokeWidth={1.5} />
            </div>
            {firepower.products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {firepower.products.map((item, index) => (
                  <div key={item.product.id} className="relative">
                    <span className="absolute left-4 top-4 z-20 rounded-full border border-[#c94f73] bg-[#c94f73] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">#{index + 1} · 화력 {item.firepowerScore}</span>
                    <ProductCard product={item.product} initialFavorited={favoriteIds.has(item.product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo={`/ingredients/${id}`} />
                    <div className="mx-2 -mt-2 rounded-b-2xl border border-t-0 border-[#dba7b438] bg-white/80 px-4 pb-4 pt-5">
                      <div className="flex items-center justify-between text-[11px]"><span className="text-[#806e75]">{item.concentrationNote ?? "전성분 순서 기반"}</span><strong className="text-[#9b4a5f]">신뢰도 {confidenceLabel(item.confidence)}</strong></div>
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-[#88757c]">
                        {breakdownItems(item.breakdown).map(([label, value]) => <div key={label} className="flex items-center justify-between gap-2"><span>{label}</span><strong>{value}</strong></div>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="paper-card rounded-[26px] p-10 text-center text-sm text-[#74695f]">연결된 제품을 준비 중이에요.</div>}
          </div>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}

function formatRegulationDate(value: string) {
  return value.slice(0, 10).replaceAll("-", ".");
}

function confidenceLabel(confidence: "HIGH" | "MEDIUM" | "LOW") {
  return confidence === "HIGH" ? "높음" : confidence === "MEDIUM" ? "보통" : "낮음";
}

function breakdownItems(breakdown: {
  match: number;
  concentration: number;
  evidence: number;
  productType: number;
  synergy: number;
  stability: number;
  dataConfidence: number;
}): [string, number][] {
  return [
    ["성분 일치", breakdown.match],
    ["함량 추정", breakdown.concentration],
    ["근거 수준", breakdown.evidence],
    ["제품 유형", breakdown.productType],
    ["시너지", breakdown.synergy],
    ["안정성", breakdown.stability],
    ["데이터 신뢰", breakdown.dataConfidence],
  ];
}
