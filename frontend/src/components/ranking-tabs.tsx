import Link from "next/link";
import { BarChart3, UsersRound } from "lucide-react";

export function RankingTabs({ active }: { active: "products" | "reviewers" }) {
  return <nav aria-label="랭킹 종류" className="flex gap-2 border-b border-[#f0dfe5] pb-3">
    {[{ key: "products", href: "/ranking", label: "성분별 제품 랭킹", icon: BarChart3 }, { key: "reviewers", href: "/reviewers", label: "리뷰어 랭킹", icon: UsersRound }].map(({ key, href, label, icon: Icon }) => <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold sm:px-5 sm:text-sm ${active === key ? "bg-[#fff0f5] text-[#a83f60]" : "text-[#86727a] hover:bg-[#fff8fa]"}`}><Icon size={16} />{label}</Link>)}
  </nav>;
}
