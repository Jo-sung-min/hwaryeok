"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState, useRef } from "react";
import { deleteProductAction, type ProductActionState } from "@/app/admin/products/actions";
import { useUiAlert } from "@/components/ui-alert-provider";

const initialState: ProductActionState = { success: false, message: "" };

export function ProductDeleteForm({ productId, productName }: { productId: string; productName: string }) {
  const action = deleteProductAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { confirm } = useUiAlert();

  const requestDelete = async () => {
    const confirmed = await confirm({
      title: "이 제품을 삭제할까요?",
      description: `‘${productName}’ 제품과 연결된 성분·리뷰 데이터가 함께 삭제되며 되돌릴 수 없어요. 일시적으로 감추려면 공개 상태를 ‘숨김’으로 바꾸는 방법도 있어요.`,
      confirmLabel: "제품 삭제",
      cancelLabel: "계속 보관",
      tone: "danger",
    });
    if (confirmed) formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 border-t border-[#74513f18] pt-4 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
    >
      <input type="hidden" name="confirmation" value={productId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-end">
        <p role="status" aria-live="polite" className={`max-w-56 text-[11px] ${state.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>{state.message}</p>
        <button type="button" onClick={requestDelete} disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold text-[#9a4358] transition hover:bg-[#fff0f3] disabled:opacity-60">
          {pending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
          {pending ? "삭제 중" : "제품 삭제"}
        </button>
      </div>
    </form>
  );
}
