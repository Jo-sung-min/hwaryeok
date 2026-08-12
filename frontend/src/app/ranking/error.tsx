"use client";

import { DataError } from "@/components/data-error";

export default function RankingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DataError error={error} reset={reset} title="화력 랭킹을 불러오지 못했어요." />;
}
