import { getFeaturedIngredients, getUserPreferredIngredients, getUserSkinProfile } from "@/lib/api";
import { readAuthTokens, requireSession } from "@/lib/auth-session";
import { SkinProfileForm } from "./skin-profile-form";

type ProfileSearchParams = Promise<{ from?: string | string[] }>;

export default async function ProfilePage({ searchParams }: { searchParams: ProfileSearchParams }) {
  const params = await searchParams;
  const source = Array.isArray(params.from) ? params.from[0] : params.from;
  const user = await requireSession("/profile");
  const { accessToken } = await readAuthTokens();
  const [profile, ingredients, preferredIngredients] = accessToken
    ? await Promise.all([
        getUserSkinProfile(accessToken),
        getFeaturedIngredients(10),
        getUserPreferredIngredients(accessToken),
      ])
    : [null, [], { content: [], totalElements: 0 }];

  return (
    <SkinProfileForm
      nickname={user.nickname}
      initialProfile={profile}
      ingredients={ingredients}
      initialPreferredIngredientIds={preferredIngredients.content.map((item) => item.ingredient.id)}
      importQuickProfile={source === "quick"}
    />
  );
}
