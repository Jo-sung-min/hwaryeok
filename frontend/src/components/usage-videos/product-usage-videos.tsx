import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";
import { getCurrentSession } from "@/lib/auth-session";
import { getProductUsageVideos } from "@/lib/usage-video-api";
import { UsageVideoCard } from "./usage-video-card";
import { UsageVideoForm } from "./usage-video-form";

export async function ProductUsageVideos({ productId }: { productId: string }) {
  const [user, result] = await Promise.all([getCurrentSession(), getProductUsageVideos(productId, 0, 3).then((data) => ({ data, error: false })).catch(() => ({ data: null, error: true }))]);
  const returnTo = `/products/${encodeURIComponent(productId)}/usage-videos`;
  return <section id="usage-videos" className="mt-10 scroll-mt-28 rounded-[26px] border border-[#ebd2dc] bg-white p-5 sm:p-7">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="mb-2 text-[10px] font-bold tracking-[.16em] text-[#bd6382]">HOW TO USE</p><h2 className="flex items-center gap-2 font-myeongjo text-2xl font-semibold"><Video size={21} className="text-[#bd6382]" /> 영상으로 보는 사용법</h2><p className="mt-2 text-xs leading-6 text-[#8a7580]">사용자가 소개하는 사용법과 유튜브 채널을 만나보세요. 관리자 승인 영상만 노출돼요.</p></div>{result.data && result.data.totalElements > 0 && <Link href={returnTo} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#ac5171]">전체보기 ({result.data.totalElements}) <ArrowRight size={14} /></Link>}</header>
    {result.error ? <p role="status" className="rounded-xl bg-[#fff5f8] p-5 text-sm leading-6 text-[#987383]">사용법 영상을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p> : result.data?.content.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{result.data.content.map((video) => <UsageVideoCard key={video.id} video={video} />)}</div> : <div className="rounded-2xl border border-dashed border-[#e6cad6] bg-[#fffafd] px-5 py-8 text-center"><Video size={25} className="mx-auto mb-3 text-[#d39ab0]" /><p className="text-sm font-semibold text-[#7c5b6b]">첫 사용법 영상을 기다리고 있어요</p><p className="mt-2 text-xs leading-6 text-[#a08091]">직접 만든 영상으로 사용 팁을 나누고 채널을 소개해 보세요.</p></div>}
    <div className="mt-5 border-t border-[#f1e0e7] pt-5">{user ? <details className="group"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#ad4f72]">내 유튜브 사용법 영상 등록하기 <span className="text-xl font-normal group-open:rotate-45">+</span></summary><div className="pt-4"><UsageVideoForm productId={productId} /></div></details> : <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="line-btn w-full sm:w-auto">로그인하고 내 영상 등록하기 <ArrowRight size={14} /></Link>}{user && <Link href="/my/usage-videos" className="mt-2 inline-flex min-h-10 items-center text-xs text-[#917581] underline underline-offset-4">내가 등록한 영상 · 검토 상태 관리</Link>}<p className="mt-2 text-[10px] leading-5 text-[#a18a95]">등록자가 제공한 채널 정보이며 채널 소유권 인증을 의미하지 않아요. 노출 승인은 제품의 효능이나 영상 내용을 보증하지 않아요.</p></div>
  </section>;
}
