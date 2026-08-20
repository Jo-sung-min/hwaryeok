import type { Product } from "@/lib/types";

export type { Product } from "@/lib/types";

export const products: Product[] = [
  { id: "birch-cream", brand: "라운드랩", name: "자작나무 수분 크림", category: "크림", grade: 1, score: 94, benefit: "수분 장벽 강화", subBenefit: "속건조 진정", price: "32,000원", tone: "blue", tag: "리포트 예시", publicationStatus: "PUBLISHED" },
  { id: "heartleaf-toner", brand: "아누아", name: "어성초 77 진정 토너", category: "토너", grade: 1, score: 91, benefit: "붉은기 진정", subBenefit: "유수분 균형", price: "25,000원", tone: "sage", tag: "성분 정보 확인", publicationStatus: "PUBLISHED" },
  { id: "ceramide-serum", brand: "아뜰리에 온", name: "세라마이드 결 세럼", category: "세럼", grade: 1, score: 90, benefit: "장벽 케어", subBenefit: "결 정돈", price: "38,000원", tone: "peach", tag: "신규 등록", publicationStatus: "PUBLISHED" },
  { id: "rice-sunscreen", brand: "조선미녀", name: "맑은 쌀 선크림", category: "선케어", grade: 2, score: 86, benefit: "순한 자외선 차단", subBenefit: "촉촉한 마무리", price: "18,000원", tone: "sand", publicationStatus: "PUBLISHED" },
  { id: "mugwort-ampoule", brand: "아임프롬", name: "강화 약쑥 앰플", category: "앰플", grade: 2, score: 84, benefit: "열감 진정", subBenefit: "민감 케어", price: "39,000원", tone: "rose", publicationStatus: "PUBLISHED" },
  { id: "bean-essence", brand: "믹순", name: "콩 에센스", category: "에센스", grade: 2, score: 82, benefit: "피부결 개선", subBenefit: "보습", price: "35,000원", tone: "sand", publicationStatus: "PUBLISHED" },
];

export const concerns = ["속건조", "민감", "모공", "붉은기", "피부 장벽", "각질", "칙칙함", "탄력"];

export const scoreDetails = [
  { label: "보습력", value: 96, note: "매우 좋음", positive: true },
  { label: "진정력", value: 92, note: "매우 좋음", positive: true },
  { label: "피부 장벽", value: 95, note: "매우 좋음", positive: true },
  { label: "유분 부담", value: 24, note: "낮음", positive: false },
  { label: "트러블 위험", value: 12, note: "매우 낮음", positive: false },
];

export const ingredients = [
  { name: "자작나무 수액", role: "수분 충전", status: "good", description: "건조해진 피부에 가볍게 수분을 채워줘요." },
  { name: "판테놀", role: "진정 · 장벽", status: "good", description: "예민한 피부를 편안하게 하고 장벽 회복을 도와요." },
  { name: "히알루론산", role: "보습", status: "good", description: "수분을 끌어당겨 오랫동안 촉촉함을 유지해요." },
  { name: "시어버터", role: "보습막", status: "caution", description: "보습에는 좋지만 더운 날에는 조금 무겁게 느낄 수 있어요." },
];
