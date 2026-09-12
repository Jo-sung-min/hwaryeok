import Link from "next/link";
import { ChevronDown, Mail, Phone } from "lucide-react";

const footerLinks = [
  { href: "/compare", label: "제품 비교" },
  { href: "/principles", label: "추천 기준" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
];

export function Footer() {
  return (
    <footer className="border-t border-[#ece7eb] bg-[#fcfbfc] text-[#353039]">
      <div className="container-page py-7">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex shrink-0 items-center gap-2.5" aria-label="화력 홈">
            <span className="seal h-9 w-9 font-myeongjo text-base font-bold">화</span>
            <strong className="font-myeongjo text-xl font-semibold tracking-[-.06em]">화력</strong>
          </Link>
          <span className="h-4 w-px bg-[#ddd5db]" aria-hidden="true" />
          <p className="min-w-0 text-xs leading-5 text-[#756b73]">화장품의 기준을, 내 피부로.</p>
        </div>

        <nav aria-label="푸터 메뉴" className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-y border-[#ebe5ea] py-2.5">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex min-h-8 items-center text-[11px] font-medium text-[#7e737b] hover:text-[#a64264] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d98ca6]">
              {item.label}
            </Link>
          ))}
        </nav>

        <details className="group border-b border-[#ebe5ea] py-1.5">
          <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between text-[11px] font-medium text-[#81767e] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d98ca6] [&::-webkit-details-marker]:hidden">
            사업자·고객센터 정보
            <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="grid gap-3 pb-2 pt-3 text-[11px] leading-5 text-[#847980] sm:grid-cols-2">
            <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1">
              <dt>상호명</dt><dd>루체</dd>
              <dt>대표자</dt><dd>조성민</dd>
              <dt>사업자등록번호</dt><dd>715-01-03479</dd>
              <dt>통신판매업</dt><dd>2025-고양덕양구-1028</dd>
            </dl>
            <div>
              <p>서울 강남구 학동로24길 20<br />창준빌딩 402호</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <a href="tel:07080272561" className="inline-flex min-h-7 items-center gap-1.5"><Phone size={12} aria-hidden="true" />070-8027-2561</a>
                <a href="mailto:wings2530@gmail.com" className="inline-flex min-h-7 items-center gap-1.5"><Mail size={12} aria-hidden="true" />wings2530@gmail.com</a>
              </div>
            </div>
          </div>
        </details>

        <p className="mt-4 text-[10px] leading-5 text-[#978d94]">© 2026 HWA:RYEOK</p>
      </div>
    </footer>
  );
}
