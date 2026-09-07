import Link from "next/link";
import type { UsageVideoPage } from "@/lib/usage-video-types";

export function UsageVideoPagination({ data, basePath, status }: { data: UsageVideoPage; basePath: string; status?: string }) {
  if (data.totalPages <= 1 && data.page === 0) return null;
  const href = (page: number) => { const params = new URLSearchParams({ page: String(page + 1) }); if (status) params.set("status", status); return `${basePath}?${params}`; };
  return <nav aria-label="사용법 영상 목록 페이지" className="mt-7 flex items-center justify-center gap-4">{data.page > 0 && <Link href={href(data.page - 1)} className="line-btn !min-h-11">이전</Link>}<span className="text-xs text-[#8b7883]">{data.page + 1} / {Math.max(1, data.totalPages)}</span>{data.hasNext && <Link href={href(data.page + 1)} className="line-btn !min-h-11">다음</Link>}</nav>;
}
