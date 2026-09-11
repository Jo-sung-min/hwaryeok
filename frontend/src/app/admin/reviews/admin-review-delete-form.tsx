"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState, useRef } from "react";
import { useUiAlert } from "@/components/ui-alert-provider";
import { deleteAdminReviewAction, type AdminReviewActionState } from "./actions";

const initialState: AdminReviewActionState = { success: false, message: "" };

type AdminReviewDeleteFormProps = {
  reviewId: string;
  productId: string;
  productName: string;
  authorId: string | null;
  authorNickname: string;
  sampleReview: boolean;
};

export function AdminReviewDeleteForm({
  reviewId,
  productId,
  productName,
  authorId,
  authorNickname,
  sampleReview,
}: AdminReviewDeleteFormProps) {
  const deleteAction = deleteAdminReviewAction.bind(null, reviewId, productId, authorId, sampleReview);
  const [state, formAction, pending] = useActionState(deleteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { confirm } = useUiAlert();

  const requestDelete = async () => {
    const confirmed = await confirm({
      title: sampleReview ? "이 화면 예시를 삭제할까요?" : "이 사용자 리뷰를 삭제할까요?",
      description: sampleReview
        ? `‘${productName}’의 화면 예시 리뷰가 삭제되며 되돌릴 수 없어요. 실제 사용자 점수와 랭킹에는 영향을 주지 않아요.`
        : `‘${authorNickname}’님이 ‘${productName}’에 남긴 리뷰가 영구 삭제돼요. 제품 리뷰점수와 리뷰어 화력이 다시 계산되며 되돌릴 수 없어요.`,
      confirmLabel: "리뷰 삭제",
      cancelLabel: "계속 보관",
      tone: "danger",
    });
    if (confirmed) formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={formAction} className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
      <p role="status" aria-live="polite" className={`max-w-72 text-[11px] leading-5 ${state.success ? "text-[#52705b]" : "text-[#a14f61]"}`}>{state.message}</p>
      <button
        type="button"
        onClick={requestDelete}
        disabled={pending}
        aria-label={`${authorNickname}님의 ${productName} 리뷰 삭제`}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold text-[#9a4358] transition hover:bg-[#fff0f3] disabled:opacity-60"
      >
        {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {pending ? "삭제 중" : "삭제"}
      </button>
    </form>
  );
}
