"use client";

import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { changePasswordAction, type PasswordChangeActionState } from "./account-actions";
import styles from "./my.module.css";

const initialState: PasswordChangeActionState = {
  success: false,
  message: "",
  fieldErrors: {},
  resetKey: 0,
};

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const [showPasswords, setShowPasswords] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.resetKey > 0) {
      formRef.current?.reset();
      setShowPasswords(false);
    }
  }, [state.resetKey]);

  return (
    <form ref={formRef} action={formAction} className={styles.passwordForm} noValidate>
      <div className={styles.passwordFormHead}>
        <p>영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.</p>
        <button
          type="button"
          className={styles.passwordVisibility}
          onClick={() => setShowPasswords((visible) => !visible)}
          aria-label={showPasswords ? "비밀번호 숨기기" : "비밀번호 보기"}
          aria-pressed={showPasswords}
        >
          {showPasswords ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          {showPasswords ? "숨기기" : "보기"}
        </button>
      </div>

      <PasswordField
        label="현재 비밀번호"
        name="currentPassword"
        autoComplete="current-password"
        visible={showPasswords}
        error={state.fieldErrors.currentPassword}
      />
      <PasswordField
        label="새 비밀번호"
        name="newPassword"
        autoComplete="new-password"
        visible={showPasswords}
        error={state.fieldErrors.newPassword}
      />
      <PasswordField
        label="새 비밀번호 확인"
        name="newPasswordConfirm"
        autoComplete="new-password"
        visible={showPasswords}
        error={state.fieldErrors.newPasswordConfirm}
      />

      {state.message && (
        <p
          className={state.success ? styles.accountSuccess : styles.accountError}
          role={state.success ? "status" : "alert"}
          aria-live="polite"
        >
          {state.message}
        </p>
      )}

      <button type="submit" className={`ink-btn ${styles.passwordSubmit}`} disabled={pending}>
        {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
        {pending ? "변경 중" : "비밀번호 변경"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  visible,
  error,
}: {
  label: string;
  name: "currentPassword" | "newPassword" | "newPasswordConfirm";
  autoComplete: "current-password" | "new-password";
  visible: boolean;
  error?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <div className={styles.passwordField}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={name === "currentPassword" ? undefined : 8}
        maxLength={64}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <small id={errorId} role="alert">{error}</small>}
    </div>
  );
}
