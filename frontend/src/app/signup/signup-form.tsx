"use client";

import Link from "next/link";
import { Check, Eye, EyeOff, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useActionState, useState } from "react";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import type { OAuthProviderStatus } from "@/lib/api";
import { signupAction, type SignupActionState } from "./actions";

const initialSignupState: SignupActionState = {
  success: false,
  message: "",
  fieldErrors: {},
  values: { nickname: "", email: "" },
};

export function SignupForm({ oauthProviders }: { oauthProviders: OAuthProviderStatus[] }) {
  const [state, formAction, pending] = useActionState(signupAction, initialSignupState);
  const [showPassword, setShowPassword] = useState(false);

  if (state.success) {
    return (
      <div className="paper-card rounded-[30px] p-7 text-center md:p-10" role="status">
        <span className="seal mx-auto h-16 w-16 font-myeongjo text-2xl">完</span>
        <p className="eyebrow mb-3 mt-7">WELCOME TO HWA:RYEOK</p>
        <h1 className="font-myeongjo text-3xl font-semibold">{state.nickname}님, 가입을 환영해요</h1>
        <p className="mt-4 text-sm leading-7 text-[#756960]">계정이 안전하게 만들어졌어요. 이제 피부 타입과 고민을 알려주면 화장품을 나만의 화력으로 분석할 수 있어요.</p>
        <Link href="/profile" className="ink-btn mt-8 w-full"><Sparkles size={17} /> 피부 프로필 등록하기</Link>
        <Link href="/products" className="mt-5 inline-flex text-xs font-semibold text-[#8d6155]">먼저 화장품 둘러보기</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="paper-card min-w-0 rounded-[26px] p-5 sm:rounded-[30px] sm:p-6 md:p-9" noValidate>
      <div className="mb-7">
        <p className="eyebrow mb-3">CREATE ACCOUNT</p>
        <h1 className="font-myeongjo text-[28px] font-semibold leading-tight sm:text-3xl">나만의 화력을 시작해요</h1>
        <p className="mt-3 text-sm leading-7 text-[#7b6e65]">가입 후 피부 정보를 등록하면 모든 제품을 내 피부 기준으로 다시 볼 수 있어요.</p>
      </div>

      <SocialLoginButtons providers={oauthProviders} />
      <div className="my-7 flex items-center gap-4 text-[11px] text-[#96887e]"><span className="h-px flex-1 bg-[#74513f18]" /><span>또는 이메일로 가입</span><span className="h-px flex-1 bg-[#74513f18]" /></div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
        <Field label="닉네임" name="nickname" error={state.fieldErrors.nickname} hint="화력에서 불릴 이름이에요.">
          <input id="nickname" name="nickname" defaultValue={state.values.nickname} required minLength={2} maxLength={20} autoComplete="nickname" placeholder="예: 새봄" className="h-13 w-full bg-transparent px-4 text-sm outline-none" />
        </Field>

        <Field label="이메일" name="email" error={state.fieldErrors.email}>
          <input id="email" name="email" type="email" defaultValue={state.values.email} required maxLength={254} autoComplete="email" placeholder="name@example.com" className="h-13 w-full bg-transparent px-4 text-sm outline-none" />
        </Field>

        <Field label="비밀번호" name="password" error={state.fieldErrors.password} hint="8자 이상, 영문·숫자·특수문자를 함께 사용해주세요.">
          <div className="flex items-center">
            <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={64} autoComplete="new-password" className="h-13 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="mr-2 grid h-10 w-10 place-items-center rounded-full text-[#766960] hover:bg-[#74513f0b]" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </Field>

        <Field label="비밀번호 확인" name="passwordConfirm" error={state.fieldErrors.passwordConfirm}>
          <input id="passwordConfirm" name="passwordConfirm" type={showPassword ? "text" : "password"} required minLength={8} maxLength={64} autoComplete="new-password" className="h-13 w-full bg-transparent px-4 text-sm outline-none" />
        </Field>
      </div>

      <div className="mt-6 rounded-2xl border border-[#7f8c7622] bg-[#eef1e849] p-3.5 sm:p-4">
        <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-[#646359]">
          <input name="termsAccepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[#a54f49]" />
          <span><strong className="font-semibold text-[#514b45]">필수</strong> 서비스 이용약관과 개인정보 처리방침에 동의합니다.</span>
        </label>
        {state.fieldErrors.termsAccepted && <p className="mt-2 text-xs text-[#a64e47]" role="alert">{state.fieldErrors.termsAccepted}</p>}
      </div>

      {state.message && <div className="mt-5 rounded-2xl border border-[#b56b5725] bg-[#fff3ed] px-4 py-3 text-sm text-[#934d43]" role="alert" aria-live="polite">{state.message}</div>}

      <button type="submit" disabled={pending} className="ink-btn mt-7 w-full disabled:cursor-wait disabled:opacity-65">
        {pending ? <><LoaderCircle size={17} className="animate-spin" /> 계정을 만들고 있어요</> : <><ShieldCheck size={17} /> 안전하게 회원가입</>}
      </button>
      <p className="mt-5 text-center text-xs text-[#81736a]">이미 계정이 있나요? <Link href="/login" className="font-semibold text-[#9b4a45]">간편 로그인하기</Link></p>
    </form>
  );
}

function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-2 block text-xs font-bold text-[#5d534d]">{label}</label>
      <div className={`overflow-hidden rounded-2xl border bg-[#fffdf8] transition focus-within:border-[#a54f4970] ${error ? "border-[#b35e55]" : "border-[#74513f20]"}`}>{children}</div>
      {error ? <p id={`${name}-error`} className="mt-2 text-xs text-[#a64e47]" role="alert">{error}</p> : hint ? <p className="mt-2 text-[11px] text-[#8a7d74]">{hint}</p> : null}
    </div>
  );
}
