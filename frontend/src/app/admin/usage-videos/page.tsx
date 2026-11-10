import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/app/admin/admin-ui";
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
  if (user.role !== "ADMIN") redirect("/");
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();
  let data = await getAdminUsageVideos(accessToken, status, readUsageVideoPage(search.page)).catch((error) => recoverAdminPageSession(error, returnTo));
  if (data.page > 0 && data.page >= data.totalPages) data = await getAdminUsageVideos(accessToken, status, Math.max(0, data.totalPages - 1)).catch((error) => recoverAdminPageSession(error, returnTo));

  return <><AdminHeader title="사용법 영상" meta="승인한 영상만 공개 제품에 표시돼요." /><div className="container-page">
    <nav aria-label="영상 검토 상태 필터" className="mb-6 flex flex-wrap gap-2">{[{ value: "", label: "전체" }, ...Object.entries(usageVideoStatusLabels).map(([value, label]) => ({ value, label }))].map((option) => <Link key={option.value} href={option.value ? `/admin/usage-videos?status=${option.value}` : "/admin/usage-videos"} aria-current={(status ?? "") === option.value ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-semibold ${(status ?? "") === option.value ? "border-[#d084a0] bg-[#fff0f6] text-[#b34f77]" : "border-[#eddee5] bg-white text-[#957b89]"}`}>{option.label}</Link>)}</nav>
    <p className="mb-4 text-sm font-semibold text-[#6d5362]">{status ? usageVideoStatusLabels[status] : "전체 등록"} {data.totalElements}개</p>
    <div className="space-y-5">{data.content.map((video) => <article key={video.id} className="rounded-[24px] border border-[#e9d1dc] bg-white p-4 sm:p-6"><header className="mb-5 flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${video.status === "APPROVED" ? "bg-[#eef6ef] text-[#5a7c60]" : "bg-[#fff0f6] text-[#ad5d7d]"}`}>{usageVideoStatusLabels[video.status]}</span><span className="text-[10px] text-[#a08795]">등록 {new Date(video.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span></header><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><div><UsageVideoCard video={video} showProduct />{video.description && <details className="mt-3"><summary className="min-h-10 cursor-pointer text-xs text-[#a36a83]">등록한 설명 전문 확인</summary><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-[#89747f]">{video.description}</p></details>}</div><UsageVideoModerationForm video={video} /></div></article>)}</div>
    {data.content.length === 0 && <p className="rounded-2xl border border-dashed border-[#e7cdda] py-12 text-center text-sm text-[#9c7d8d]">해당 상태의 영상이 없어요.</p>}
    <UsageVideoPagination data={data} basePath="/admin/usage-videos" status={status} />
  </div></>;
}
