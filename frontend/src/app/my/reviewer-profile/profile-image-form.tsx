"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import {
  completeReviewerProfileImageUploadAction,
  createReviewerProfileImageUploadUrlAction,
  deleteReviewerProfileImageAction,
  type ReviewerProfileImageActionState,
} from "./actions";
import {
  profileImageFileError,
  profileImageUploadMetadata,
  putProductImageToPresignedUrl,
} from "@/lib/product-image-upload";
import styles from "./reviewer-profile.module.css";

const initialState: ReviewerProfileImageActionState = { success: false, message: "" };
type Phase = "idle" | "preparing" | "uploading" | "completing";

const phaseLabels: Record<Exclude<Phase, "idle">, string> = {
  preparing: "준비 중",
  uploading: "전송 중",
  completing: "반영 중",
};

export function ProfileImageForm({ nickname, profileImageUrl }: { nickname: string; profileImageUrl: string | null }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, setState] = useState(initialState);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, startTransition] = useTransition();
  const locked = pending || phase !== "idle";

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = event.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setState(initialState);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const file = fileInput.current?.files?.[0];
    const validationError = profileImageFileError(file);
    if (!file || validationError) {
      setState({ success: false, message: validationError ?? "프로필 사진을 선택해 주세요." });
      return;
    }

    setPhase("preparing");
    startTransition(async () => {
      try {
        const preparation = await createReviewerProfileImageUploadUrlAction(profileImageUploadMetadata(file));
        if (!preparation.success || !preparation.upload) {
          setState({ success: false, message: preparation.message });
          return;
        }
        setPhase("uploading");
        await putProductImageToPresignedUrl(file, preparation.upload);
        setPhase("completing");
        const completion = await completeReviewerProfileImageUploadAction(preparation.upload.objectKey);
        setState(completion);
        if (completion.success) router.refresh();
      } catch (error) {
        setState({ success: false, message: error instanceof Error ? error.message : "프로필 사진을 등록하지 못했어요." });
      } finally {
        setPhase("idle");
      }
    });
  }

  function removeImage() {
    if (locked || !profileImageUrl) return;
    setPhase("completing");
    startTransition(async () => {
      try {
        const result = await deleteReviewerProfileImageAction();
        setState(result);
        if (result.success) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
          if (fileInput.current) fileInput.current.value = "";
          router.refresh();
        }
      } finally {
        setPhase("idle");
      }
    });
  }

  const shownImage = previewUrl ?? profileImageUrl;
  return (
    <section className={styles.formSection} aria-labelledby="reviewer-image-heading">
      <div className={styles.sectionHeading}><div><p>PROFILE PHOTO</p><h2 id="reviewer-image-heading">프로필 사진</h2></div></div>
      <form onSubmit={submit} className={styles.imageForm} aria-busy={locked}>
        <div className={styles.avatarPreview} aria-label={`${nickname}님의 프로필 사진 미리보기`}>
          {shownImage ? <Image src={shownImage} alt="" fill sizes="88px" unoptimized={shownImage.startsWith("blob:")} /> : <span aria-hidden="true">{Array.from(nickname)[0]}</span>}
        </div>
        <div className={styles.imageControls}>
          <label className={styles.filePicker}>
            <Camera size={15} />사진 선택
            <input ref={fileInput} type="file" accept="image/png,image/jpeg" disabled={locked} onChange={chooseFile} />
          </label>
          <p>PNG, JPG · 최대 5MB · 가로·세로 2,048px 이하</p>
          <button type="submit" className="line-btn" disabled={locked || !previewUrl}>
            {locked ? <LoaderCircle className="animate-spin" size={15} /> : <ImagePlus size={15} />}
            {phase === "idle" ? "프로필 사진 등록" : phaseLabels[phase]}
          </button>
          {profileImageUrl ? (
            <button type="button" className="line-btn" disabled={locked} onClick={removeImage}>
              <Trash2 size={15} />프로필 사진 삭제
            </button>
          ) : null}
          <small className={state.success ? styles.success : styles.error} role={state.success ? "status" : state.message ? "alert" : "status"} aria-live="polite">{state.message}</small>
        </div>
      </form>
    </section>
  );
}
