"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { uploadProductImageAction, type ProductImageActionState } from "@/app/admin/products/actions";

const initialState: ProductImageActionState = { success: false, message: "" };

export function ProductImageForm({ productId }: { productId: string }) {
  const action = uploadProductImageAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 border-t border-[#74513f18] pt-4">
      <label className="block text-xs font-semibold text-[#74646a]" htmlFor={`image-${productId}`}>제품 이미지 교체</label>
      <input id={`image-${productId}`} name="file" type="file" required accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full rounded-xl border border-[#d9a8b540] bg-white px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-[#fff0f3] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#9b4a5f]" />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="line-btn min-h-11 px-4 text-xs">
          {pending ? <LoaderCircle size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {pending ? "등록 중" : "이미지 등록"}
        </button>
        <p role="status" aria-live="polite" className={`text-[11px] ${state.success ? "text-[#65745e]" : "text-[#a14f61]"}`}>{state.message}</p>
      </div>
    </form>
  );
}
