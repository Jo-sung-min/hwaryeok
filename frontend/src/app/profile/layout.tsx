import { LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { requireSession } from "@/lib/auth-session";

export default async function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireSession("/profile");

  return (
    <>
      <div className="border-b border-white/55 bg-white/42 backdrop-blur-xl">
        <div className="container-page flex min-h-12 items-center justify-between gap-3 text-xs text-[#6f625a]">
          <span className="flex min-w-0 items-center gap-2"><UserRound size={15} className="shrink-0 text-[#a54f49]" /><strong className="truncate">{user.nickname}</strong>님의 피부 프로필</span>
          <form action={logoutAction}>
            <button type="submit" className="line-btn !min-h-10 !px-3 text-xs"><LogOut size={14} /> 로그아웃</button>
          </form>
        </div>
      </div>
      {children}
    </>
  );
}
