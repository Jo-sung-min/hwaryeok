import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#dfa6b52b] bg-[#fff1f4] py-14">
      <div className="container-page grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_.75fr_.75fr_.9fr]">
        <div>
          <div className="mb-4 flex items-center gap-3"><span className="seal h-9 w-9 font-myeongjo text-lg">화</span><strong className="font-myeongjo text-2xl">화력</strong></div>
          <p className="max-w-sm text-sm leading-7 text-[#74685f]">내 피부를 더 잘 이해하는 순간,<br />화장품 선택도 한결 선명해집니다.</p>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-[#9b6a5c]">EXPLORE</p>
          <div className="grid gap-3 text-sm text-[#625850]"><Link href="/products">화장품 탐색</Link><Link href="/ranking">화력 랭킹</Link><Link href="/compare">제품 비교</Link></div>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-[#9b6a5c]">MY HWA:RYEOK</p>
          <div className="grid gap-3 text-sm text-[#625850]"><Link href="/profile">피부 분석</Link><Link href="/my">마이화력</Link><Link href="/ingredients">성분 사전</Link></div>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-[#9b6a5c]">GUIDE</p>
          <div className="grid gap-3 text-sm text-[#625850]"><Link href="/principles">화력 읽는 법</Link><Link href="/principles#score-policy">점수 이해하기</Link><Link href="/questions">전문가 Q&amp;A</Link></div>
        </div>
      </div>
      <div className="container-page mt-12 border-t border-[#74513f16] pt-6 text-[11px] leading-5 text-[#897a6f]">© 2026 HWA:RYEOK. 화장품 선택을 돕는 정보 서비스이며 의료적 진단이나 치료를 대신하지 않습니다.</div>
    </footer>
  );
}
