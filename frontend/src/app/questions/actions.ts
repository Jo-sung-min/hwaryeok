"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adoptExpertAnswer, ApiRequestError, createExpertAnswer, createExpertQuestion, setExpertAnswerReaction } from "@/lib/api";
import { getActionAccessToken } from "@/lib/auth-session";

export type ExpertFormState = { success: boolean; message: string; fieldErrors?: Record<string, string> };

export async function askQuestionAction(_state: ExpertFormState, formData: FormData): Promise<ExpertFormState> {
  const token = await getActionAccessToken();
  if (!token) return { success: false, message: "로그인이 필요해요." };
  let questionId: string;
  try {
    const question = await createExpertQuestion(token, {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      skinType: String(formData.get("skinType") ?? "") || undefined,
      ingredientId: String(formData.get("ingredientId") ?? "") || undefined,
    });
    questionId = question.id;
  } catch (error) {
    return errorState(error, "질문을 등록하지 못했어요.");
  }
  revalidatePath("/questions");
  redirect(`/questions/${questionId}`);
}

export async function answerQuestionAction(questionId: string, _state: ExpertFormState, formData: FormData): Promise<ExpertFormState> {
  const token = await getActionAccessToken();
  if (!token) return { success: false, message: "로그인이 필요해요." };
  try {
    await createExpertAnswer(token, questionId, String(formData.get("content") ?? ""));
    revalidatePath(`/questions/${questionId}`);
    revalidatePath("/questions");
    revalidatePath("/experts");
    return { success: true, message: "전문가 답변을 등록했어요." };
  } catch (error) {
    return errorState(error, "답변을 등록하지 못했어요.");
  }
}

export async function toggleAnswerReactionAction(questionId: string, answerId: string, type: "helpful" | "save", selected: boolean) {
  const token = await getActionAccessToken();
  if (!token) redirect(`/login?returnTo=${encodeURIComponent(`/questions/${questionId}`)}`);
  await setExpertAnswerReaction(token, answerId, type, selected);
  revalidatePath(`/questions/${questionId}`);
}

export async function adoptAnswerAction(questionId: string, answerId: string) {
  const token = await getActionAccessToken();
  if (!token) redirect(`/login?returnTo=${encodeURIComponent(`/questions/${questionId}`)}`);
  await adoptExpertAnswer(token, questionId, answerId);
  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/experts/ranking");
}

function errorState(error: unknown, fallback: string): ExpertFormState {
  if (error instanceof ApiRequestError) return { success: false, message: error.message, fieldErrors: error.fieldErrors };
  return { success: false, message: fallback };
}
