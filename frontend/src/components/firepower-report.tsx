import Link from "next/link";
import { CircleGauge, FlaskConical, Info, MessageCircle, ShieldCheck, UserRoundCheck } from "lucide-react";
import type { Analysis, ProductIngredients, ProductReviewSummary } from "@/lib/types";

type FirepowerReportProps = {
  analysis: Analysis;
  ingredientData: ProductIngredients;
  reviewSummary: ProductReviewSummary;
  personalized: boolean;
};

export function FirepowerReport({ analysis, ingredientData, reviewSummary, personalized }: FirepowerReportProps) {
  const reviewState = getReviewState(reviewSummary);
  const primaryHighlight = analysis.highlights[0] ?? "제품의 성분 구성과 피부 조건을 함께 확인했어요.";
  const primaryCaution = analysis.cautions[0] ?? "처음 사용할 때는 피부 반응을 천천히 확인해 주세요.";

  return (
    <section id="report" className="container-page py-10 md:py-16" aria-labelledby="report-title">
      <div className="overflow-hidden rounded-[28px] border border-[#e4afbb42] bg-white/82 shadow-[0_24px_80px_rgba(116,72,64,.08)] sm:rounded-[34px]">
        <div className="grid gap-8 border-b border-[#75564516] bg-gradient-to-br from-[#fff6f8] via-white to-[#f4efe9] p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:p-10">
          <div>
            <div className="flex items-center gap-2 text-[#a55468]"><CircleGauge size={18} /><p className="eyebrow">HWA:RYEOK REPORT</p></div>
            <h2 id="report-title" className="mt-4 font-myeongjo text-3xl font-semibold sm:text-4xl">한 장으로 보는 화력 리포트</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#71645d]">성분의 구성, 실제 사용자의 평가, 현재 적용한 피부 조건을 차례로 보여드려요. 숫자와 함께 나에게 맞는 이유를 살펴보세요.</p>
          </div>
          <div className="rounded-[22px] border border-[#bd8d8233] bg-white/72 p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#91475b]"><Info size={15} /> 한 줄 화력</div>
            <p className="mt-3 font-myeongjo text-lg leading-8 text-[#463b36]">{primaryHighlight}</p>
            <p className="mt-2 text-xs leading-6 text-[#8b6d67]">확인할 점: {primaryCaution}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          <ReportMetric
            icon={FlaskConical}
            label="성분 정보"
            value={`${ingredientData.totalCount}개 확인`}
            description={`좋음 ${ingredientData.goodCount} · 주의 ${ingredientData.cautionCount} · 일반 ${ingredientData.neutralCount}`}
          />
          <ReportMetric
            icon={MessageCircle}
            label="실사용 데이터"
            value={reviewState.label}
            description={reviewState.description}
          />
          <ReportMetric
            icon={UserRoundCheck}
            label="피부 기준"
            value={personalized ? "내 프로필 적용" : "예시 프로필 적용"}
            description={personalized ? `${analysis.skinType} · ${analysis.concerns.join(" · ")}` : "프로필을 등록하면 내 조건으로 다시 계산해요."}
          />
          <ReportMetric
            icon={ShieldCheck}
            label="정보 상태"
            value="선명하게 표시"
            description="리뷰 수와 근거 수준, 최근 확인 정보를 함께 보여드려요."
          />
        </div>

        {!personalized && (
          <div className="flex flex-col gap-4 border-t border-[#75564516] bg-[#fff8f9] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-sm leading-6 text-[#705f59]">지금 보이는 적합도는 <strong>수부지·민감·속건조 예시 조건</strong>입니다. 내 피부 정보가 없어도 둘러볼 수 있고, 원할 때만 개인화할 수 있어요.</p>
            <Link href="/profile" className="line-btn shrink-0">내 피부 기준 적용하기</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof FlaskConical;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="border-b border-[#75564516] p-6 sm:p-7 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-center gap-2 text-xs font-bold text-[#8d756b]"><Icon size={16} className="text-[#a65368]" />{label}</div>
      <strong className="mt-3 block font-myeongjo text-xl text-[#443934]">{value}</strong>
      <p className="mt-2 text-[11px] leading-5 text-[#81736b]">{description}</p>
    </div>
  );
}

function getReviewState(summary: ProductReviewSummary) {
  const reviewCount = summary.reviewCount.toLocaleString("ko-KR");
  if (summary.rankingStatus === "OFFICIAL") {
    return { label: `${reviewCount}개 · 충분`, description: "공식 리뷰 순위에 반영되는 데이터예요." };
  }
  if (summary.rankingStatus === "REFERENCE") {
    return { label: `${reviewCount}개 · 참고`, description: `${summary.minimumOfficialReviewCount}개부터 공식 순위에 반영해요.` };
  }
  return { label: `${reviewCount}개 · 수집 중`, description: "표본이 적어 점수보다 개별 후기를 먼저 확인해 주세요." };
}
