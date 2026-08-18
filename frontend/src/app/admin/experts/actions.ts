"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, getCurrentUser, verifyExpertApplication } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export async function reviewExpertAction(expertId: string, formData: FormData) {
  const token = await getActionAccessToken();
  if (!token) throw new Error("관리자 로그인이 필요해요.");
  const user = await getCurrentUser(token);
  if (user.role !== "ADMIN") throw new Error("관리자 권한이 필요해요.");
  const decision = String(formData.get("decision"));
  try {
    await verifyExpertApplication(token, expertId, {
      status: decision === "approve" ? "VERIFIED" : "REJECTED",
      doctorVerified: decision === "approve" && formData.get("doctorVerified") === "on",
      specialistVerified: decision === "approve" && formData.get("specialistVerified") === "on",
      workplaceVerified: decision === "approve" && formData.get("workplaceVerified") === "on",
    });
    revalidatePath("/admin/experts");
    revalidatePath("/experts");
  } catch (error) {
    throw new Error(error instanceof ApiRequestError ? error.message : "인증 상태를 변경하지 못했어요.");
  }
}
