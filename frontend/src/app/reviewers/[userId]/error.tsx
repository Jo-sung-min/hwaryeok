"use client";

import { DataError } from "@/components/data-error";

export default function ReviewerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DataError error={error} reset={reset} title="사용자 리뷰를 불러오지 못했어요" />;
}
