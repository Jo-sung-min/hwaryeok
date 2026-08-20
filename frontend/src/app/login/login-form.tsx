"use client";

import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { useActionState, useState } from "react";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {
  message: "",
  fieldErrors: {},
  values: { email: "" },
};

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5" noValidate>
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="min-w-0">
        <label htmlFor="email" className="mb-2 block text-xs font-bold text-[#5d534d]">이메일</label>
        <div className={`overflow-hidden rounded-2xl border bg-[#fffdf8] focus-within:border-[#a54f4970] ${state.fieldErrors.email ? "border-[#b35e55]" : "border-[#74513f20]"}`}>
          <input id="email" name="email" type="email" defaultValue={state.values.email} autoComplete="email" required maxLength={254} placeholder="name@example.com" className="h-13 w-full bg-transparent px-4 text-sm outline-none" />
        </div>
        {state.fieldErrors.email && <p className="mt-2 text-xs text-[#a64e47]" role="alert">{state.fieldErrors.email}</p>}
      </div>

      <div className="min-w-0">
        <label htmlFor="password" className="mb-2 block text-xs font-bold text-[#5d534d]">비밀번호</label>
        <div className={`flex overflow-hidden rounded-2xl border bg-[#fffdf8] focus-within:border-[#a54f4970] ${state.fieldErrors.password ? "border-[#b35e55]" : "border-[#74513f20]"}`}>
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={64} className="h-13 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="mr-2 grid h-10 w-10 self-center place-items-center rounded-full text-[#766960] hover:bg-[#74513f0b]" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {state.fieldErrors.password && <p className="mt-2 text-xs text-[#a64e47]" role="alert">{state.fieldErrors.password}</p>}
      </div>

      {state.message && <div className="rounded-2xl border border-[#b56b5725] bg-[#fff3ed] px-4 py-3 text-sm text-[#934d43]" role="alert" aria-live="polite">{state.message}</div>}

      <button type="submit" disabled={pending} className="ink-btn w-full disabled:cursor-wait disabled:opacity-65">
        {pending ? <><LoaderCircle size={17} className="animate-spin" /> 로그인하고 있어요</> : <><LogIn size={17} /> 이메일로 로그인</>}
      </button>
    </form>
  );
}
