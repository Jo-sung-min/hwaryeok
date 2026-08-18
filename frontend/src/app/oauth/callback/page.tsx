import Link from "next/link";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { sanitizeReturnTo } from "@/lib/auth-session";

const errorMessages: Record<string, string> = {
  invalid_provider: "지원하지 않는 로그인 방식이에요.",
  provider_not_configured: "아직 해당 로그인이 설정되지 않았어요.",
  backend_unavailable: "로그인 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.",
  email_not_verified: "확인된 이메일 제공에 동의해야 로그인할 수 있어요.",
  email_required: "로그인 제공자에서 이메일 제공에 동의해 주세요.",
  email_already_exists: "같은 이메일의 화력 계정이 있어요. 기존 로그인 후 계정 연결이 필요해요.",
  account_unavailable: "현재 사용할 수 없는 계정이에요.",
  account_not_found: "연결된 화력 계정을 찾지 못했어요.",
  oauth_failed: "간편 로그인을 완료하지 못했어요. 다시 시도해 주세요.",
};

const providerNames: Record<string, string> = { google: "Google", kakao: "카카오", naver: "네이버" };

export default async function OAuthCallbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const success = params.status === "success";
  const provider = typeof params.provider === "string" ? params.provider : "";
  const error = typeof params.error === "string" ? params.error : "oauth_failed";
  const newUser = params.newUser === "true";
  const returnTo = sanitizeReturnTo(typeof params.returnTo === "string" ? params.returnTo : undefined);

  return (
    <div className="grid min-h-[calc(100vh-72px)] place-items-center bg-[#fff1f4] px-5 py-12 md:min-h-[calc(100vh-74px)]">
      <section className="paper-card w-full max-w-lg rounded-[30px] p-8 text-center md:p-11" role="status">
        {success ? <CheckCircle2 className="mx-auto text-[#778474]" size={52} strokeWidth={1.5} /> : <AlertCircle className="mx-auto text-[#a54f49]" size={52} strokeWidth={1.5} />}
        <p className="eyebrow mb-3 mt-7">{success ? "LOGIN COMPLETE" : "LOGIN PAUSED"}</p>
        <h1 className="font-myeongjo text-3xl font-semibold">{success ? `${providerNames[provider] ?? "간편"} 로그인 완료` : "로그인을 마치지 못했어요"}</h1>
        <p className="mt-4 text-sm leading-7 text-[#756960]">
          {success ? (newUser ? "새 화력 계정이 만들어졌어요. 이제 피부 정보를 등록하고 맞춤 분석을 시작해 보세요." : "기존 화력 계정과 안전하게 연결됐어요. 저장한 기록을 이어볼 수 있어요.") : (errorMessages[error] ?? errorMessages.oauth_failed)}
        </p>
        {success ? (
          <Link href={returnTo} className="ink-btn mt-8 w-full"><Sparkles size={17} /> {returnTo === "/profile" ? "피부 프로필로 이동" : "계속하기"}</Link>
        ) : (
          <Link href="/login" className="ink-btn mt-8 w-full">간편 로그인 다시 시도</Link>
        )}
        <Link href="/products" className="mt-5 inline-flex text-xs font-semibold text-[#8d6155]">화장품 둘러보기</Link>
      </section>
    </div>
  );
}
