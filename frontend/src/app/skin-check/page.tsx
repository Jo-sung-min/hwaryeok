import type { Metadata } from "next";
import { getSkinTypeStatistics } from "@/lib/api";
import { QuickSkinCheck } from "./quick-skin-check";

export const metadata: Metadata = {
  title: "피부 상태 자가 체크",
  description: "15개 문항으로 피부 상태와 생활 습관을 살펴보고 답변 기반 피부 경향과 맞춤 제품을 확인하세요. 언제든 답변을 수정할 수 있어요.",
  alternates: { canonical: "/skin-check" },
};

export default async function SkinCheckPage() {
  const statistics = await getSkinTypeStatistics().catch(() => null);
  return <QuickSkinCheck statistics={statistics} />;
}
