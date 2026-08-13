"use client";

import { DataError } from "@/components/data-error";

export default function IngredientsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DataError error={error} reset={reset} title="성분 사전을 불러오지 못했어요." />;
}
