import Link from "next/link";
import type { OAuthProviderStatus } from "@/lib/api";

const providerStyles = {
  kakao: { label: "카카오로 시작", className: "border-[#f3d900] bg-[#fee500] text-[#191919]" },
  naver: { label: "네이버로 시작", className: "border-[#03b75a] bg-[#03c75a] text-white" },
  google: { label: "Google로 시작", className: "border-[#dadce0] bg-white text-[#3c4043]" },
} as const;

function KakaoTalkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-5 w-5" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.85 5.34 4.65 6.75l-.94 3.48a.46.46 0 0 0 .7.5l4.15-2.75c.47.06.95.09 1.44.09 5.52 0 10-3.59 10-8.07S17.52 3 12 3Z" />
    </svg>
  );
}

export function SocialLoginButtons({ providers, returnTo }: { providers: OAuthProviderStatus[]; returnTo?: string }) {
  const visibleProviders = providers.filter((provider) => provider.id === "kakao");

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      {visibleProviders.map((provider) => {
        const style = providerStyles[provider.id];
        const content = (
          <>
            <span className="absolute left-4 grid h-7 w-7 place-items-center text-[#191919]"><KakaoTalkIcon /></span>
            <span className="min-w-0 text-center leading-5">{style.label}</span>
            {!provider.configured && <span className="absolute right-3 shrink-0 whitespace-nowrap rounded-full bg-black/8 px-2 py-1 text-[10px] font-semibold">설정 중</span>}
          </>
        );

        return provider.configured ? (
          <Link key={provider.id} href={`/api/auth/oauth/${provider.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`} className={`relative flex min-h-13 min-w-0 items-center justify-center rounded-2xl border px-12 text-[13px] font-semibold transition hover:-translate-y-0.5 hover:shadow-md sm:text-sm ${style.className}`}>
            {content}
          </Link>
        ) : (
          <span key={provider.id} aria-disabled="true" className={`relative flex min-h-13 min-w-0 cursor-not-allowed items-center justify-center rounded-2xl border px-12 text-[13px] font-semibold opacity-75 sm:text-sm ${style.className}`}>
            {content}
          </span>
        );
      })}
      {!visibleProviders.some((provider) => provider.configured) && (
        <p className="text-center text-[11px] leading-5 text-[#8a7d74]">카카오 앱 키를 설정하면 간편 로그인이 활성화돼요.</p>
      )}
    </div>
  );
}
