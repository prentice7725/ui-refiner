/**
 * 핀치 제스처 순수 계산 (의존성 0, DOM 없음) — 테스트 대상은 여기다.
 * 두 손가락의 거리 비율이 배율, 두 손가락 중점의 이동이 평행이동이다.
 */

export type Point = { x: number; y: number }
export type Pair = [Point, Point]

export const distance = (pair: Pair) => Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y)

export const midpoint = (pair: Pair): Point => ({
  x: (pair[0].x + pair[1].x) / 2,
  y: (pair[0].y + pair[1].y) / 2,
})

type ComputePinchOptions = {
  start: Pair
  current: Pair
  /** 최대 배율 (기본 4) */
  maxScale?: number
  /** 최소 배율 (기본 1 — 원본보다 작게는 안 줄어든다) */
  minScale?: number
}

export type PinchTransform = { scale: number; tx: number; ty: number }

/** 시작 손가락 쌍 대비 현재 손가락 쌍으로 배율·이동을 계산한다 */
export const computePinch = ({ start, current, maxScale = 4, minScale = 1 }: ComputePinchOptions): PinchTransform => {
  const startDistance = distance(start)
  const ratio = startDistance === 0 ? 1 : distance(current) / startDistance
  const scale = Math.min(maxScale, Math.max(minScale, ratio))
  const from = midpoint(start)
  const to = midpoint(current)
  return { scale, tx: to.x - from.x, ty: to.y - from.y }
}

/** 배경 딤 진행도 0~1 — dimAtScale 배율에서 완전히 어두워진다 (기본 2배) */
export const dimProgress = ({ scale, dimAtScale = 2 }: { scale: number; dimAtScale?: number }) =>
  Math.min(1, Math.max(0, (scale - 1) / (dimAtScale - 1)))
