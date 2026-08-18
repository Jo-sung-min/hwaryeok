import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#dfa6b52b] bg-[#fff1f4] py-14">
      <div className="container-page grid gap-10 md:grid-cols-[1.2fr_.8fr_.8fr]">
        <div>
          <div className="mb-4 flex items-center gap-3"><span className="seal h-9 w-9 font-myeongjo text-lg">화</span><strong className="font-myeongjo text-2xl">화력</strong></div>
          <p className="max-w-sm text-sm leading-7 text-[#74685f]">평점보다 내 피부와의 궁합을 먼저 봅니다.<br />화장품의 힘을 나에게 맞는 언어로 읽어드려요.</p>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-[#9b6a5c]">EXPLORE</p>
          <div className="grid gap-3 text-sm text-[#625850]"><Link href="/products">화장품 탐색</Link><Link href="/ranking">화력 랭킹</Link><Link href="/compare">제품 비교</Link></div>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-[#9b6a5c]">MY HWA:RYEOK</p>
          <div className="grid gap-3 text-sm text-[#625850]"><Link href="/profile">피부 분석</Link><Link href="/my">마이화력</Link><Link href="/ingredients">성분 사전</Link></div>
        </div>
      </div>
      <div className="container-page mt-12 border-t border-[#74513f16] pt-6 text-[11px] text-[#897a6f]">© 2026 HWA:RYEOK. 화장품의 힘을 읽다.</div>
    </footer>
  );
}
