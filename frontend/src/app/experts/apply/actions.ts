"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, submitExpertApplication } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type ApplicationActionState = { success: boolean; message: string; fieldErrors?: Record<string, string> };

export async function submitApplicationAction(_state: ApplicationActionState, formData: FormData): Promise<ApplicationActionState> {
  const token = await getActionAccessToken();
  if (!token) return { success: false, message: "로그인이 필요해요." };
  try {
    await submitExpertApplication(token, {
      realName: String(formData.get("realName") ?? ""),
      licenseNumber: String(formData.get("licenseNumber") ?? ""),
      specialistRequested: formData.get("specialistRequested") === "on",
      specialty: String(formData.get("specialty") ?? "") || undefined,
      topics: formData.getAll("topics").map(String),
      bio: String(formData.get("bio") ?? ""),
      workplace: {
        hospitalName: String(formData.get("hospitalName") ?? ""),
        region: String(formData.get("region") ?? ""),
        address: String(formData.get("address") ?? ""),
        phone: String(formData.get("phone") ?? "") || undefined,
        homepageUrl: String(formData.get("homepageUrl") ?? "") || undefined,
      },
    });
    revalidatePath("/experts/apply");
    revalidatePath("/admin/experts");
    return { success: true, message: "인증 신청서를 안전하게 접수했어요. 검토 결과는 이 화면에서 확인할 수 있어요." };
  } catch (error) {
    if (error instanceof ApiRequestError) return { success: false, message: error.message, fieldErrors: error.fieldErrors };
    return { success: false, message: "인증 신청을 접수하지 못했어요." };
  }
}
