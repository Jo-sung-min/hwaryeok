/**
 * 선택이 바뀌었을 때의 짧은 진동.
 * 진동을 지원하지 않는 기기(iOS 사파리 등)에서는 아무 일도 하지 않는다.
 * 앱으로 감쌀 때는 이 함수 안에서 네이티브 햅틱을 부르면 된다.
 */
export function selectionHaptic() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(8);
}
