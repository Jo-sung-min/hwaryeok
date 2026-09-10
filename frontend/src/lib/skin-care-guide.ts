// General cosmetic selection guidance, not a diagnosis or product efficacy score.
// Sources and limitations live at /principles#skin-guide.
export type SkinCareInput = {
  skinType?: string | null;
  hydrationLevel?: string | null;
  sensitivityLevel?: string | null;
  breakoutFrequency?: string | null;
  cleansingTightness?: string | null;
  texturePreference?: string | null;
  reactionTriggers?: string[];
};

export function buildSkinCareGuide(profile: SkinCareInput) {
  const dry = profile.skinType === "건성" || profile.hydrationLevel === "LOW" || profile.cleansingTightness === "LONG";
  const oily = profile.skinType === "지성" || profile.skinType === "수부지";
  const combination = profile.skinType === "복합성";
  const reactive = profile.sensitivityLevel === "HIGH" || profile.skinType === "민감" || Boolean(profile.reactionTriggers?.includes("향료") || profile.reactionTriggers?.includes("에센셜 오일"));
  const breakouts = profile.breakoutFrequency === "FREQUENT";
  const texture = combination ? "가벼운 로션 + 건조 부위용 크림" : oily ? "가볍게 흡수되는 젤·로션" : dry ? "촉촉함이 남는 보습 크림" : "매일 쓰기 편한 보습 로션";
  const summary = combination ? "부위마다 보습의 양을 다르게 맞춰보세요" : oily && dry ? "산뜻한 수분 보습부터 챙겨보세요" : oily ? "무거운 잔여감 없이 촉촉하게 관리해 보세요" : dry ? "세안 후에도 편안한 보습을 먼저 챙겨보세요" : "지금의 편안함을 유지하는 기본 보습부터 시작해요";
  const application = combination ? "번들거리는 부위는 가볍게, 당기는 부위에는 크림을 덧발라 보세요. 얼굴 전체에 같은 양을 바를 필요는 없어요." : oily ? "보습을 생략하기보다 가벼운 제형으로 시작해 사용 후 번들거림과 당김을 함께 살펴보세요." : dry ? "세안 후 피부가 약간 촉촉할 때 보습제를 바르고, 특히 당기는 부위를 챙겨보세요." : "편안하게 사용하던 보습제를 중심으로 루틴을 유지하고, 계절에 따라 바르는 양을 조절해 보세요.";
  const ingredients = [
    { id: "hyaluronic-acid", name: "히알루론산", role: "수분 보습", reason: dry ? "속당김이 신경 쓰인다면 수분 보습 성분으로 먼저 살펴보세요." : "산뜻한 보습 제품을 찾을 때 확인해 볼 수분 성분이에요." },
    { id: "ceramide-np", name: "세라마이드 NP", role: "보습 유지", reason: combination ? "특히 건조하게 느껴지는 부위에 쓸 보습제를 고를 때 살펴보세요." : dry ? "촉촉함이 오래가는 보습제를 찾을 때 함께 살펴볼 성분이에요." : "피부의 편안한 보습을 유지할 제품에서 함께 확인해 보세요." },
  ];
  if (dry && !oily) ingredients.reverse();
  const check = reactive ? { title: "향료 없는 제품부터", text: "민감 반응이나 향 성분에 대한 불편함을 알려주셨어요. 무향료(fragrance-free) 표시를 먼저 확인해 보세요." }
    : oily || breakouts ? { title: "오일프리·논코메도제닉 표시", text: "번들거림이나 반복되는 트러블이 고민이라면 제품을 고를 때 함께 확인할 표시예요." }
    : { title: "성분만큼 마무리감도 확인", text: "같은 보습 성분이 있어도 사용감은 달라요. 바른 뒤 끈적임과 시간이 지난 뒤의 편안함을 비교해 보세요." };
  const preference = profile.texturePreference === "LIGHT" ? "산뜻한 사용감을 선호하셨으니 끈적임이 적은 제품부터 비교해 보세요." : profile.texturePreference === "RICH" ? "도톰한 보습감을 선호하셨으니 크림의 마무리감을 함께 살펴보세요." : "매일 부담 없이 사용할 수 있는 마무리감을 골라보세요.";
  return { summary, texture, application, ingredients, check, preference };
}
