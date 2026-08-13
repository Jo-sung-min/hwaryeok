"use client";

import Link from "next/link";

export default function MyError({ reset }: { reset: () => void }) {
  return (
    <div className="container-page py-24 text-center">
      <span className="text-4xl text-[#d08f7c]">❀</span>
      <h1 className="mt-5 font-myeongjo text-3xl font-semibold">마이화력을 불러오지 못했어요.</h1>
      <p className="mt-3 text-sm text-[#7c6f66]">잠시 후 다시 확인해 주세요. 저장한 찜 데이터는 사라지지 않아요.</p>
      <div className="mt-7 flex justify-center gap-3"><button type="button" onClick={reset} className="ink-btn">다시 시도</button><Link href="/products" className="line-btn">제품 둘러보기</Link></div>
    </div>
  );
}
