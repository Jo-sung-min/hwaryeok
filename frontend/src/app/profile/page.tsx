import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";

export default async function ProfilePage() {
  await requireSession("/profile");
  redirect("/skin-check");
}
