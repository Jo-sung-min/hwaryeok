"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

export default function ProductsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("제품 목록을 불러오지 못했습니다.", error);
  }, [error]);

  return (
    <div className="container-page grid min-h-[65vh] place-items-center py-16">
      <div className="paper-card max-w-lg rounded-[30px] px-7 py-14 text-center md:px-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#a54f4910] text-[#9b4a45]"><WifiOff size={24} /></span>
        <h1 className="mt-6 font-myeongjo text-2xl font-semibold">화장품 정보를 불러오지 못했어요.</h1>
        <p className="mt-3 text-sm leading-7 text-[#796c63]">잠시 후 다시 시도해주세요. 개발 환경에서는 Spring Boot 서버가 실행 중인지 확인해주세요.</p>
        <button onClick={() => retry()} className="ink-btn mt-7"><RefreshCw size={16} /> 다시 시도</button>
      </div>
    </div>
  );
}
