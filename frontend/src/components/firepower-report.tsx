import Link from "next/link";
import { Check, ChevronDown, TriangleAlert } from "lucide-react";
import type { Analysis, ProductIngredients, ProductReviewSummary } from "@/lib/types";

type FirepowerReportProps = {
  analysis: Analysis;
  ingredientData: ProductIngredients;
  reviewSummary: ProductReviewSummary;
  personalized: boolean;
};

export function FirepowerReport({ analysis, ingredientData, reviewSummary, personalized }: FirepowerReportProps) {
  const primaryHighlight = analysis.highlights[0] ?? "제품의 성분 구성과 피부 조건을 함께 확인했어요.";
  const primaryCaution = analysis.cautions[0] ?? "처음 사용할 때는 피부 반응을 천천히 확인해 주세요.";
  const moreHighlights = analysis.highlights.slice(1);
  const moreCautions = analysis.cautions.slice(1);
  const hasMoreReasons = moreHighlights.length > 0 || moreCautions.length > 0;

  return <section id="report" className="container-page scroll-mt-24 py-8" aria-labelledby="report-title">
    <div className="overflow-hidden rounded-[20px] border border-[#e8e5e9] bg-white">
      <header className="border-b border-[#ece9ed] px-5 py-5">
        <p className="text-[10px] font-bold tracking-[.14em] text-[#ad4c6e]">{personalized ? "내 피부 궁합" : "예시 피부 궁합"}</p>
        <h2 id="report-title" className="mt-1 font-myeongjo text-2xl font-semibold">왜 잘 맞을까요?</h2>
        <p className="mt-1 text-xs text-[#7f7680]">{analysis.skinType} · {analysis.concerns.join(" · ")}</p>
      </header>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-2" aria-label="피부 궁합 세부 점수">
          {analysis.details.map((item) => <div key={item.label} className="rounded-xl border border-[#ece9ed] p-3">
            <div className="flex items-center justify-between gap-2"><strong className="text-xs">{item.label}</strong><span className={`text-base font-bold tabular-nums ${item.positive ? "text-[#65745f]" : "text-[#a45d51]"}`}>{item.value}</span></div>
            <p className="mt-1 text-[9px] leading-4 text-[#8a8189]">{item.note}</p>
          </div>)}
        </div>

        <div className="mt-5 divide-y divide-[#eee9ec] border-y border-[#eee9ec]">
          <KeyPoint icon="good" label="잘 맞는 이유" text={primaryHighlight} />
          <KeyPoint icon="caution" label="사용 팁" text={primaryCaution} />
        </div>

        {hasMoreReasons && <details className="group border-b border-[#eee9ec]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-[#6b626a]">근거 더 보기 <ChevronDown size={15} className="transition group-open:rotate-180" /></summary>
          <div className="grid gap-4 pb-4 text-xs leading-6 text-[#716870]">
            {moreHighlights.length > 0 && <div><strong className="text-[#5f6e5a]">추가로 잘 맞는 이유</strong><ul className="mt-1">{moreHighlights.map((item) => <li key={item}>· {item}</li>)}</ul></div>}
            {moreCautions.length > 0 && <div><strong className="text-[#9b5b50]">추가 사용 팁</strong><ul className="mt-1">{moreCautions.map((item) => <li key={item}>· {item}</li>)}</ul></div>}
          </div>
        </details>}

        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-5 text-[#817880]">
          <span>연결 성분 {ingredientData.totalCount}개</span>
          <span>사용자 리뷰 {reviewLabel(reviewSummary)}</span>
          <span>정보 신뢰 {confidenceLabel(analysis.product.confidenceLevel)}</span>
        </div>

        {!personalized && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#fff7fa] px-3 py-3"><p className="text-[10px] leading-5 text-[#766a72]">지금은 예시 피부 기준이에요. 내 답변으로 다시 볼 수 있어요.</p><Link href="/skin-check" className="shrink-0 text-[11px] font-bold text-[#a33f62] underline underline-offset-4">피부 체크</Link></div>}

        <details className="group mt-2">
          <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-[10px] font-medium text-[#8a8188]">점수 계산 기준 <ChevronDown size={13} className="transition group-open:rotate-180" /></summary>
          <p className="pb-1 text-[10px] leading-5 text-[#8a8188]">{analysis.product.scoreBasis || "성분, 피부 적합도, 데이터 신뢰를 함께 계산해요."} · 브랜드 인지도와 판매량은 제외합니다.</p>
        </details>
      </div>
    </div>
  </section>;
}

function KeyPoint({ icon, label, text }: { icon: "good" | "caution"; label: string; text: string }) {
  const Icon = icon === "good" ? Check : TriangleAlert;
  return <div className="flex gap-3 py-3"><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${icon === "good" ? "bg-[#eef3ec] text-[#64735f]" : "bg-[#fff0ec] text-[#a76455]"}`}><Icon size={14} aria-hidden="true" /></span><p className="min-w-0 text-xs leading-6 text-[#625a61]"><strong className="mr-2 text-[#3f3940]">{label}</strong>{text}</p></div>;
}

function reviewLabel(summary: ProductReviewSummary) {
  if (summary.reviewScore === null) return `${summary.reviewCount.toLocaleString("ko-KR")}개 · 집계 전`;
  return `${summary.reviewScore.toFixed(1)}점 · ${summary.reviewCount.toLocaleString("ko-KR")}개`;
}

function confidenceLabel(value: Analysis["product"]["confidenceLevel"]) {
  if (value === "HIGH") return "높음";
  if (value === "MEDIUM") return "보통";
  return "보강 중";
}
