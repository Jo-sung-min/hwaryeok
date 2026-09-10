import { skinTendency, toQuickProfile, type SkinAnswers } from "./skin-check";

export type SkinTypeStatistics = {
  status: "AVAILABLE" | "COLLECTING";
  minimumSample: number;
  sampleSize: number | null;
  distribution: { skinType: string; count: number; percentage: number }[];
  calculatedAt: string;
};

const archetypes: Record<string, { code: string; name: string; introduction: string; focus: string }> = {
  "복합성": { code: "C", name: "부위별 균형 조율가", introduction: "한 얼굴 안에서도 서로 다른 요구가 나타나는 타입이에요. 이마·코와 볼의 유분 답변이 달라, 얼굴 전체를 한 가지 상태로 보기보다 부위를 나누어 이해하는 편이 이번 답변을 더 잘 설명해요.", focus: "가벼운 보습을 기본으로, 당기는 부위에는 크림을 더해보세요. 부위별로 보습 양을 조절하는 관리가 추천 방향이에요." },
  "건성": { code: "D", name: "촉촉함을 지키는 보습 수호가", introduction: "볼의 건조함과 적은 유분 또는 속당김을 함께 답한 타입이에요. 산뜻함만큼이나 세안 뒤 편안함과 촉촉한 느낌이 얼마나 오래가는지가 중요한 선택 기준이 될 수 있어요.", focus: "촉촉함이 오래가는 보습 크림부터 비교해 보세요. 세안 직후 당기는 부위를 먼저 챙기는 루틴을 추천해요." },
  "지성": { code: "O", name: "산뜻함을 찾는 유분 조율가", introduction: "이마·코뿐 아니라 볼에서도 유분을 느끼고, 속당김은 두드러지지 않는다고 답했어요. 이번 기록에서는 얼굴 전반의 번들거림이 특징으로 나타나요.", focus: "끈적임이 적은 젤·로션부터 살펴보세요. 오일프리·논코메도제닉 표시도 제품 선택에 도움이 돼요." },
  "수부지": { code: "U", name: "유분과 속당김 사이 균형 탐색가", introduction: "이마·코와 볼 모두 번들거리면서 속당김도 자주 느낀다고 답했어요. 겉의 유분과 안쪽의 당기는 느낌을 따로 살펴봐야 이번 상태를 놓치지 않고 이해할 수 있어요.", focus: "가벼운 수분 보습제를 우선으로 살펴보세요. 번들거림을 줄이는 것만큼 세안 후 당기지 않는 마무리가 중요해요." },
  "중성": { code: "B", name: "편안한 균형을 가꾸는 밸런서", introduction: "이번 유분·볼 상태 답변에서는 뚜렷한 유분 과다나 건조 조합이 두드러지지 않았어요. 현재의 편안함을 유지하면서 개별 고민과 사용 취향을 세심하게 살펴보는 타입이에요.", focus: "편안하게 사용하던 기본 보습을 유지해 보세요. 새로운 제품은 지금 신경 쓰이는 고민과 마무리감에 맞춰 골라보세요." },
};

export function buildSkinReport(answers: SkinAnswers) {
  const profile = toQuickProfile(answers), tendency = skinTendency(answers);
  if (!profile || !tendency) return null;
  const archetype = archetypes[tendency.type];
  const hydration = profile.hydrationLevel === "LOW"
    ? { code: "D", label: "속당김 체감형", text: "보습 후에도 속당김을 자주 느끼셨군요. 수분 보습 성분과 보습이 오래가는 제형을 함께 살펴보세요." }
    : profile.hydrationLevel === "HIGH"
      ? { code: "H", label: "촉촉함 유지형", text: "촉촉함이 오래가는 편이에요. 지금 잘 쓰는 보습제를 유지하면서 원하는 마무리감의 제품을 비교해 보세요." }
      : { code: "B", label: "당김 안정형", text: "평소 당김이 적은 편이에요. 보습 단계를 늘리기보다 매일 편안하게 쓸 제형을 중심으로 골라보세요." };
  const sensitivity = profile.sensitivityLevel === "HIGH"
    ? { code: "S", label: "민감 반응형", text: "새 제품에 쉽게 반응하는 편이에요. 향료 없는 제품을 먼저 살펴보고, 새 제품은 한 번에 하나씩 좁은 부위부터 사용해 보세요." }
    : profile.sensitivityLevel === "MEDIUM"
      ? { code: "M", label: "컨디션 반응형", text: "컨디션에 따라 가끔 반응하는 편이에요. 불편했던 제품과 전성분을 비교하고, 새 제품을 여러 개 동시에 바꾸지 않는 루틴을 추천해요." }
      : { code: "C", label: "반응 드문형", text: "새 제품에 대한 반응은 드문 편이에요. 관심 있는 성분과 선호 제형을 중심으로 하나씩 비교해 보세요." };
  const breakout = profile.breakoutFrequency === "FREQUENT"
    ? { code: "F", label: "트러블 반복형", text: "트러블이 자주 반복되는 편이에요. 논코메도제닉 표시가 있는 제품을 우선 살펴보고, 과하게 문지르는 세안은 피하세요." }
    : profile.breakoutFrequency === "OCCASIONAL"
      ? { code: "O", label: "간헐적 트러블형", text: "가끔 트러블이 나타나는 편이에요. 편안하게 쓰던 기본 제품을 유지하고 새 제품은 하나씩 추가해 보세요." }
      : { code: "R", label: "트러블 드문형", text: "최근 트러블이 드문 편이에요. 잘 맞았던 제품을 중심으로 보습과 선케어를 꾸준히 이어가세요." };
  const details = [
    { title: "세안 뒤 피부가 보내는 신호", text: profile.cleansingTightness === "LONG" ? "세안 뒤 당김이 오래 남는 편이에요. 강한 세정감보다 세안 후 편안함을 기준으로 세안제를 고르고 보습을 바로 이어가세요." : profile.cleansingTightness === "SHORT" ? "세안 뒤 잠깐 당기는 편이에요. 피부가 약간 촉촉할 때 보습제를 바르는 루틴을 이어가 보세요." : "세안 직후 편안한 편이에요. 지금의 순한 세안 습관을 유지하고, 필요 이상으로 여러 번 씻지 않도록 해보세요." },
    { title: "붉어짐이 신경 쓰일 때", text: profile.rednessFrequency === "FREQUENT" ? "붉어짐이 자주 신경 쓰이는 편이에요. 새 기능성 제품을 늘리기보다 편안했던 보습 루틴을 먼저 유지해 보세요. 붉어짐이 계속되면 전문가와 상담해 주세요." : profile.rednessFrequency === "OCCASIONAL" ? "붉어짐이 가끔 보이는 편이에요. 불편한 날에는 새 제품을 추가하지 말고 익숙한 기본 제품 위주로 사용해 보세요." : "붉어짐이 드문 편이에요. 지금의 편안한 관리 습관을 유지하면서 다른 피부 고민에 맞춰 제품을 골라보세요." },
    { title: "모공이 신경 쓰일 때의 선택 기준", text: profile.poreLevel === "HIGH" ? "여러 부위의 모공이 신경 쓰이는 편이에요. 논코메도제닉 표시를 확인하고, 거친 스크럽보다 부드러운 세안을 우선해 보세요." : profile.poreLevel === "MEDIUM" ? "일부 부위의 모공이 신경 쓰이는 편이에요. 얼굴 전체의 관리 단계를 늘리기보다 해당 부위의 번들거림과 제품 잔여감을 비교해 보세요." : "모공은 크게 신경 쓰이지 않는 편이에요. 모공 전용 제품을 더하기보다 우선순위로 고른 피부 고민부터 챙겨보세요." },
  ];
  return { profile, tendency, archetype, code: [archetype.code, hydration.code, sensitivity.code, breakout.code].join(" · "), axes: [
    { code: archetype.code, title: "유분 분포", label: tendency.type + " 경향", text: archetype.introduction },
    { ...hydration, title: "속당김" }, { ...sensitivity, title: "제품 반응" }, { ...breakout, title: "트러블 빈도" },
  ], details };
}

export function populationShare(statistics: SkinTypeStatistics | null, skinType: string) {
  if (!statistics || statistics.status !== "AVAILABLE" || !statistics.sampleSize || statistics.sampleSize < Math.max(30, statistics.minimumSample)) return null;
  const row = statistics.distribution.find(item => item.skinType === skinType);
  if (!row || !Number.isSafeInteger(row.count) || row.count < 0 || row.count > statistics.sampleSize) return null;
  // Calculate from the denominator, not a potentially stale or inconsistent percentage.
  return { count: row.count, total: statistics.sampleSize, percentage: Math.round(row.count * 1000 / statistics.sampleSize) / 10 };
}
