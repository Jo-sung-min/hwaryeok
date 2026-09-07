"use client";

import { DataError } from "@/components/data-error";

export default function PersonalRankingError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <DataError error={error} reset={retry} title="내 피부 제품 랭킹을 불러오지 못했어요." />;
}
