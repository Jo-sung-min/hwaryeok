import Link from "next/link";

export default function IngredientNotFound() {
  return <div className="container-page grid min-h-[65vh] place-items-center py-16"><div className="paper-card max-w-lg rounded-[30px] px-8 py-14 text-center"><span className="text-5xl text-[#d08f7c]">花</span><h1 className="mt-6 font-myeongjo text-2xl font-semibold">성분 정보를 찾을 수 없어요</h1><p className="mt-3 text-sm leading-7 text-[#796c63]">주소가 달라졌거나 아직 등록되지 않은 성분이에요.</p><Link href="/ingredients" className="ink-btn mt-7">성분 사전으로</Link></div></div>;
}
