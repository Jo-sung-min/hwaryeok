"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import {
  completeProductImageUploadAction,
  createProductImageUploadUrlAction,
  type ProductImageActionState,
} from "@/app/admin/products/actions";
import {
  productImageFileError,
  productImageUploadMetadata,
  putProductImageToPresignedUrl,
} from "@/lib/product-image-upload";

const initialState: ProductImageActionState = { success: false, message: "" };

type UploadPhase = "idle" | "preparing" | "uploading" | "completing";

const phaseLabels: Record<Exclude<UploadPhase, "idle">, string> = {
  preparing: "업로드 준비 중",
  uploading: "이미지 전송 중",
  completing: "등록 반영 중",
};

export function ProductImageForm({ productId }: { productId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState(initialState);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [pending, startTransition] = useTransition();
  const locked = pending || phase !== "idle";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;

    const file = fileInputRef.current?.files?.[0];
    const validationError = productImageFileError(file);
    if (validationError || !file) {
      setState({ success: false, message: validationError ?? "이미지 파일을 선택해 주세요." });
      return;
    }

    setState(initialState);
    setPhase("preparing");
    startTransition(async () => {
      try {
        const preparation = await createProductImageUploadUrlAction(productId, productImageUploadMetadata(file));
        if (!preparation.success || !preparation.upload) {
          setState({ success: false, message: preparation.message || "이미지 전송을 준비하지 못했어요." });
          return;
        }

        setPhase("uploading");
        await putProductImageToPresignedUrl(file, preparation.upload);

        setPhase("completing");
        const completion = await completeProductImageUploadAction(productId, preparation.upload.objectKey);
        setState({ success: completion.success, message: completion.message });
        if (completion.success) {
          formRef.current?.reset();
          router.refresh();
        }
      } catch (error) {
        setState({
          success: false,
          message: error instanceof Error ? error.message : "이미지 업로드 연결이 끊겼어요. 잠시 후 다시 시도해 주세요.",
        });
      } finally {
        setPhase("idle");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} aria-busy={locked} className="mt-4 border-t border-[#74513f18] pt-4">
      <label className="block text-xs font-semibold text-[#74646a]" htmlFor={`image-${productId}`}>제품 이미지 교체</label>
      <input ref={fileInputRef} id={`image-${productId}`} name="file" type="file" required disabled={locked} accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full rounded-xl border border-[#d9a8b540] bg-white px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-[#fff0f3] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#9b4a5f]" />
      <p className="mt-2 text-[11px] leading-5 text-[#89747c]">PNG, JPG, WEBP · 최대 5MB · 브라우저에서 이미지 저장소로 바로 전송돼요.</p>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={locked} className="line-btn min-h-11 px-4 text-xs">
          {locked ? <LoaderCircle size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {phase === "idle" ? "이미지 등록" : phaseLabels[phase]}
        </button>
        <p role={state.success ? "status" : state.message ? "alert" : "status"} aria-live="polite" className={`text-[11px] ${state.success ? "text-[#65745e]" : "text-[#a14f61]"}`}>{state.message}</p>
      </div>
    </form>
  );
}
