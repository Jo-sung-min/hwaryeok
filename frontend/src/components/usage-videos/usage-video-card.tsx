import Link from "next/link";
import { ArrowUpRight, Play, UserRound } from "lucide-react";
import type { UsageVideo } from "@/lib/usage-video-types";

export function UsageVideoCard({ video, showProduct = false }: { video: UsageVideo; showProduct?: boolean }) {
  return <article className="min-w-0 rounded-2xl border border-[#eddae2] bg-white p-5">
    <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold text-[#a75573]"><span className="rounded-full bg-[#fff0f5] px-2.5 py-1">사용자 등록 · 채널 홍보</span>{video.featured && <span className="rounded-full border border-[#edc0d0] px-2.5 py-1">관리자 우선 노출</span>}</div>
    {showProduct && <Link href={`/products/${encodeURIComponent(video.productId)}`} className="mb-3 block text-xs leading-5 text-[#89767f] hover:text-[#ad4c6d]">{video.productBrand} · {video.productName}</Link>}
    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer ugc" className="group flex min-h-12 items-start gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c65b7b]">
      <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff1f6] text-[#c75073]"><Play size={19} /></span>
      <span className="min-w-0"><strong className="block [overflow-wrap:anywhere] text-sm font-semibold leading-6 text-[#493940] group-hover:text-[#b24b6c]">{video.title}</strong><span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#a66a80]">유튜브에서 영상 보기 <ArrowUpRight size={13} /></span></span>
    </a>
    {video.description && <p className="mt-3 line-clamp-3 whitespace-pre-wrap [overflow-wrap:anywhere] text-xs leading-6 text-[#817079]">{video.description}</p>}
    <div className="mt-4 space-y-2 border-t border-[#f3e6eb] pt-3">
      <a href={video.channelUrl} target="_blank" rel="noopener noreferrer ugc" className="flex min-h-10 items-center justify-between gap-2 rounded-lg bg-[#fff8fb] px-3 text-xs font-semibold text-[#a4486a]"><span className="min-w-0 truncate">{video.channelName} 채널 방문</span><ArrowUpRight size={15} className="shrink-0" /></a>
      <Link href={`/reviewers/${encodeURIComponent(video.authorId)}`} className="inline-flex min-h-9 items-center gap-1.5 text-[11px] text-[#93828a]"><UserRound size={12} />등록자 {video.authorNickname}</Link>
    </div>
  </article>;
}
