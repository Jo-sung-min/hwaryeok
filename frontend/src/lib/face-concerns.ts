// 얼굴 고민 찾기 카탈로그. 화면(클라이언트), 서버 액션, 확대컷 생성 스크립트가 함께 읽는다.
// 생성 스크립트가 Node의 타입 제거로 이 파일을 직접 불러오므로 값 import를 추가하지 않는다.

export type FaceZoneId = "forehead" | "eyes" | "nose" | "cheek" | "chin" | "jawline" | "neck" | "crown";

/** 얼굴을 돌려 볼 수 있는 각도. 정면에서 좌우·위·아래로 한 번씩 돌린 모습이다. */
export type FaceViewId = "front" | "turn-left" | "turn-right" | "up" | "top";
export type FaceTurn = "left" | "right" | "up" | "down";
export type FaceView = { id: FaceViewId; label: string; src: string };

/** 모델 얼굴 원본(FACE_MODEL.width × height) 픽셀 기준의 정사각 영역. 모든 각도 이미지가 같은 크기다. */
export type FaceBox = { x: number; y: number; size: number };

/** 한 각도에서 부위가 보이는 자리: 얼굴 위 ㅁ 마커와 확대컷을 띄우는 자리 */
export type FacePlacement = { view: FaceViewId; marker: FaceBox; callout: FaceBox };

export type FaceZone = {
  id: FaceZoneId;
  label: string;
  description: string;
  /** 확대컷을 잘라 내는 각도와 영역 */
  cropView: FaceViewId;
  crop: FaceBox;
  /** 이 부위가 보이는 각도들. 첫 항목이 부위를 골랐을 때 돌려 보여 주는 기본 각도다. */
  placements: FacePlacement[];
};

/** 화력의 기존 고민 코드. 새 코드를 만들지 않고 증상을 여기에 연결한다. */
export type FaceConcernCode =
  | "속건조·당김" | "유분·번들거림" | "트러블·여드름" | "블랙헤드·모공"
  | "붉은기·민감" | "장벽·각질" | "잡티·칙칙함" | "탄력·잔주름";

/** 증상이 알려 주는 피부 신호. 추천을 계산할 때 피부 기준 위에 덮어쓴다. */
export type FaceSymptomSignals = {
  hydrationLevel?: "LOW";
  oilinessLevel?: "HIGH";
  cheekOiliness?: "LOW";
  breakoutFrequency?: "FREQUENT";
  cleansingTightness?: "LONG";
  rednessFrequency?: "FREQUENT";
  poreLevel?: "HIGH";
  sunscreenUsage?: "SOMETIMES";
  breakoutZones?: Array<"이마" | "코" | "볼" | "턱·입가">;
};

export type FaceSymptom = {
  /** `${zone}-${key}` — 주소와 이미지 파일명에 그대로 쓴다. */
  id: string;
  zone: FaceZoneId;
  label: string;
  summary: string;
  /** "이런 모습·느낌이라면" 확인 문장 */
  looks: string[];
  care: string;
  /** 연결되는 화력 고민. 첫 번째가 제품 필터에 쓰는 대표 고민이다. 고민 코드가 없는 두피 증상은 비워 둔다. */
  concerns: FaceConcernCode[];
  /** 고민 코드가 없는 증상이 대신 보여 주는 제품 종류 */
  productCategory?: "헤어케어";
  signals: FaceSymptomSignals;
};

export const FACE_MODEL = { src: "/face-check/model-face.jpg", width: 784, height: 1168 } as const;

export const FACE_VIEWS: FaceView[] = [
  { id: "front", label: "정면", src: FACE_MODEL.src },
  { id: "turn-left", label: "왼쪽 옆얼굴", src: "/face-check/views/turn-left.jpg" },
  { id: "turn-right", label: "오른쪽 옆얼굴", src: "/face-check/views/turn-right.jpg" },
  { id: "up", label: "턱 밑", src: "/face-check/views/up.jpg" },
  { id: "top", label: "정수리", src: "/face-check/views/top.jpg" },
];

const TURN_TARGET: Record<FaceTurn, FaceViewId> = { left: "turn-left", right: "turn-right", up: "up", down: "top" };
const OPPOSITE_TURN: Record<FaceTurn, FaceTurn> = { left: "right", right: "left", up: "down", down: "up" };

/**
 * 지금 각도에서 얼굴을 한 번 더 돌렸을 때의 각도. 얼굴을 잡아 끄는 방향 기준이다
 * (오른쪽으로 끌면 얼굴이 오른쪽을 보고, 위로 끌면 턱이 들린다). 더 돌릴 수 없으면 null.
 */
export function turnFaceView(current: FaceViewId, turn: FaceTurn): FaceViewId | null {
  if (current === "front") return TURN_TARGET[turn];
  const currentTurn = (Object.keys(TURN_TARGET) as FaceTurn[]).find((key) => TURN_TARGET[key] === current);
  if (!currentTurn || turn === currentTurn) return null;
  return turn === OPPOSITE_TURN[currentTurn] ? "front" : TURN_TARGET[turn];
}

const CALLOUT_SIZE = 296;
const callout = {
  topLeft: { x: 20, y: 20, size: CALLOUT_SIZE },
  topRight: { x: 468, y: 20, size: CALLOUT_SIZE },
  bottomLeft: { x: 20, y: 852, size: CALLOUT_SIZE },
  bottomRight: { x: 468, y: 852, size: CALLOUT_SIZE },
} as const;

const mirror = (box: FaceBox): FaceBox => ({ ...box, x: FACE_MODEL.width - box.x - box.size });

/** 오른쪽 옆얼굴 좌표를 좌우 반전한 왼쪽 옆얼굴(이미지도 반전본)까지 함께 만든다. */
function sidePlacements(marker: FaceBox, calloutBox: FaceBox): FacePlacement[] {
  return [
    { view: "turn-right", marker, callout: calloutBox },
    { view: "turn-left", marker: mirror(marker), callout: mirror(calloutBox) },
  ];
}

export const FACE_ZONES: FaceZone[] = [
  {
    id: "forehead", label: "이마", description: "헤어라인 아래부터 눈썹 위까지", cropView: "front", crop: { x: 277, y: 205, size: 230 },
    placements: [{ view: "front", marker: { x: 340, y: 268, size: 104 }, callout: callout.topLeft }],
  },
  {
    id: "eyes", label: "눈가", description: "눈 밑과 눈꼬리 주변", cropView: "front", crop: { x: 445, y: 448, size: 200 },
    placements: [
      { view: "front", marker: { x: 495, y: 498, size: 100 }, callout: callout.topRight },
      ...sidePlacements({ x: 480, y: 465, size: 100 }, callout.topLeft),
    ],
  },
  {
    id: "nose", label: "코", description: "콧등·코끝과 콧방울 옆", cropView: "front", crop: { x: 292, y: 535, size: 200 },
    placements: [{ view: "front", marker: { x: 342, y: 585, size: 100 }, callout: callout.bottomRight }],
  },
  {
    id: "cheek", label: "볼", description: "광대 아래 양쪽 볼", cropView: "front", crop: { x: 132, y: 580, size: 200 },
    placements: [
      { view: "front", marker: { x: 182, y: 630, size: 100 }, callout: callout.bottomLeft },
      ...sidePlacements({ x: 450, y: 600, size: 100 }, callout.bottomLeft),
    ],
  },
  {
    id: "chin", label: "입가·턱", description: "입 주변과 턱 앞쪽", cropView: "front", crop: { x: 282, y: 780, size: 220 },
    placements: [{ view: "front", marker: { x: 337, y: 835, size: 110 }, callout: callout.bottomLeft }],
  },
  {
    id: "jawline", label: "턱선", description: "귀 밑에서 턱 끝까지 · 얼굴을 옆으로 돌려요", cropView: "turn-right", crop: { x: 350, y: 720, size: 220 },
    placements: sidePlacements({ x: 405, y: 780, size: 110 }, callout.bottomLeft),
  },
  {
    id: "neck", label: "턱 밑·목", description: "턱 아래와 목 앞쪽 · 턱을 들어요", cropView: "up", crop: { x: 242, y: 510, size: 300 },
    placements: [{ view: "up", marker: { x: 332, y: 600, size: 120 }, callout: callout.bottomLeft }],
  },
  {
    id: "crown", label: "정수리", description: "가르마와 정수리 두피 · 고개를 숙여요", cropView: "top", crop: { x: 265, y: 240, size: 280 },
    placements: [{ view: "top", marker: { x: 345, y: 320, size: 120 }, callout: callout.topLeft }],
  },
];

export const FACE_SYMPTOMS: FaceSymptom[] = [
  {
    id: "forehead-oily", zone: "forehead", label: "번들거림", summary: "오후가 되면 이마가 반질거려요",
    looks: ["세안하고 몇 시간만 지나도 이마에 유분이 올라와요", "빛을 받으면 이마가 반질반질하게 반사돼요", "앞머리가 닿는 부분이 쉽게 답답해져요"],
    care: "유분을 모두 없애려 하기보다 가벼운 제형으로 수분을 채우고, 유분 균형 성분을 꾸준히 써 보세요.",
    concerns: ["유분·번들거림"], signals: { oilinessLevel: "HIGH" },
  },
  {
    id: "forehead-acne", zone: "forehead", label: "좁쌀·여드름", summary: "오돌토돌한 알갱이가 올라와요",
    looks: ["살색이나 흰색의 작은 알갱이가 오돌토돌 만져져요", "가끔 붉게 올라오는 뾰루지가 섞여 있어요", "헤어라인이나 앞머리가 닿는 곳에 몰려 있어요"],
    care: "헤어 제품과 앞머리가 닿는지 먼저 살피고, 진정·유분 균형 성분을 가볍게 써 보세요.",
    concerns: ["트러블·여드름"], signals: { breakoutFrequency: "FREQUENT", breakoutZones: ["이마"] },
  },
  {
    id: "forehead-wrinkle", zone: "forehead", label: "이마 주름", summary: "가로 선이 옅게 남아 있어요",
    looks: ["표정을 풀어도 가로 선이 옅게 남아 있어요", "눈썹을 올리면 선이 더 깊어져요", "메이크업이 선을 따라 끼어요"],
    care: "보습으로 겉을 먼저 편안하게 하고, 탄력·항산화 성분과 자외선 차단을 함께 챙겨 보세요.",
    concerns: ["탄력·잔주름"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "forehead-flaky", zone: "forehead", label: "각질·들뜸", summary: "하얗게 일어나고 거칠어요",
    looks: ["하얗게 일어난 각질이 보여요", "손으로 만지면 거칠고 화장이 들떠요", "세안 직후 유난히 당겨요"],
    care: "문질러 벗겨내기보다 장벽·보습 성분으로 먼저 편안하게 한 뒤, 각질 케어는 주 1~2회로 시작해 보세요.",
    concerns: ["장벽·각질"], signals: { cleansingTightness: "LONG" },
  },
  {
    id: "eyes-wrinkle", zone: "eyes", label: "눈가 잔주름", summary: "눈꼬리와 눈 밑에 가는 선이 보여요",
    looks: ["웃을 때 생긴 눈꼬리 선이 표정을 풀어도 남아요", "눈 밑에 가는 선이 여러 줄 보여요", "컨실러가 선에 끼어요"],
    care: "눈가는 피부가 얇아 건조에 먼저 반응해요. 보습을 채우고 탄력 성분은 순한 제품부터 시작해 보세요.",
    concerns: ["탄력·잔주름"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "eyes-dry", zone: "eyes", label: "눈 밑 건조", summary: "푸석하고 자글자글해 보여요",
    looks: ["눈 밑이 푸석하고 잔 선이 자글자글해 보여요", "오후가 되면 눈가 화장이 갈라져요", "당기거나 살짝 따가운 느낌이 있어요"],
    care: "가벼운 보습을 여러 번 겹쳐 바르고, 각질 케어 성분은 눈가를 피해 주세요.",
    concerns: ["속건조·당김"], signals: { hydrationLevel: "LOW" },
  },
  {
    id: "eyes-dark", zone: "eyes", label: "다크서클·칙칙함", summary: "눈 밑이 어둡게 그늘져 보여요",
    looks: ["눈 밑이 갈색이나 푸르스름하게 어두워 보여요", "피곤하지 않은 날에도 그늘져 보여요", "눈가 톤이 얼굴보다 한 톤 어두워요"],
    care: "화장품은 눈가의 톤과 건조함을 가꾸는 정도예요. 피부톤·항산화 성분과 자외선 차단, 수면을 함께 챙겨 보세요.",
    concerns: ["잡티·칙칙함"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "nose-blackhead", zone: "nose", label: "블랙헤드", summary: "까만 점처럼 박힌 모공이 보여요",
    looks: ["코에 까만 점처럼 박힌 모공이 보여요", "만지면 오돌토돌 거칠어요", "짜내도 며칠 뒤 다시 차올라요"],
    care: "억지로 짜면 모공이 늘어나요. 유분 균형·각질 케어 성분으로 천천히 정돈하는 쪽이 좋아요.",
    concerns: ["블랙헤드·모공"], signals: { poreLevel: "HIGH" },
  },
  {
    id: "nose-pore", zone: "nose", label: "넓은 모공", summary: "코와 콧방울 옆 모공이 열려 보여요",
    looks: ["코와 콧방울 옆 모공이 동그랗게 열려 보여요", "베이스 메이크업이 모공에 끼어요", "오후가 되면 더 도드라져요"],
    care: "유분이 늘면 모공이 더 눈에 띄어요. 유분 균형 성분과 가벼운 보습으로 결을 정돈해 보세요.",
    concerns: ["블랙헤드·모공"], signals: { poreLevel: "HIGH" },
  },
  {
    id: "nose-oily", zone: "nose", label: "번들거림", summary: "코끝과 콧등이 금방 번들거려요",
    looks: ["코끝과 콧등이 금방 번들거려요", "기름종이를 대면 유분이 많이 묻어나요", "화장이 코부터 무너져요"],
    care: "세안을 세게 하면 유분이 더 올라올 수 있어요. 순한 세안과 유분 균형 성분으로 균형을 맞춰 보세요.",
    concerns: ["유분·번들거림"], signals: { oilinessLevel: "HIGH" },
  },
  {
    id: "nose-redflake", zone: "nose", label: "콧방울 붉은기·각질", summary: "콧방울 옆이 붉고 각질이 일어나요",
    looks: ["콧방울 옆 주름을 따라 붉어져 있어요", "하얀 각질이 반복해서 일어나요", "코를 자주 풀거나 닦은 뒤 심해져요"],
    care: "마찰을 줄이고 진정·장벽 성분으로 보호막을 채워 주세요. 붉은기와 각질이 오래 반복되면 피부과 상담을 권해요.",
    concerns: ["붉은기·민감", "장벽·각질"], signals: { rednessFrequency: "FREQUENT" },
  },
  {
    id: "cheek-redness", zone: "cheek", label: "붉은기·홍조", summary: "볼이 넓게 붉고 쉽게 달아올라요",
    looks: ["볼이 넓게 붉고 쉽게 달아올라요", "온도 차이나 세안 뒤에 더 붉어져요", "가는 실핏줄이 비쳐 보이기도 해요"],
    care: "뜨거운 물과 마찰을 피하고, 진정·장벽 성분을 중심으로 단순하게 발라 보세요.",
    concerns: ["붉은기·민감"], signals: { rednessFrequency: "FREQUENT" },
  },
  {
    id: "cheek-dry", zone: "cheek", label: "속건조·당김", summary: "겉은 멀쩡한데 속이 당겨요",
    looks: ["겉은 멀쩡한데 웃을 때 볼이 당겨요", "오후가 되면 볼이 푸석하고 잔 선이 보여요", "화장이 볼에서 들뜨거나 갈라져요"],
    care: "수분을 끌어당기는 성분과 장벽 성분을 함께 써서, 채운 수분이 날아가지 않게 해 보세요.",
    concerns: ["속건조·당김"], signals: { hydrationLevel: "LOW", cheekOiliness: "LOW" },
  },
  {
    id: "cheek-acne", zone: "cheek", label: "여드름·트러블", summary: "붉은 뾰루지와 자국이 남아요",
    looks: ["볼에 붉게 올라온 뾰루지가 여러 개 있어요", "가라앉은 자리에 붉거나 갈색 자국이 남아요", "마스크나 손이 닿는 곳에 반복돼요"],
    care: "손·마스크·베개가 닿는 것을 줄이고 진정 성분을 가볍게 써 보세요. 크고 아픈 여드름이 계속되면 피부과 상담을 권해요.",
    concerns: ["트러블·여드름"], signals: { breakoutFrequency: "FREQUENT", breakoutZones: ["볼"] },
  },
  {
    id: "cheek-pore", zone: "cheek", label: "늘어진 모공", summary: "모공이 세로로 길쭉해 보여요",
    looks: ["코 옆 볼의 모공이 세로로 길쭉해 보여요", "볼을 위로 당기면 모공이 덜 보여요", "피부 결이 귤껍질처럼 보일 때가 있어요"],
    care: "세로로 늘어진 모공은 탄력과 함께 봐야 해요. 유분 균형과 탄력 성분을 같이 챙겨 보세요.",
    concerns: ["블랙헤드·모공", "탄력·잔주름"], signals: { poreLevel: "HIGH" },
  },
  {
    id: "cheek-spot", zone: "cheek", label: "기미·잡티", summary: "갈색 얼룩과 점이 흩어져 있어요",
    looks: ["광대와 볼에 갈색 얼룩이나 점이 흩어져 있어요", "여름이 지나면 더 짙어져요", "피부톤이 얼룩덜룩하고 칙칙해 보여요"],
    care: "자외선 차단이 기본이에요. 피부톤·항산화 성분은 꾸준히 써야 차이를 느낄 수 있어요.",
    concerns: ["잡티·칙칙함"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "chin-acne", zone: "chin", label: "턱 여드름", summary: "턱과 턱선에 반복해서 올라와요",
    looks: ["턱과 턱선에 단단하고 붉은 여드름이 올라와요", "같은 자리에 주기적으로 반복돼요", "누르면 아프거나 속에서 만져져요"],
    care: "턱을 괴는 습관과 마스크 마찰을 줄이고 진정·유분 균형 성분을 써 보세요. 깊고 아픈 여드름이 반복되면 피부과 상담을 권해요.",
    concerns: ["트러블·여드름"], signals: { breakoutFrequency: "FREQUENT", breakoutZones: ["턱·입가"] },
  },
  {
    id: "chin-flaky", zone: "chin", label: "입가 각질·건조", summary: "입 주변이 하얗게 일어나요",
    looks: ["입꼬리와 입 주변이 하얗게 일어나요", "말하거나 웃을 때 당기고 갈라져요", "립 제품이나 치약이 닿은 뒤 심해져요"],
    care: "입가는 움직임이 많아 쉽게 건조해져요. 장벽·보습 성분을 얇게 자주 덧발라 보세요.",
    concerns: ["장벽·각질", "속건조·당김"], signals: { cleansingTightness: "LONG", hydrationLevel: "LOW" },
  },
  {
    id: "chin-wrinkle", zone: "chin", label: "팔자·입가 주름", summary: "입가에 선이 남아 있어요",
    looks: ["코 옆에서 입꼬리로 내려오는 선이 깊어 보여요", "웃지 않아도 입가에 선이 남아요", "볼 아래가 처져 보이는 느낌이 있어요"],
    care: "보습으로 겉 주름을 먼저 편안하게 하고, 탄력·항산화 성분과 자외선 차단을 꾸준히 이어가 보세요.",
    concerns: ["탄력·잔주름"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "jawline-acne", zone: "jawline", label: "턱선 여드름", summary: "턱선을 따라 줄지어 올라와요",
    looks: ["귀 밑에서 턱 끝으로 이어지는 선을 따라 올라와요", "단단하게 뭉쳐 오래가는 편이에요", "마스크 끈이나 손이 닿는 자리에 반복돼요"],
    care: "마스크 끈·손·머리카락이 닿는 것을 줄이고 진정·유분 균형 성분을 써 보세요. 깊고 아픈 여드름이 반복되면 피부과 상담을 권해요.",
    concerns: ["트러블·여드름"], signals: { breakoutFrequency: "FREQUENT", breakoutZones: ["턱·입가"] },
  },
  {
    id: "jawline-mark", zone: "jawline", label: "여드름 자국", summary: "가라앉은 자리에 얼룩이 남아요",
    looks: ["여드름이 가라앉은 자리에 붉거나 갈색 얼룩이 남아요", "만지면 평평한데 색만 달라 보여요", "몇 달이 지나도 옅어지는 속도가 느려요"],
    care: "자국은 자외선을 받으면 더 오래가요. 자외선 차단을 기본으로 하고 피부톤·항산화 성분을 꾸준히 써 보세요.",
    concerns: ["잡티·칙칙함"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "jawline-sagging", zone: "jawline", label: "턱선 처짐", summary: "옆에서 보면 턱선이 흐릿해요",
    looks: ["옆에서 보면 턱선이 흐릿하고 둥글게 보여요", "볼 아래 살이 턱선 밑으로 내려온 느낌이에요", "사진을 찍으면 얼굴 아래쪽이 넓어 보여요"],
    care: "화장품은 겉 피부의 탄력과 보습을 가꾸는 범위예요. 탄력·항산화 성분을 꾸준히 쓰고 자외선 차단을 함께 챙겨 보세요.",
    concerns: ["탄력·잔주름"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "neck-wrinkle", zone: "neck", label: "목주름", summary: "목에 가로 선이 남아 있어요",
    looks: ["목에 가로로 난 선이 고개를 들어도 남아 있어요", "스마트폰을 볼 때 접히는 자리에 선이 깊어져요", "목 피부가 얼굴보다 얇고 건조해 보여요"],
    care: "목은 피지선이 적어 쉽게 건조해져요. 얼굴에 쓰는 보습·탄력 제품을 목까지 이어 바르고 자외선 차단도 함께 해 주세요.",
    concerns: ["탄력·잔주름"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "neck-sagging", zone: "neck", label: "턱 밑 처짐", summary: "턱 밑이 접혀 두 겹으로 보여요",
    looks: ["고개를 숙이면 턱 밑이 접혀 두 겹으로 보여요", "턱과 목의 경계가 흐릿해요", "턱 밑 피부가 늘어진 느낌이에요"],
    care: "턱 밑 살 자체는 화장품으로 바뀌지 않아요. 화장품은 겉 피부의 탄력과 보습을 돕는 정도로 생각하고 탄력 성분을 목까지 이어 발라 보세요.",
    concerns: ["탄력·잔주름"], signals: { sunscreenUsage: "SOMETIMES" },
  },
  {
    id: "neck-acne", zone: "neck", label: "턱 밑 여드름", summary: "턱 아래와 목에 올라와요",
    looks: ["턱 아래와 목 위쪽에 붉은 뾰루지가 올라와요", "옷깃이나 머리카락이 닿는 곳에 반복돼요", "면도나 마찰 뒤에 더 심해져요"],
    care: "옷깃·머리카락·면도 마찰을 줄이고 진정 성분을 가볍게 써 보세요. 넓게 번지거나 아프면 피부과 상담을 권해요.",
    concerns: ["트러블·여드름"], signals: { breakoutFrequency: "FREQUENT", breakoutZones: ["턱·입가"] },
  },
  {
    id: "neck-dry", zone: "neck", label: "목 건조·거칠음", summary: "목이 푸석하고 거칠어요",
    looks: ["목이 푸석하고 만지면 거칠어요", "샤워한 뒤 목이 당기거나 가려워요", "옷깃이 닿는 곳이 쉽게 붉어져요"],
    care: "뜨거운 물과 세정력이 강한 제품을 줄이고, 보습·장벽 성분을 목까지 넉넉히 발라 보세요.",
    concerns: ["속건조·당김", "장벽·각질"], signals: { hydrationLevel: "LOW", cleansingTightness: "LONG" },
  },
  {
    id: "crown-thinning", zone: "crown", label: "정수리 숱·볼륨", summary: "가르마가 넓어 보이고 힘이 없어요",
    looks: ["가르마가 예전보다 넓어 보여요", "정수리 머리카락이 가늘고 힘없이 가라앉아요", "위에서 찍은 사진에 두피가 비쳐 보여요"],
    care: "두피를 자극 없이 깨끗하게 유지하고 볼륨·두피 케어 제품을 써 보세요. 숱이 눈에 띄게 줄거나 빠지는 양이 늘었다면 피부과 상담을 권해요.",
    concerns: [], productCategory: "헤어케어", signals: {},
  },
  {
    id: "crown-oily", zone: "crown", label: "두피 유분·떡짐", summary: "감은 지 얼마 안 돼 떡져요",
    looks: ["감은 지 하루가 안 돼 정수리가 떡져요", "두피에서 냄새가 나거나 가려워요", "뿌리 볼륨이 금방 죽어요"],
    care: "샴푸는 두피를 중심으로 충분히 헹구고, 트리트먼트는 모발 끝에만 발라 보세요.",
    concerns: [], productCategory: "헤어케어", signals: {},
  },
  {
    id: "crown-flaky", zone: "crown", label: "두피 각질·비듬", summary: "가르마에 하얀 각질이 보여요",
    looks: ["가르마를 따라 하얀 각질이 보여요", "어두운 옷에 가루가 떨어져요", "두피가 건조하거나 가려워요"],
    care: "뜨거운 물과 손톱으로 긁는 습관을 줄이고 두피 전용 제품을 써 보세요. 각질이 두껍게 반복되거나 붉게 번지면 피부과 상담을 권해요.",
    concerns: [], productCategory: "헤어케어", signals: {},
  },
];

/** 부위를 고르지 않았을 때 보여 주는 대표 증상. 화력의 8개 고민과 새로 돌려 볼 수 있는 부위를 대표한다. */
export const REPRESENTATIVE_SYMPTOM_IDS = [
  "cheek-dry", "forehead-oily", "cheek-acne", "nose-blackhead",
  "cheek-redness", "chin-flaky", "cheek-spot", "eyes-wrinkle",
  "neck-wrinkle", "crown-thinning",
] as const;

/** 지금 각도에서 부위가 보이는 자리. 보이지 않는 각도면 null. */
export function zonePlacement(zone: FaceZone, viewId: FaceViewId): FacePlacement | null {
  return zone.placements.find((placement) => placement.view === viewId) ?? null;
}

/** 부위를 골랐을 때 보여 줄 각도. 지금 각도에서 보이면 그대로 두고, 아니면 기본 각도로 돌린다. */
export function viewForZone(zone: FaceZone, currentView: FaceViewId): FaceViewId {
  return zonePlacement(zone, currentView) ? currentView : zone.placements[0].view;
}

export function findFaceView(id: unknown): FaceView | null {
  return FACE_VIEWS.find((view) => view.id === id) ?? null;
}

export function findFaceZone(id: unknown): FaceZone | null {
  return FACE_ZONES.find((zone) => zone.id === id) ?? null;
}

export function findFaceSymptom(id: unknown): FaceSymptom | null {
  return FACE_SYMPTOMS.find((symptom) => symptom.id === id) ?? null;
}

export function symptomsForZone(zoneId: FaceZoneId | null): FaceSymptom[] {
  if (zoneId === null) return REPRESENTATIVE_SYMPTOM_IDS.map((id) => findFaceSymptom(id)!);
  return FACE_SYMPTOMS.filter((symptom) => symptom.zone === zoneId);
}

export function faceZoneImage(zoneId: FaceZoneId): string {
  return `/face-check/zones/${zoneId}.webp`;
}

export function faceSymptomImage(symptomId: string): string {
  return `/face-check/symptoms/${symptomId}.webp`;
}
