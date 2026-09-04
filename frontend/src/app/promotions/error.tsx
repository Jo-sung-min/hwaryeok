"use client";

import { DataError } from "@/components/data-error";

export default function PromotionsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DataError error={error} reset={reset} title="화력 추천 광고를 불러오지 못했어요" />;
}
