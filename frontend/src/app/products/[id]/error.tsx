"use client";

import { DataError } from "@/components/data-error";

export default function ProductDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DataError error={error} reset={reset} title="제품 분석을 불러오지 못했어요." />;
}
