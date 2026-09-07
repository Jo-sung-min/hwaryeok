"use client";

export default function Error({ reset }: { reset: () => void }) {
  return <div className="container-page py-20 text-center"><h1 className="text-xl font-bold">리뷰어 정보를 잠시 불러오지 못했어요</h1><p className="mt-3 text-sm text-[#947c86]">잠시 후 다시 확인해 주세요.</p><button className="line-btn mt-6" onClick={reset}>다시 불러오기</button></div>;
}
