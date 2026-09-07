import Link from "next/link";
import { ArrowLeft, ArrowRight, Video } from "lucide-react";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import { getMyUsageVideos } from "@/lib/usage-video-api";
import { readUsageVideoPage, usageVideoStatusLabels } from "@/lib/usage-video-types";
import { UsageVideoCard } from "@/components/usage-videos/usage-video-card";
import { UsageVideoDeleteForm } from "@/components/usage-videos/usage-video-delete-form";
import { UsageVideoForm } from "@/components/usage-videos/usage-video-form";
import { UsageVideoPagination } from "@/components/usage-videos/usage-video-pagination";

export const metadata = { title: "내 사용법 영상 관리", robots: { index: false, follow: false } };

export default async function MyUsageVideosPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const search = await searchParams;
  const returnTo = `/my/usage-videos?page=${readUsageVideoPage(search.page) + 1}`;
  await requireSession(returnTo);
  const { accessToken } = await readAuthTokens();
  if (!accessToken) return null;
  let data = await getMyUsageVideos(accessToken, readUsageVideoPage(search.page)).catch((error) => recoverAdminPageSession(error, returnTo));
  if (data.page > 0 && data.page >= data.totalPages) data = await getMyUsageVideos(accessToken, Math.max(0, data.totalPages - 1)).catch((error) => recoverAdminPageSession(error, returnTo));

  return <div className="container-page max-w-4xl pb-28 pt-6 md:pt-10"><Link href="/my" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#967382]"><ArrowLeft size={16} />마이 화력</Link><header className="mb-8 mt-5"><h1 className="flex items-center gap-2 font-myeongjo text-3xl font-semibold"><Video className="text-[#bd6283]" />내 사용법 영상</h1><p className="mt-3 text-sm leading-7 text-[#8e7482]">등록한 유튜브 영상과 채널의 노출 상태를 확인하세요. 관리자 승인 후 공개 제품의 사용법에 표시됩니다.</p><Link href="/products" className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#b45479]">제품을 찾아 새 영상 등록 <ArrowRight size={14} /></Link></header><p className="mb-4 text-sm font-semibold text-[#7a5a6c]">등록 영상 {data.totalElements}개</p>
    <div className="space-y-5">{data.content.map((video) => <article key={video.id} className="rounded-[24px] border border-[#ead2dd] bg-white p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${video.status === "APPROVED" ? "bg-[#edf6ef] text-[#53795e]" : "bg-[#fff0f6] text-[#a95577]"}`}>{usageVideoStatusLabels[video.status]}</span><span className="text-[10px] text-[#a08493]">등록 {new Date(video.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span></div><UsageVideoCard video={video} showProduct />{video.moderationNote && <div className="mt-4 rounded-xl bg-[#fff3f8] p-4"><p className="text-xs font-semibold text-[#a05477]">관리자 검토 메모</p><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-[#927180]">{video.moderationNote}</p></div>}{video.status === "PENDING" && <p className="mt-3 text-xs leading-6 text-[#9b7c8c]">검토 대기 중이에요. 승인 전에는 다른 사용자에게 보이지 않아요.</p>}{video.status === "APPROVED" && <p className="mt-3 text-xs leading-6 text-[#9b7c8c]">공개 중인 제품에 표시돼요. 제품이 비공개이면 영상도 노출되지 않아요.</p>}<details className="mt-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold text-[#b0557a]">영상 정보 수정 · 재검토 요청</summary><div className="pt-3"><UsageVideoForm productId={video.productId} video={video} /></div></details><UsageVideoDeleteForm id={video.id} /></article>)}</div>
    {data.content.length === 0 && <div className="rounded-2xl border border-dashed border-[#e6cddb] px-5 py-12 text-center"><Video size={30} className="mx-auto mb-4 text-[#d398b0]" /><p className="text-sm font-semibold text-[#866879]">등록한 사용법 영상이 없어요.</p><p className="mt-2 text-xs leading-6 text-[#a08493]">제품 페이지의 ‘영상으로 보는 사용법’에서 첫 영상을 등록해 보세요.</p></div>}
    <UsageVideoPagination data={data} basePath="/my/usage-videos" />
  </div>;
}
