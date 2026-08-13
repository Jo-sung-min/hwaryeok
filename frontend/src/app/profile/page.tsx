import { getUserSkinProfile } from "@/lib/api";
import { readAuthTokens, requireSession } from "@/lib/auth-session";
import { SkinProfileForm } from "./skin-profile-form";

export default async function ProfilePage() {
  const user = await requireSession("/profile");
  const { accessToken } = await readAuthTokens();
  const profile = accessToken ? await getUserSkinProfile(accessToken) : null;

  return <SkinProfileForm nickname={user.nickname} initialProfile={profile} />;
}
