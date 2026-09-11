"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { BarChart3, UsersRound, Sparkles, TrendingUp } from "lucide-react";
import styles from "./ranking-tabs.module.css";

type RankingTabKey = "products" | "reviewers" | "personal" | "rising";

const rankingTabs = [
  { key: "personal", href: "/ranking/personal", label: "내 피부 랭킹", icon: Sparkles },
  { key: "products", href: "/ranking", label: "성분별 랭킹", icon: BarChart3 },
  { key: "rising", href: "/ranking/rising", label: "급상승 랭킹", icon: TrendingUp },
  { key: "reviewers", href: "/reviewers", label: "리뷰어 랭킹", icon: UsersRound },
] satisfies ReadonlyArray<{ key: RankingTabKey; href: string; label: string; icon: typeof Sparkles }>;

function PendingIndicator() {
  const { pending } = useLinkStatus();

  return <span className={styles.pending} data-pending={pending ? "true" : undefined} aria-hidden="true" />;
}

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function currentRankingTab(pathname: string): RankingTabKey {
  if (matchesRoute(pathname, "/ranking/personal")) return "personal";
  if (matchesRoute(pathname, "/ranking/rising")) return "rising";
  if (matchesRoute(pathname, "/reviewers")) return "reviewers";
  return "products";
}

export function RankingTabs() {
  const pathname = usePathname();
  const active = currentRankingTab(pathname);
  const railRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    const tab = activeTabRef.current;
    if (!rail || !tab || rail.scrollWidth <= rail.clientWidth) return;

    const left = tab.offsetLeft - (rail.clientWidth - tab.clientWidth) / 2;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    rail.scrollTo({ left: Math.max(0, left), behavior });
  }, [active]);

  return <nav aria-label="랭킹 종류" className={styles.nav}>
    <div ref={railRef} className={styles.rail}>
      {rankingTabs.map(({ key, href, label, icon: Icon }) => {
        const isActive = active === key;

        return <Link
          key={key}
          ref={isActive ? activeTabRef : undefined}
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={styles.tab}
          onClick={isActive ? (event) => {
            if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) event.preventDefault();
          } : undefined}
        >
          <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
          <span>{label}</span>
          <PendingIndicator />
        </Link>;
      })}
    </div>
  </nav>;
}
