import Link from "next/link";
import { ArrowLeft, Leaf, ShieldCheck } from "lucide-react";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { getOAuthProviders } from "@/lib/api";
import { sanitizeReturnTo } from "@/lib/auth-session";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const returnTo = sanitizeReturnTo(typeof params.returnTo === "string" ? params.returnTo : undefined);
  const sessionExpired = params.error === "session_expired";
  const loggedOut = params.loggedOut === "true";
  const providers = await getOAuthProviders();

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#fff1f4] px-5 py-8 md:min-h-[calc(100vh-74px)] md:py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> 홈으로</Link>
        <section className="paper-card relative overflow-hidden rounded-[26px] p-6 sm:rounded-[30px] md:p-10">
          <Leaf className="absolute -right-5 -top-4 text-[#c9826b20]" size={130} strokeWidth={0.7} />
          <div className="relative text-center">
            <span className="seal mx-auto h-14 w-14 font-myeongjo text-xl">화</span>
            <p className="eyebrow mb-3 mt-7">WELCOME BACK</p>
            <h1 className="font-myeongjo text-3xl font-semibold">다시 만난 나의 화력</h1>
            <p className="mb-7 mt-3 text-sm leading-7 text-[#756960]">로그인하고 피부 프로필과 나만의 분석 기록을 안전하게 이어보세요.</p>
          </div>

          {(sessionExpired || loggedOut) && (
            <p className="mb-5 rounded-2xl bg-[#f4eadc] px-4 py-3 text-center text-xs text-[#756960]" role="status">
              {sessionExpired ? "로그인 시간이 만료되었어요. 다시 로그인해 주세요." : "안전하게 로그아웃했어요."}
            </p>
          )}

          <SocialLoginButtons providers={providers} returnTo={returnTo} />
          <div className="my-7 flex items-center gap-4 text-[11px] text-[#96887e]"><span className="h-px flex-1 bg-[#74513f18]" /><span>또는 이메일로 로그인</span><span className="h-px flex-1 bg-[#74513f18]" /></div>
          <LoginForm returnTo={returnTo} />

          <div className="mt-7 flex items-start gap-3 rounded-2xl bg-[#eef1e85c] p-4 text-xs leading-6 text-[#67665d]"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#778474]" />로그인 정보는 브라우저에서 읽을 수 없는 보안 쿠키로 보호해요.</div>
          <p className="mt-7 text-center text-xs text-[#81736a]">처음 오셨나요? <Link href="/signup" className="font-semibold text-[#9b4a45]">이메일로 회원가입</Link></p>
        </section>
      </div>
    </div>
  );
}
