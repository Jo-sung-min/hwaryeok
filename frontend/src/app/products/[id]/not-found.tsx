import Link from "next/link";

export default function ProductNotFound() {
  return <div className="container-page grid min-h-[65vh] place-items-center py-16"><div className="paper-card max-w-lg rounded-[30px] px-8 py-14 text-center"><span className="text-4xl text-[#d08f7c]">落</span><h1 className="mt-5 font-myeongjo text-2xl">이 제품은 찾을 수 없어요.</h1><p className="mt-3 text-sm leading-7 text-[#796c63]">주소가 바뀌었거나 더 이상 제공하지 않는 제품일 수 있어요.</p><Link href="/products" className="ink-btn mt-7">화장품 목록으로</Link></div></div>;
}
