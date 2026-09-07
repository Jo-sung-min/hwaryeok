"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, BarChart3, Heart, Home, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./navigation.module.css";

const nav = [
  { href: "/ranking/personal", label: "내 피부 랭킹" },
  { href: "/ranking", label: "성분 랭킹" },
  { href: "/products", label: "화장품" },
  { href: "/reviewers", label: "리뷰어 랭킹" },
  { href: "/ingredients", label: "성분 사전" },
  { href: "/promotions", label: "화력 추천", sponsored: true },
];

function isHeaderActive(pathname: string, href: string) {
  if (href === "/ranking") return pathname.startsWith(href) && !pathname.startsWith("/ranking/personal");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ authSlot }: { authSlot?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className={styles.header}>
      <div className={`container-page ${styles.headerInner}`}>
        <Link href="/" className={styles.brand} aria-label="화력 홈">
          <span className={styles.brandMark} aria-hidden="true">화</span>
          <span className={styles.brandName}>화력</span>
          <span className={styles.brandDescription}>나에게 맞는 성분의 발견</span>
        </Link>
        <nav className={`scrollbar-hide ${styles.primaryNav}`} aria-label="주요 메뉴">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isHeaderActive(pathname, item.href) ? "page" : undefined} className={styles.navLink}>
              {item.label}{item.sponsored && <span className={styles.adLabel}>AD</span>}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <Link href="/skin-check" className={styles.skinLink} aria-current={pathname.startsWith("/skin-check") ? "page" : undefined}>
            <SlidersHorizontal size={16} aria-hidden="true" /> 내 피부 맞춤
          </Link>
          <Link href="/my" aria-label="찜한 제품" className={styles.favoriteLink}><Heart size={19} /></Link>
          {authSlot}
        </div>
      </div>
    </header>
  );
}

const mobileNav = [
  { href: "/", label: "홈", icon: Home },
  { href: "/ranking", label: "랭킹", icon: BarChart3 },
  { href: "/skin-check", label: "내 피부", icon: SlidersHorizontal },
  { href: "/products", label: "탐색", icon: Search },
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
    <nav className={styles.bottomNav} aria-label="모바일 메뉴">
      {searchOpen ? (
        <form id="mobile-product-search" role="search" aria-label="화장품 검색" onSubmit={submitSearch} onKeyDown={(event) => { if (event.key === "Escape") closeSearch(); }} className={styles.searchForm}>
          <Search size={20} aria-hidden="true" />
          <div className={styles.searchField}>
            <label htmlFor="mobile-product-query" className="sr-only">검색할 제품명 또는 브랜드</label>
            <input ref={searchInputRef} id="mobile-product-query" name="query" value={query} onChange={(event) => setQuery(event.target.value)} enterKeyHint="search" autoComplete="off" placeholder="제품명·브랜드 검색" />
            <button type="submit" aria-label="검색하기" className={styles.searchSubmit}><ArrowRight size={18} /></button>
          </div>
          <button type="button" onClick={closeSearch} aria-label="검색 닫기" className={styles.searchClose}><X size={20} /></button>
        </form>
      ) : (
        <div className={styles.bottomItems}>
          {mobileNav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const className = `${styles.bottomItem} ${href === "/skin-check" ? styles.personalItem : ""}`;
            const content = <><span className={styles.bottomIcon}><Icon size={21} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" /></span>{label}</>;

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
