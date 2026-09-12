import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFeaturedIngredients, getSkinTypeStatistics, getUserPreferredIngredients, getUserSkinProfile, type SkinProfile } from "@/lib/api";
import { getCurrentSession, readAuthTokens } from "@/lib/auth-session";
import { QuickSkinCheck } from "./quick-skin-check";

export const metadata: Metadata = {
  title: "나의 성분찾기",
  description: "피부 상태와 생활 습관, 잘 맞았던 성분을 함께 살펴보고 나의 피부 경향과 맞춤 성분을 확인하세요.",
  alternates: { canonical: "/skin-check" },
};

export default async function SkinCheckPage({ searchParams }: PageProps<"/skin-check">) {
  const [search, statistics, featuredIngredients, session, tokens] = await Promise.all([
    searchParams,
    getSkinTypeStatistics().catch(() => null),
    getFeaturedIngredients(10).catch(() => []),
    getCurrentSession(),
    readAuthTokens(),
  ]);
  const requestedStep = typeof search.step === "string" && (/^\d+$/.test(search.step) || search.step === "review" || search.step === "result")
    ? search.step
    : null;
  const returnTo = `/skin-check${requestedStep ? `?step=${encodeURIComponent(requestedStep)}` : ""}`;
  if (!session && tokens.refreshToken) {
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`);
  }
  let initialProfile: SkinProfile | null = null;
  let initialProfileAvailable = true;
  let preferred: Awaited<ReturnType<typeof getUserPreferredIngredients>> | null = null;
  if (session && tokens.accessToken) {
    const [profileResult, preferredResult] = await Promise.allSettled([
      getUserSkinProfile(tokens.accessToken),
      getUserPreferredIngredients(tokens.accessToken),
    ]);
    if (profileResult.status === "fulfilled") initialProfile = profileResult.value;
    else initialProfileAvailable = false;
    if (preferredResult.status === "fulfilled") preferred = preferredResult.value;
  }
  const ingredients = [...new Map([
    ...featuredIngredients,
    ...(preferred?.content.map(({ ingredient }) => ingredient) ?? []),
  ].map((ingredient) => [ingredient.id, ingredient])).values()];

  return <QuickSkinCheck
    statistics={statistics}
    initialProfile={initialProfile}
    initialProfileAvailable={initialProfileAvailable}
    ingredients={ingredients}
    initialPreferredIngredientIds={session && preferred === null ? null : preferred?.content.map(({ ingredient }) => ingredient.id) ?? []}
    isAuthenticated={Boolean(session)}
    draftOwnerId={session?.id ?? null}
  />;
}
