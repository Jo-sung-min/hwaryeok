import Link from "next/link";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentSession } from "@/lib/auth-session";

export async function HeaderAuth() {
  const user = await getCurrentSession();
  if (!user) {
    return <Link href="/login" className="line-btn !min-h-10 !px-4 text-sm"><LogIn size={16} /> 로그인</Link>;
  }
  if (user.role === "ADMIN") {
    return <Link href="/admin" className="line-btn !min-h-10 !max-w-40 !px-4 text-sm"><ShieldCheck size={16} /><span className="truncate">관리</span></Link>;
  }
  return <Link href="/profile" className="line-btn !min-h-10 !max-w-40 !px-4 text-sm"><UserRound size={16} /><span className="truncate">{user.nickname}</span></Link>;
}
