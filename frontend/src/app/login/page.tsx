import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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
  const kakaoProviders = providers.filter((provider) => provider.id === "kakao");

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#fff8fa] px-3 py-7 sm:px-5 sm:py-10 md:min-h-[calc(100vh-74px)] md:py-14">
      <div className="mx-auto min-w-0 max-w-md">
        <Link href="/" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> 홈으로</Link>
        <section className="min-w-0 rounded-[28px] border border-[#eadde1] bg-white p-5 shadow-[0_18px_50px_rgba(88,48,61,0.07)] sm:p-8">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-[#b04c70]">HWARYEOK</p>
            <h1 className="font-myeongjo text-[28px] font-semibold leading-tight sm:text-3xl">화력에 로그인</h1>
            <p className="mb-8 mt-3 text-sm leading-7 text-[#756960]">카카오 또는 사이트 이메일로 간단하게 시작하세요.</p>
          </div>

          {(sessionExpired || loggedOut) && (
            <p className="mb-5 rounded-2xl bg-[#f4eadc] px-4 py-3 text-center text-xs text-[#756960]" role="status">
              {sessionExpired ? "로그인 시간이 만료되었어요. 다시 로그인해 주세요." : "안전하게 로그아웃했어요."}
            </p>
          )}

          <div aria-labelledby="kakao-login-heading">
            <h2 id="kakao-login-heading" className="mb-3 text-xs font-bold text-[#665b55]">카카오 로그인</h2>
            <SocialLoginButtons providers={kakaoProviders} returnTo={returnTo} />
          </div>

          <div className="my-7 flex items-center gap-4" aria-hidden="true"><span className="h-px flex-1 bg-[#74513f18]" /><span className="text-[11px] text-[#96887e]">또는</span><span className="h-px flex-1 bg-[#74513f18]" /></div>

          <div aria-labelledby="email-login-heading">
            <h2 id="email-login-heading" className="mb-4 text-xs font-bold text-[#665b55]">사이트 이메일 로그인</h2>
            <LoginForm returnTo={returnTo} />
          </div>

          <div className="mt-7 flex items-start gap-2 border-t border-[#eee3e6] pt-5 text-[11px] leading-5 text-[#81736a]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#9a7d87]" />로그인 정보는 안전한 보안 쿠키로 보호해요.</div>
          <p className="mt-5 text-center text-xs text-[#81736a]">처음 오셨나요? <Link href="/signup" className="font-semibold text-[#9b4a45]">이메일로 회원가입</Link></p>
        </section>
      </div>
    </div>
  );
}
