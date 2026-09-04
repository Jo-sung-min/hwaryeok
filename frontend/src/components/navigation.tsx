"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, BarChart3, Heart, Home, Megaphone, Search, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  { href: "/promotions", label: "화력 추천", sponsored: true },
  { href: "/products", label: "화장품" },
  { href: "/skin-check", label: "피부 체크" },
  { href: "/ranking", label: "맞춤 랭킹" },
  { href: "/ingredients", label: "성분 사전" },
];

const mobileHeaderNav = [
  { href: "/", label: "홈" },
  { href: "/promotions", label: "추천" },
  { href: "/products", label: "화장품" },
  { href: "/skin-check", label: "피부체크" },
  { href: "/ingredients", label: "성분" },
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
            <span className="ml-2 text-[8px] font-bold tracking-[.24em] text-[#b96a80]">HWA:RYEOK</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex" aria-label="주요 메뉴">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined} className="glass-nav-item relative rounded-full px-3.5 py-2 text-sm transition">
              {item.label}{item.sponsored && <span className="ml-1 align-top text-[8px] font-bold text-[#bf4d6c]">AD</span>}
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
  { href: "/promotions", label: "추천", icon: Megaphone },
  { href: "/products", label: "탐색", icon: Search },
  { href: "/ranking", label: "랭킹", icon: BarChart3 },
  { href: "/my", label: "MY", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  function closeSearch() {
    setSearchOpen(false);
    window.setTimeout(() => searchToggleRef.current?.focus(), 0);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    const search = normalizedQuery ? `?${new URLSearchParams({ query: normalizedQuery })}` : "";
    setSearchOpen(false);
    router.push(`/products${search}`);
  }

  return (
    <nav className="site-glass mobile-bottom-nav fixed inset-x-3 z-50 h-[70px] overflow-hidden rounded-[28px] px-2 md:hidden" aria-label="모바일 메뉴">
      {searchOpen ? (
        <form id="mobile-product-search" role="search" aria-label="화장품 검색" onSubmit={submitSearch} onKeyDown={(event) => { if (event.key === "Escape") closeSearch(); }} className="flex h-full w-full items-center gap-1.5 px-1">
          <button type="submit" aria-label="입력한 화장품 검색" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff0f4] text-[#b44768]">
            <Search size={20} strokeWidth={2.4} />
          </button>
          <div className="mobile-bottom-search-field flex h-12 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-[#eccbd5] bg-white">
            <label htmlFor="mobile-product-query" className="sr-only">검색할 제품명 또는 브랜드</label>
            <input ref={searchInputRef} id="mobile-product-query" name="query" value={query} onChange={(event) => setQuery(event.target.value)} enterKeyHint="search" autoComplete="off" placeholder="제품명·브랜드" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base font-medium text-[#3d3337] outline-none placeholder:text-[#aa9299]" />
            <button type="submit" aria-label="검색하기" className="mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#cf5b7d] text-white">
              <ArrowRight size={17} />
            </button>
          </div>
          <button type="button" onClick={closeSearch} aria-label="검색 닫기" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#8e727a] transition active:bg-[#fff0f4]">
            <X size={19} />
          </button>
        </form>
      ) : (
        <div className="grid h-full grid-cols-5">
          {mobileNav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const className = `group flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] transition ${active ? "font-bold text-[#aa4261]" : "font-semibold text-[#817278]"}`;
            const content = <><span className={`grid h-9 min-w-11 place-items-center rounded-full transition ${active ? "bg-[#fff0f4]" : "group-active:bg-[#fff7f9]"}`}><Icon size={19} strokeWidth={active ? 2.5 : 1.9} /></span>{label}</>;

            if (href === "/products") {
              return <button ref={searchToggleRef} key={href} type="button" aria-current={active ? "page" : undefined} aria-expanded="false" aria-controls="mobile-product-search" onClick={() => setSearchOpen(true)} className={className}>{content}</button>;
            }

            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={className}>{content}</Link>;
          })}
        </div>
      )}
    </nav>
  );
}
