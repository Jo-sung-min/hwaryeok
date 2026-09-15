"use client";

import { DataError } from "@/components/data-error";

export default function AdminSeoError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <DataError error={error} reset={retry} title="SEO 설정을 불러오지 못했어요." />;
}
