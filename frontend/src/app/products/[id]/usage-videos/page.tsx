import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Video } from "lucide-react";
import { ApiRequestError, getProduct } from "@/lib/api";
import { getCurrentSession } from "@/lib/auth-session";
import { getProductUsageVideos } from "@/lib/usage-video-api";
import { readUsageVideoPage } from "@/lib/usage-video-types";
import { UsageVideoCard } from "@/components/usage-videos/usage-video-card";
import { UsageVideoForm } from "@/components/usage-videos/usage-video-form";
import { UsageVideoPagination } from "@/components/usage-videos/usage-video-pagination";

export const metadata = { title: "제품 사용법 영상", description: "사용자가 등록한 유튜브 제품 사용법과 채널을 살펴보세요." };

export default async function ProductUsageVideosPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string | string[] }> }) {
  const [{ id }, search, user] = await Promise.all([params, searchParams, getCurrentSession()]);
  const product = await getProduct(id).catch((error) => { if (error instanceof ApiRequestError && error.status === 404) notFound(); throw error; });
  let data = await getProductUsageVideos(id, readUsageVideoPage(search.page), 12);
  if (data.page > 0 && data.page >= data.totalPages) data = await getProductUsageVideos(id, Math.max(0, data.totalPages - 1), 12);
  const basePath = `/products/${encodeURIComponent(id)}/usage-videos`;

  return <div className="container-page pb-28 pt-6 md:pt-10"><Link href={`/products/${encodeURIComponent(id)}#usage-videos`} className="inline-flex min-h-11 items-center gap-2 text-sm text-[#967382]"><ArrowLeft size={16} />제품으로 돌아가기</Link><header className="mb-8 mt-5"><p className="mb-2 text-xs text-[#ae8196]">{product.brand} · {product.name}</p><h1 className="flex items-center gap-2 font-myeongjo text-3xl font-semibold"><Video className="text-[#bd6283]" />영상으로 보는 사용법</h1><p className="mt-3 text-sm leading-7 text-[#8e7482]">사용자가 공유한 제품 사용 팁과 유튜브 채널이에요. 관리자 승인 영상만 표시됩니다.</p><p className="mt-2 text-[11px] leading-6 text-[#a28694]">채널 정보는 등록자가 제공하며 소유권 인증을 의미하지 않아요. 노출 승인은 제품의 효능이나 영상 내용을 보증하지 않아요.</p></header><p className="mb-4 text-sm font-semibold text-[#7a5a6c]">사용법 영상 {data.totalElements}개</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.content.map((video) => <UsageVideoCard key={video.id} video={video} />)}</div>{data.content.length === 0 && <p className="rounded-2xl border border-dashed border-[#e8cedb] py-12 text-center text-sm text-[#a18494]">아직 승인된 사용법 영상이 없어요. 첫 영상을 등록해 보세요.</p>}<UsageVideoPagination data={data} basePath={basePath} /><section className="mt-10 rounded-[24px] border border-[#ead2dd] bg-white p-5 sm:p-7"><h2 className="mb-2 font-myeongjo text-xl font-semibold">내 사용법 영상과 채널 소개하기</h2><p className="mb-5 text-xs leading-6 text-[#9a7c8b]">제품과 관련된 영상을 등록해 주세요. 공개 전 관리자 검토를 거칩니다.</p>{user ? <UsageVideoForm productId={id} /> : <Link href={`/login?returnTo=${encodeURIComponent(basePath)}`} className="ink-btn">로그인하고 영상 등록하기</Link>}{user && <Link href="/my/usage-videos" className="mt-5 inline-flex min-h-11 items-center text-xs font-semibold text-[#ad5576] underline underline-offset-4">내가 등록한 영상 · 검토 상태 관리</Link>}</section></div>;
}
