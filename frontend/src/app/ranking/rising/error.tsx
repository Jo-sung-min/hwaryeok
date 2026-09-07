"use client";

import { DataError } from "@/components/data-error";

export default function RisingRankingError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <DataError error={error} reset={retry} title="급상승 랭킹을 불러오지 못했어요." />;
}
