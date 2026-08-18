"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Heart, Home, Search, Sparkles, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/products", label: "화장품" },
  { href: "/ranking", label: "화력 랭킹" },
  { href: "/experts", label: "전문가" },
  { href: "/ingredients", label: "성분 사전" },
  { href: "/compare", label: "비교하기" },
];

const mobileHeaderNav = [
  { href: "/", label: "홈" },
  { href: "/products", label: "화장품" },
  { href: "/experts", label: "전문가" },
  { href: "/ingredients", label: "성분" },
  { href: "/compare", label: "비교" },
];

export function Header({ authSlot }: { authSlot?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 bg-transparent p-2 md:border-b md:border-[#e9a9b522] md:bg-white/85 md:p-0 md:backdrop-blur-xl">
      <div className="mobile-glass-header mx-auto flex h-14 w-full items-center gap-2 rounded-[22px] border border-white/90 bg-white/70 px-2 shadow-[0_12px_32px_rgba(170,93,112,.14)] backdrop-blur-2xl md:hidden">
        <Link href="/" className="seal h-10 w-10 shrink-0 font-myeongjo text-lg font-bold" aria-label="화력 홈">화</Link>
        <nav className="grid min-w-0 flex-1 grid-cols-5 gap-0.5" aria-label="모바일 상단 메뉴">
          {mobileHeaderNav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`grid min-h-10 min-w-0 place-items-center rounded-full px-1 text-[10px] font-semibold transition ${active ? "bg-white text-[#a54f63] shadow-[0_5px_14px_rgba(169,87,106,.14)]" : "text-[#746269] active:bg-white/65"}`}>{item.label}</Link>;
          })}
        </nav>
      </div>

      <div className="container-page hidden h-[74px] items-center justify-between md:flex">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 md:gap-3" aria-label="화력 홈">
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
          {authSlot}
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
    <nav className="mobile-bottom-nav fixed inset-x-3 z-50 grid h-[62px] grid-cols-5 rounded-[26px] border border-white/90 bg-white/76 px-2 shadow-[0_12px_34px_rgba(117,66,80,.18)] backdrop-blur-2xl md:hidden" aria-label="모바일 메뉴">
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] transition ${active ? "font-bold text-[#a54f63]" : "text-[#76656b]"}`}><span className={`grid h-8 min-w-10 place-items-center rounded-full transition ${active ? "bg-[#f9dce3]" : "group-active:bg-[#f8e6ea]"}`}><Icon size={18} strokeWidth={active ? 2.5 : 1.8} /></span>{label}</Link>;
      })}
    </nav>
  );
}
