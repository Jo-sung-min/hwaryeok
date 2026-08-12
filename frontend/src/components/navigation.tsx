"use client";

import Link from "next/link";
import { BarChart3, Heart, Home, Search, Sparkles, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/products", label: "화장품" },
  { href: "/ranking", label: "화력 랭킹" },
  { href: "/ingredients", label: "성분 사전" },
  { href: "/compare", label: "비교하기" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-[#76564314] bg-[#fbf7eddf] backdrop-blur-xl">
      <div className="container-page flex h-[74px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="화력 홈">
          <span className="seal h-9 w-9 font-myeongjo text-xl font-bold">화</span>
          <div className="leading-none">
            <strong className="font-myeongjo text-[23px] tracking-[-.08em]">화력</strong>
            <span className="ml-2 text-[8px] font-bold tracking-[.24em] text-[#9b6f60]">HWA:RYEOK</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="주요 메뉴">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={`relative py-2 text-sm transition hover:text-[#a54f49] ${pathname.startsWith(item.href) ? "font-bold text-[#a54f49]" : "text-[#574d46]"}`}>
              {item.label}
              {pathname.startsWith(item.href) && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#a54f49]" />}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/products" aria-label="검색" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-[#815e4d12]"><Search size={18} /></Link>
          <Link href="/my" aria-label="찜" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-[#815e4d12]"><Heart size={18} /></Link>
          <Link href="/my" className="line-btn !min-h-10 !px-4 text-sm"><UserRound size={16} /> 마이화력</Link>
        </div>
      </div>
    </header>
  );
}

const mobileNav = [
  { href: "/", label: "홈", icon: Home },
  { href: "/products", label: "탐색", icon: Search },
  { href: "/profile", label: "분석", icon: Sparkles },
  { href: "/ranking", label: "랭킹", icon: BarChart3 },
  { href: "/my", label: "MY", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid h-[70px] grid-cols-5 border-t border-[#76564320] bg-[#fffaf2ef] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="모바일 메뉴">
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${active ? "font-bold text-[#a54f49]" : "text-[#756960]"}`}><Icon size={19} strokeWidth={active ? 2.4 : 1.8} />{label}</Link>;
      })}
    </nav>
  );
}
