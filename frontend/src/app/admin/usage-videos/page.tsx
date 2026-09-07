import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import { getAdminUsageVideos } from "@/lib/usage-video-api";
import { readUsageVideoPage, usageVideoStatusLabels, type UsageVideoStatus } from "@/lib/usage-video-types";
import { UsageVideoCard } from "@/components/usage-videos/usage-video-card";
import { UsageVideoPagination } from "@/components/usage-videos/usage-video-pagination";
import { UsageVideoModerationForm } from "./moderation-form";

export const metadata = { title: "사용법 영상 노출 관리", robots: { index: false, follow: false } };

export default async function AdminUsageVideosPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; page?: string | string[] }> }) {
  const search = await searchParams;
  const rawStatus = Array.isArray(search.status) ? search.status[0] : search.status;
  const status = rawStatus && Object.hasOwn(usageVideoStatusLabels, rawStatus) ? rawStatus as UsageVideoStatus : undefined;
  const returnTo = `/admin/usage-videos?${new URLSearchParams({ ...(status ? { status } : {}), page: String(readUsageVideoPage(search.page) + 1) })}`;
  const user = await requireSession(returnTo);
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();
  let data = await getAdminUsageVideos(accessToken, status, readUsageVideoPage(search.page)).catch((error) => recoverAdminPageSession(error, returnTo));
  if (data.page > 0 && data.page >= data.totalPages) data = await getAdminUsageVideos(accessToken, status, Math.max(0, data.totalPages - 1)).catch((error) => recoverAdminPageSession(error, returnTo));

  return <div className="container-page pb-28 pt-6 md:pt-10"><Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#967382]"><ArrowLeft size={16} />관리자 센터</Link><header className="mb-7 mt-5"><p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#b35579]"><ShieldCheck size={15} />관리자 전용</p><h1 className="font-myeongjo text-3xl font-semibold">사용법 영상 노출 관리</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[#8a7380]">제품과 영상의 관련성, 채널 링크, 광고·협찬 표시를 검토해 노출을 승인하세요. 승인된 영상만 공개 제품에 표시되고, 등록자가 수정하면 검토 대기로 돌아갑니다.</p><p className="mt-2 text-xs leading-6 text-[#a28694]">우선 노출 그룹 → 노출 순서 → 최신 검토순으로 진열합니다. 승인 자체는 채널 소유권 인증이나 제품 효능 보증이 아닙니다.</p></header>
    <nav aria-label="영상 검토 상태 필터" className="mb-6 flex flex-wrap gap-2">{[{ value: "", label: "전체" }, ...Object.entries(usageVideoStatusLabels).map(([value, label]) => ({ value, label }))].map((option) => <Link key={option.value} href={option.value ? `/admin/usage-videos?status=${option.value}` : "/admin/usage-videos"} aria-current={(status ?? "") === option.value ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-semibold ${(status ?? "") === option.value ? "border-[#d084a0] bg-[#fff0f6] text-[#b34f77]" : "border-[#eddee5] bg-white text-[#957b89]"}`}>{option.label}</Link>)}</nav>
    <p className="mb-4 text-sm font-semibold text-[#6d5362]">{status ? usageVideoStatusLabels[status] : "전체 등록"} {data.totalElements}개</p>
    <div className="space-y-5">{data.content.map((video) => <article key={video.id} className="rounded-[24px] border border-[#e9d1dc] bg-white p-4 sm:p-6"><header className="mb-5 flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${video.status === "APPROVED" ? "bg-[#eef6ef] text-[#5a7c60]" : "bg-[#fff0f6] text-[#ad5d7d]"}`}>{usageVideoStatusLabels[video.status]}</span><span className="text-[10px] text-[#a08795]">등록 {new Date(video.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span></header><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><div><UsageVideoCard video={video} showProduct />{video.description && <details className="mt-3"><summary className="min-h-10 cursor-pointer text-xs text-[#a36a83]">등록한 설명 전문 확인</summary><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-[#89747f]">{video.description}</p></details>}</div><UsageVideoModerationForm video={video} /></div></article>)}</div>
    {data.content.length === 0 && <p className="rounded-2xl border border-dashed border-[#e7cdda] py-12 text-center text-sm text-[#9c7d8d]">해당 상태의 영상이 없어요.</p>}
    <UsageVideoPagination data={data} basePath="/admin/usage-videos" status={status} />
  </div>;
}
