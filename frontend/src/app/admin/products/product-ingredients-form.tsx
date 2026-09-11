"use client";

import { Check, ChevronDown, ChevronUp, FlaskConical, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import {
  saveProductIngredientsAction,
  type ProductIngredientsActionState,
} from "@/app/admin/products/actions";
import { ProductIngredientAmountForm } from "@/app/admin/products/product-ingredient-amount-form";
import type { Ingredient, ProductIngredients } from "@/lib/types";

const initialState: ProductIngredientsActionState = { success: false, message: "" };

type SelectedIngredient = {
  ingredientId: string;
  concentrationNote: string;
  isKeyIngredient: boolean;
};

export function ProductIngredientsForm({
  productId,
  availableIngredients,
  initialIngredients,
}: {
  productId: string;
  availableIngredients: Ingredient[];
  initialIngredients: ProductIngredients;
}) {
  const [selected, setSelected] = useState<SelectedIngredient[]>(() =>
    initialIngredients.ingredients.map((ingredient) => ({
      ingredientId: ingredient.id,
      concentrationNote: ingredient.concentrationNote ?? "",
      isKeyIngredient: ingredient.isKeyIngredient ?? false,
    })),
  );
  const [ingredientToAdd, setIngredientToAdd] = useState("");
  const action = saveProductIngredientsAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const ingredientById = useMemo(
    () => new Map(availableIngredients.map((ingredient) => [ingredient.id, ingredient])),
    [availableIngredients],
  );
  const remaining = availableIngredients.filter(
    (ingredient) => !selected.some((item) => item.ingredientId === ingredient.id),
  );

  const addIngredient = () => {
    if (!ingredientToAdd) return;
    setSelected((current) => [...current, { ingredientId: ingredientToAdd, concentrationNote: "", isKeyIngredient: false }]);
    setIngredientToAdd("");
  };

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selected.length) return;
    setSelected((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  return (
    <>
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="ingredients" value={JSON.stringify(selected)} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={ingredientToAdd}
          onChange={(event) => setIngredientToAdd(event.target.value)}
          aria-label="추가할 성분"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d9a8b55c] bg-white px-3.5 text-sm outline-none focus:border-[#b86178] focus:ring-2 focus:ring-[#b8617820]"
        >
          <option value="">연결할 성분을 선택하세요</option>
          {remaining.map((ingredient) => (
            <option key={ingredient.id} value={ingredient.id}>{ingredient.name} · {ingredient.role}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={addIngredient}
          disabled={!ingredientToAdd}
          className="soft-btn w-full disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        >
          <Plus size={16} /> 성분 추가
        </button>
      </div>

      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d6acb6] bg-[#fff9fb] px-4 py-6 text-center text-xs leading-6 text-[#89747c]">
          연결된 성분이 없어요. 공개 전에 확인된 성분을 추가해 주세요.
        </div>
      ) : (
        <ol className="space-y-2">
          {selected.map((item, index) => {
            const ingredient = ingredientById.get(item.ingredientId);
            return (
              <li key={item.ingredientId} className="rounded-2xl border border-[#dca9b638] bg-white/75 p-3 sm:p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#f8e1e7] text-xs font-bold text-[#9e5265]">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#57474d]">{ingredient?.name ?? item.ingredientId}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#927f86]">{ingredient?.englishName ?? "성분 정보 확인 필요"}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <OrderButton label="위로 이동" disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={15} /></OrderButton>
                    <OrderButton label="아래로 이동" disabled={index === selected.length - 1} onClick={() => move(index, 1)}><ChevronDown size={15} /></OrderButton>
                    <OrderButton label="성분 제거" onClick={() => setSelected((current) => current.filter((entry) => entry.ingredientId !== item.ingredientId))}><Trash2 size={15} /></OrderButton>
                  </div>
                </div>
                <label className="mt-3 block text-[11px] font-semibold text-[#746168]">
                  농도·역할 메모(선택)
                  <input
                    value={item.concentrationNote}
                    onChange={(event) => setSelected((current) => current.map((entry) => entry.ingredientId === item.ingredientId ? { ...entry, concentrationNote: event.target.value } : entry))}
                    maxLength={100}
                    placeholder="예: 핵심 성분, 함량 비공개"
                    className="mt-1.5 min-h-10 w-full rounded-xl border border-[#d9a8b54d] bg-[#fffafc] px-3 text-sm font-normal outline-none focus:border-[#b86178]"
                  />
                </label>
                <label className="mt-3 flex min-h-10 items-start gap-2.5 rounded-xl border border-[#e8d6dc] bg-[#fffafc] px-3 py-2.5 text-[11px] font-semibold text-[#66545b]">
                  <input
                    type="checkbox"
                    checked={item.isKeyIngredient}
                    onChange={(event) => setSelected((current) => current.map((entry) => entry.ingredientId === item.ingredientId ? { ...entry, isKeyIngredient: event.target.checked } : entry))}
                    className="mt-0.5 h-4 w-4 accent-[#b64768]"
                  />
                  <span>
                    이 제품의 핵심 성분
                    <span className="mt-0.5 block text-[9px] font-normal leading-4 text-[#97838b]">브랜드가 직접 강조하고 근거를 확인한 성분에만 설정해요.</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-col gap-3 border-t border-[#74513f18] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" aria-live="polite" className={`min-h-5 text-xs ${state.success ? "text-[#55735e]" : "text-[#a14f61]"}`}>
          {state.message ? <span className="inline-flex items-center gap-1.5">{state.success && <Check size={14} />}{state.message}</span> : <span className="inline-flex items-center gap-1.5 text-[#89747c]"><FlaskConical size={14} /> 위에서 아래 순서로 사용자 화면에 표시돼요.</span>}
        </p>
        <button type="submit" disabled={pending} className="ink-btn w-full sm:w-auto">
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
          {pending ? "저장 중" : `성분 ${selected.length}개 저장`}
        </button>
      </div>
      </form>

      <section className="mt-6 border-t border-[#74513f18] pt-5" aria-label="성분별 정량 함량 관리">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><h3 className="text-xs font-bold text-[#6c535c]">핵심 성분 정량 근거</h3><p className="mt-1 text-[10px] leading-5 text-[#8e7a82]">먼저 위 성분 연결을 저장한 뒤, 공식적으로 공개된 수치만 별도로 검수해 주세요.</p></div>
          <span className="text-[10px] font-semibold text-[#9a6979]">검증 공개 {initialIngredients.verifiedAmountCount ?? initialIngredients.ingredients.filter((item) => item.amount?.verificationStatus === "VERIFIED").length}건</span>
        </div>
        <div className="mt-3 space-y-2">
          {initialIngredients.ingredients.map((ingredient) => <ProductIngredientAmountForm key={ingredient.id} productId={productId} ingredient={ingredient} />)}
        </div>
      </section>
    </>
  );
}

function OrderButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-[#dca9b64a] bg-[#fff9fb] text-[#9d5869] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
