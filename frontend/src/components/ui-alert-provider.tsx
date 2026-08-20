"use client";

import { AlertTriangle, Check, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type Notice = {
  id: number;
  title: string;
  message: string;
  tone: "warning" | "info" | "success";
};

type UiAlertContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, options?: { title?: string; tone?: Notice["tone"] }) => void;
};

const UiAlertContext = createContext<UiAlertContextValue | null>(null);

export function UiAlertProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const invalidLockRef = useRef(false);

  const notify = useCallback((message: string, options?: { title?: string; tone?: Notice["tone"] }) => {
    setNotice({
      id: Date.now(),
      title: options?.title ?? "잠시 확인해 주세요",
      message,
      tone: options?.tone ?? "info",
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolverRef.current?.(false);
    resolverRef.current = resolve;
    setConfirmation(options);
  }), []);

  const closeConfirmation = useCallback((confirmed: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setConfirmation(null);
    resolve?.(confirmed);
  }, []);

  useEffect(() => () => resolverRef.current?.(false), []);

  useEffect(() => {
    const handleInvalid = (event: Event) => {
      const field = event.target;
      if (!isFormField(field)) return;
      event.preventDefault();
      if (invalidLockRef.current) return;
      invalidLockRef.current = true;
      window.setTimeout(() => { invalidLockRef.current = false; }, 0);

      const label = fieldLabel(field);
      const message = validationMessage(field, label);
      field.dataset.uiInvalid = "true";
      const clearInvalid = () => {
        delete field.dataset.uiInvalid;
        field.removeEventListener("input", clearInvalid);
        field.removeEventListener("change", clearInvalid);
      };
      field.addEventListener("input", clearInvalid, { once: true });
      field.addEventListener("change", clearInvalid, { once: true });
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => field.focus({ preventScroll: true }), 220);
      notify(message, { title: "입력 내용을 확인해 주세요", tone: "warning" });
    };

    document.addEventListener("invalid", handleInvalid, true);
    return () => document.removeEventListener("invalid", handleInvalid, true);
  }, [notify]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice((current) => current?.id === notice.id ? null : current), 7_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <UiAlertContext.Provider value={{ confirm, notify }}>
      {children}
      {notice && <NoticeCard notice={notice} onClose={() => setNotice(null)} />}
      {confirmation && <ConfirmationDialog options={confirmation} onClose={closeConfirmation} />}
    </UiAlertContext.Provider>
  );
}

export function useUiAlert() {
  const context = useContext(UiAlertContext);
  if (!context) throw new Error("useUiAlert는 UiAlertProvider 안에서 사용해야 해요.");
  return context;
}

function NoticeCard({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const style = notice.tone === "warning"
    ? { icon: AlertTriangle, shell: "border-[#e5b66e8c] bg-[linear-gradient(145deg,rgba(255,252,244,.96),rgba(255,241,218,.93))]", iconBox: "bg-[#f4c775] text-[#714d18]", title: "text-[#654717]" }
    : notice.tone === "success"
      ? { icon: Check, shell: "border-[#94b99b78] bg-[linear-gradient(145deg,rgba(248,255,249,.96),rgba(230,244,234,.94))]", iconBox: "bg-[#9fc2a6] text-[#294f32]", title: "text-[#365b3e]" }
      : { icon: Info, shell: "border-[#d7a8b67a] bg-[linear-gradient(145deg,rgba(255,250,252,.97),rgba(250,229,236,.94))]", iconBox: "bg-[#d98ca2] text-white", title: "text-[#744355]" };
  const Icon = style.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[140] flex justify-center px-4 md:bottom-8" data-ui-alert="notice">
      <section role="alert" aria-live="assertive" className={`ui-alert-enter pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[22px] border p-3.5 shadow-[0_22px_65px_rgba(65,35,46,.24)] backdrop-blur-2xl sm:p-4 ${style.shell}`}>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-sm ${style.iconBox}`}><Icon size={19} /></span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className={`text-sm font-bold ${style.title}`}>{notice.title}</h2>
          <p className="mt-1 break-words text-xs leading-5 text-[#75646b]">{notice.message}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="안내 닫기" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#8c747c] transition hover:bg-white/70 hover:text-[#563e47]"><X size={17} /></button>
      </section>
    </div>
  );
}

function ConfirmationDialog({ options, onClose }: { options: ConfirmOptions; onClose: (confirmed: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div
      className="ui-alert-backdrop fixed inset-0 z-[150] grid place-items-center bg-[#261a21]/45 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(false); }}
      onKeyDown={(event) => { if (event.key === "Escape") onClose(false); }}
      data-ui-alert="confirm"
    >
      <section role="alertdialog" aria-modal="true" aria-labelledby="ui-confirm-title" aria-describedby="ui-confirm-description" className="ui-alert-dialog paper-card w-full max-w-md rounded-[30px] p-5 shadow-[0_30px_90px_rgba(43,24,32,.32)] sm:p-7">
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] ${options.tone === "danger" ? "bg-[#f7d9df] text-[#a44259]" : "bg-[#f7e5c6] text-[#805d25]"}`}><AlertTriangle size={22} /></span>
          <div className="min-w-0 pt-1">
            <p className="eyebrow mb-2">PLEASE CONFIRM</p>
            <h2 id="ui-confirm-title" className="font-myeongjo text-xl font-semibold sm:text-2xl">{options.title}</h2>
            <p id="ui-confirm-description" className="mt-3 text-sm leading-6 text-[#77666d]">{options.description}</p>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button ref={cancelRef} type="button" onClick={() => onClose(false)} className="line-btn w-full">{options.cancelLabel ?? "취소"}</button>
          <button type="button" onClick={() => onClose(true)} className={options.tone === "danger" ? "inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#9d3f56,#6f3043)] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(118,48,67,.24)]" : "ink-btn w-full"}>{options.confirmLabel ?? "확인"}</button>
        </div>
      </section>
    </div>
  );
}

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isFormField(target: EventTarget | null): target is FormField {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}

function fieldLabel(field: FormField) {
  const explicit = field.getAttribute("aria-label")?.trim();
  if (explicit) return explicit;
  const labelText = field.labels?.[0]?.innerText.trim().split("\n")[0]?.replace(/\(선택\)/g, "").trim();
  if (labelText) return labelText;
  return field.getAttribute("placeholder")?.trim() || "필수 항목";
}

function validationMessage(field: FormField, label: string) {
  const validity = field.validity;
  if (validity.valueMissing) {
    if (field instanceof HTMLInputElement && field.type === "file") return `${label}: 파일을 선택해 주세요.`;
    if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) return `${label}: 항목을 선택하거나 동의해 주세요.`;
    if (field instanceof HTMLSelectElement) return `${label}: 항목을 선택해 주세요.`;
    return `${label}: 내용을 입력해 주세요.`;
  }
  if (validity.typeMismatch) return `${label}: 올바른 형식으로 입력해 주세요.`;
  if (validity.patternMismatch) return `${label}: 안내된 형식에 맞춰 입력해 주세요.`;
  if (validity.tooShort) return `${label}: ${field.getAttribute("minlength")}자 이상 입력해 주세요.`;
  if (validity.tooLong) return `${label}: 입력 가능한 길이를 초과했어요.`;
  if (validity.rangeUnderflow) return `${label}: ${field.getAttribute("min")} 이상의 값을 입력해 주세요.`;
  if (validity.rangeOverflow) return `${label}: ${field.getAttribute("max")} 이하의 값을 입력해 주세요.`;
  if (validity.stepMismatch) return `${label}: 입력 단위를 다시 확인해 주세요.`;
  return `${label}: 입력 내용을 다시 확인해 주세요.`;
}
