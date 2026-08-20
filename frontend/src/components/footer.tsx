import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";

const discoverLinks = [
  { href: "/skin-check", label: "1분 피부 체크" },
  { href: "/ranking", label: "내 피부 맞춤 랭킹" },
  { href: "/products", label: "화장품 탐색" },
];

const guideLinks = [
  { href: "/ingredients", label: "성분 사전" },
  { href: "/compare", label: "제품 비교" },
  { href: "/principles", label: "화력의 추천 원칙" },
];

const policyLinks = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
];

const footerLinkClass =
  "group inline-flex min-h-8 w-fit items-center gap-1.5 text-sm text-white/67 transition hover:text-white focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e5a8b9]";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#251a20] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#a94f6a]/16 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#d78da1]/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e7a9ba]/55 to-transparent" />
      </div>

      <div className="container-page relative pb-[calc(8rem+env(safe-area-inset-bottom))] pt-14 sm:pt-16 md:pb-10 md:pt-20">
        <div className="grid gap-11 sm:grid-cols-2 lg:grid-cols-[1.35fr_.72fr_.72fr_1fr] lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="화력 홈">
              <span className="seal h-11 w-11 font-myeongjo text-xl font-bold">화</span>
              <span>
                <strong className="block font-myeongjo text-[26px] font-semibold tracking-[-.08em]">화력</strong>
                <span className="mt-1 block text-[9px] font-bold tracking-[.28em] text-[#e7a9ba]">HWA:RYEOK</span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-[15px] font-medium leading-7 text-white/82">
              내 피부를 이해할수록,<br />화장품 선택은 더 선명해집니다.
            </p>
            <p className="mt-3 max-w-sm text-xs leading-6 text-white/46">
              브랜드의 크기보다 성분과 피부 적합도를 먼저 보는<br className="hidden sm:block" /> 피부 맞춤 화장품 정보 서비스입니다.
            </p>
          </div>

          <FooterLinkGroup title="시작하기" links={discoverLinks} />
          <FooterLinkGroup title="알아보기" links={guideLinks} />

          <div>
            <p className="mb-4 text-[10px] font-bold tracking-[.24em] text-[#e7a9ba]">CONTACT</p>
            <div className="grid gap-2.5">
              <a href="tel:07080272561" className={footerLinkClass}>
                <Phone size={14} aria-hidden="true" /> 070-8027-2561
              </a>
              <a href="mailto:wings2530@gmail.com" className={footerLinkClass}>
                <Mail size={14} aria-hidden="true" /> wings2530@gmail.com
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
              {policyLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-xs font-semibold text-white/58 transition hover:text-white focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e5a8b9]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-7 md:mt-16 md:pt-8">
          <dl className="flex flex-wrap gap-x-6 gap-y-2.5 text-[11px] leading-5 text-white/46">
            <BusinessItem term="상호명" description="파텔" />
            <BusinessItem term="대표자" description="조성민" />
            <BusinessItem term="사업자등록번호" description="715-01-03479" />
            <BusinessItem term="통신판매업신고번호" description="2025-고양덕양구-1028" />
          </dl>
          <p className="mt-3 text-[11px] leading-5 text-white/46">
            <strong className="mr-2 font-semibold text-white/72">사업장 주소</strong>
            서울 강남구 학동로24길 20 (논현동, 창준빌딩) 402호
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/8 pt-6 text-[10px] leading-5 text-white/35 md:flex-row md:items-end md:justify-between">
          <p className="max-w-2xl">화력의 정보는 화장품 선택을 돕기 위한 참고 자료이며 의료적 진단이나 치료를 대신하지 않습니다.</p>
          <p className="shrink-0">© 2026 HWA:RYEOK. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="mb-4 text-[10px] font-bold tracking-[.24em] text-[#e7a9ba]">{title}</p>
      <nav aria-label={`${title} 푸터 메뉴`} className="grid gap-2.5">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className={footerLinkClass}>
            {item.label}
            <ArrowUpRight size={12} className="opacity-0 transition group-hover:opacity-70" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </div>
  );
}

function BusinessItem({ term, description }: { term: string; description: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-semibold text-white/72">{term}</dt>
      <dd>{description}</dd>
    </div>
  );
}
