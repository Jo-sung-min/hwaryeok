import Link from "next/link";
import { BarChart3, UsersRound, Sparkles, TrendingUp } from "lucide-react";

export function RankingTabs({ active }: { active: "products" | "reviewers" | "personal" | "rising" }) {
  return <nav aria-label="랭킹 종류" className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-[#f0dfe5] pb-3">
    {[{ key: "personal", href: "/ranking/personal", label: "내 피부 랭킹", icon: Sparkles }, { key: "products", href: "/ranking", label: "성분별 랭킹", icon: BarChart3 }, { key: "rising", href: "/ranking/rising", label: "급상승 랭킹", icon: TrendingUp }, { key: "reviewers", href: "/reviewers", label: "리뷰어 랭킹", icon: UsersRound }].map(({ key, href, label, icon: Icon }) => <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-xs font-bold sm:px-5 sm:text-sm ${active === key ? "bg-[#fff0f5] text-[#a83f60]" : "text-[#86727a] hover:bg-[#fff8fa]"}`}><Icon size={16} />{label}</Link>)}
  </nav>;
}
