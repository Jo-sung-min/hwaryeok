import Link from "next/link";
import type { OAuthProviderStatus } from "@/lib/api";

const providerStyles = {
  kakao: { mark: "K", label: "카카오로 시작", className: "border-[#f3d900] bg-[#fee500] text-[#191919]" },
  naver: { mark: "N", label: "네이버로 시작", className: "border-[#03b75a] bg-[#03c75a] text-white" },
  google: { mark: "G", label: "Google로 시작", className: "border-[#dadce0] bg-white text-[#3c4043]" },
} as const;

export function SocialLoginButtons({ providers, returnTo }: { providers: OAuthProviderStatus[]; returnTo?: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      {providers.map((provider) => {
        const style = providerStyles[provider.id];
        const content = (
          <>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-black ${provider.id === "google" ? "border border-[#dadce0] text-[#4285f4]" : "bg-black/10"}`}>{style.mark}</span>
            <span className="min-w-0 flex-1 leading-5">{style.label}</span>
            {!provider.configured && <span className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-black/8 px-2 py-1 text-[10px] font-semibold">설정 중</span>}
          </>
        );

        return provider.configured ? (
          <Link key={provider.id} href={`/api/auth/oauth/${provider.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`} className={`flex min-h-13 min-w-0 items-center gap-2.5 rounded-2xl border px-3 text-[13px] font-semibold transition hover:-translate-y-0.5 hover:shadow-md sm:gap-3 sm:px-4 sm:text-sm ${style.className}`}>
            {content}
          </Link>
        ) : (
          <span key={provider.id} aria-disabled="true" className={`flex min-h-13 min-w-0 cursor-not-allowed items-center gap-2.5 rounded-2xl border px-3 text-[13px] font-semibold opacity-75 sm:gap-3 sm:px-4 sm:text-sm ${style.className}`}>
            {content}
          </span>
        );
      })}
      {!providers.some((provider) => provider.configured) && (
        <p className="text-center text-[11px] leading-5 text-[#8a7d74]">백엔드 환경변수에 앱 키를 넣으면 해당 버튼이 자동으로 활성화돼요.</p>
      )}
    </div>
  );
}
