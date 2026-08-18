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
    <header className="sticky top-0 z-50 bg-transparent p-2 md:px-3 md:py-2.5">
      <div className="site-glass mobile-glass-header mx-auto flex h-14 w-full items-center gap-2 rounded-[22px] px-2 md:hidden">
        <Link href="/" className="seal h-10 w-10 shrink-0 font-myeongjo text-lg font-bold" aria-label="화력 홈">화</Link>
        <nav className="grid min-w-0 flex-1 grid-cols-5 gap-0.5" aria-label="모바일 상단 메뉴">
          {mobileHeaderNav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="glass-nav-item grid min-h-11 min-w-0 place-items-center rounded-full px-1 text-[11px] font-bold transition">{item.label}</Link>;
          })}
        </nav>
      </div>

      <div className="site-glass container-page hidden h-[64px] items-center justify-between rounded-[24px] px-5 md:flex">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 md:gap-3" aria-label="화력 홈">
          <span className="seal h-9 w-9 font-myeongjo text-xl font-bold">화</span>
          <div className="leading-none">
            <strong className="font-myeongjo text-[23px] tracking-[-.08em]">화력</strong>
            <span className="ml-2 text-[8px] font-bold tracking-[.24em] text-white/55">HWA:RYEOK</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex" aria-label="주요 메뉴">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined} className="glass-nav-item relative rounded-full px-3.5 py-2 text-sm transition">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/products" aria-label="검색" className="glass-nav-item grid h-10 w-10 place-items-center rounded-full transition"><Search size={18} /></Link>
          <Link href="/my" aria-label="찜" className="glass-nav-item grid h-10 w-10 place-items-center rounded-full transition"><Heart size={18} /></Link>
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
    <nav className="site-glass mobile-bottom-nav fixed inset-x-3 z-50 grid h-[70px] grid-cols-5 rounded-[28px] px-2 md:hidden" aria-label="모바일 메뉴">
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] transition ${active ? "font-bold text-white" : "font-semibold text-white/75"}`}><span className={`grid h-9 min-w-11 place-items-center rounded-full transition ${active ? "bg-white/16 shadow-[inset_0_1px_rgba(255,255,255,.18)]" : "group-active:bg-white/10"}`}><Icon size={19} strokeWidth={active ? 2.5 : 1.9} /></span>{label}</Link>;
      })}
    </nav>
  );
}
