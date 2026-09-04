import Link from "next/link";
import { UserRoundX } from "lucide-react";

export default function ReviewerNotFound() {
  return <div className="container-page grid min-h-[65vh] place-items-center py-16"><div className="paper-card max-w-lg rounded-[30px] px-7 py-14 text-center md:px-12"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff0f4] text-[#b54868]"><UserRoundX size={25} /></span><h1 className="mt-6 font-myeongjo text-2xl font-semibold">리뷰 사용자를 찾을 수 없어요</h1><p className="mt-3 text-sm leading-7 text-[#796c72]">탈퇴했거나 공개할 수 없는 사용자일 수 있어요.</p><Link href="/products" className="ink-btn mt-7">화장품 리뷰 둘러보기</Link></div></div>;
}
