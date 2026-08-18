"use client";

import Link from "next/link";
import { Check, ChevronRight, LoaderCircle, Sparkles } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { saveIngredientPreferencesAction, type IngredientPreferenceActionState } from "@/app/my/ingredient-actions";
import type { Ingredient } from "@/lib/types";

const initialState: IngredientPreferenceActionState = { success: false, message: "" };

export function IngredientPreferencesForm({
  ingredients,
  initialSelected,
}: {
  ingredients: Ingredient[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState(initialSelected);
  const [state, formAction, pending] = useActionState(saveIngredientPreferencesAction, initialState);

  useEffect(() => setSelected(initialSelected), [initialSelected]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 10 ? [...current, id] : current);
  }

  return (
    <form action={formAction} className="rounded-[26px] border border-[#e3b1bd3d] bg-[#fff7f9] p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#a14e63]"><Sparkles size={15} /> 나의 관심 성분</div>
          <h2 className="mt-2 font-myeongjo text-2xl font-semibold">화력을 보고 싶은 성분을 골라주세요</h2>
          <p className="mt-2 text-xs leading-6 text-[#7f6d74]">선택 순서가 우선순위가 되며, 최대 10개까지 저장할 수 있어요.</p>
        </div>
        <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#9e5264] shadow-sm">{selected.length} / 10</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {ingredients.map((ingredient) => {
          const active = selected.includes(ingredient.id);
          const priority = selected.indexOf(ingredient.id) + 1;
          return (
            <label key={ingredient.id} className={`relative cursor-pointer rounded-2xl border px-4 py-3 transition ${active ? "border-[#bd7085] bg-[#ad5b72] text-white shadow-[0_10px_24px_rgba(164,82,104,.16)]" : "border-[#e4b8c344] bg-white text-[#695c61] hover:border-[#ce899b]"}`}>
              <input
                type="checkbox"
                name="ingredientIds"
                value={ingredient.id}
                checked={active}
                disabled={!active && selected.length >= 10}
                onChange={() => toggle(ingredient.id)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 text-sm font-semibold">
                {active && <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[10px]">{priority}</span>}
                {ingredient.name}
                {active && <Check size={14} />}
              </span>
              <span className={`mt-1 block text-[10px] ${active ? "text-white/75" : "text-[#9a858d]"}`}>근거 {ingredient.evidenceLevel} · {ingredient.role}</span>
            </label>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-[#8b727b]">
          {selected.map((id, index) => {
            const ingredient = ingredients.find((item) => item.id === id);
            return ingredient ? <span key={id}>{index + 1}. {ingredient.name}</span> : null;
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-[#d99aaa2b] pt-5 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending || selected.length === 0} className="ink-btn w-full sm:w-auto">
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
          {pending ? "저장 중" : "관심 성분 저장"}
        </button>
        <p role="status" aria-live="polite" className={`text-xs ${state.success ? "text-[#66745f]" : "text-[#9b4a5c]"}`}>{state.message}</p>
        {selected[0] && <Link href={`/ingredients/${selected[0]}`} className="ml-auto inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#9b4a5c]">1순위 화력 보기 <ChevronRight size={14} /></Link>}
      </div>
    </form>
  );
}
