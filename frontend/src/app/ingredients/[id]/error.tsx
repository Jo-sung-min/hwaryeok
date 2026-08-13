"use client";

import { DataError } from "@/components/data-error";

export default function IngredientDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DataError error={error} reset={reset} title="성분 정보를 불러오지 못했어요." />;
}
