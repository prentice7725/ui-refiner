/**
 * 가장자리 스와이프 뒤로가기 순수 계산 (의존성 0, DOM 없음).
 * 시작 위치 판정 → 끈 거리의 진행도 → 놓는 순간의 커밋 판정 → 이전 화면이 따라오는 프레임까지,
 * 측정값을 넣으면 답이 나오는 함수만 모았다(제스처 처리는 createEdgeSwipe.ts).
 */

/** 컨테이너 왼쪽 가장자리 edgeWidth(px) 안에서 시작한 포인터인가. x는 컨테이너 기준 좌표 */
export const isEdgeStart = ({ x, edgeWidth = 24 }: { x: number; edgeWidth?: number }) => x >= 0 && x <= edgeWidth

/** 오른쪽으로 끈 거리(px)를 컨테이너 폭 대비 0~1 진행도로. 왼쪽(음수)은 0, 폭이 0이면(레이아웃 전) 0 */
export const progressFrom = ({ dx, width }: { dx: number; width: number }) => {
  if (width <= 0) return 0
  return Math.min(1, Math.max(0, dx / width))
}

/** 왼쪽으로 튕겼다고 보는 속도(px/ms) — 거리를 넘겼어도 되돌리려는 뜻이다 */
const CANCEL_VELOCITY = -0.3

/**
 * 놓는 순간 뒤로 갈지 — 거리 임계 또는 오른쪽 속도 임계 중 하나만 넘어도 간다.
 * 단, 왼쪽으로 튕기면(velocity ≤ −0.3px/ms) 거리와 무관하게 취소한다 — 끌다가 마음을 바꾼 손짓이다.
 */
export const shouldCommit = ({
  progress,
  velocity,
  threshold = 0.4,
  velocityThreshold = 0.5,
}: {
  progress: number
  /** 놓는 순간의 가로 속도(px/ms). 오른쪽이 양수 */
  velocity: number
  threshold?: number
  velocityThreshold?: number
}) => {
  if (velocity <= CANCEL_VELOCITY) return false
  return progress >= threshold || velocity >= velocityThreshold
}

/**
 * 이전 화면의 프레임 — 진행도 0에서 −shift(기본 30%)만큼 왼쪽에 물러나 어둡게(dim 0.4) 있다가,
 * 진행도 1에서 제자리(0%)로 오고 어둠이 걷힌다. 100%가 아니라 30%만 움직이는 것이 "뒤에 남아 있다"는 느낌을 만든다(iOS 관례).
 */
export const underlayFrame = ({ progress, shift = 0.3, dim = 0.4 }: { progress: number; shift?: number; dim?: number }) => ({
  // (progress − 1)로 곱해 진행도 1에서 −0이 아니라 0이 나오게 한다(문자열로 쓰면 "-0%"가 된다)
  translateXPercent: shift * 100 * (progress - 1),
  dimOpacity: dim * (1 - progress),
})
