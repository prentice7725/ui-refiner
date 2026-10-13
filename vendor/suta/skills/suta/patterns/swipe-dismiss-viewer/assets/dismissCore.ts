/**
 * 끌어내려 닫기 순수 계산 (의존성 0, DOM 없음).
 * 드래그 거리 → 진행도/배율, 놓는 순간 판정, 두 프레임 사이 보간을 담당한다.
 */

export type Frame = { x: number; y: number; scale: number }

/** 드래그 거리(px)를 0~1 진행도로 — distance만큼 끌면 1 */
export const dismissProgress = ({ dy, distance = 240 }: { dy: number; distance?: number }) =>
  Math.min(1, Math.abs(dy) / distance)

/** 진행도에 따른 배율 — 1에서 minScale까지 선형 축소 (iOS Photos는 대략 0.6~0.7까지) */
export const dismissScale = ({ progress, minScale = 0.65 }: { progress: number; minScale?: number }) =>
  1 - (1 - minScale) * progress

/** 놓는 순간 닫을지 — 거리 임계 또는 세로 속도 임계(px/s) */
export const shouldDismiss = ({
  dy,
  velocityY,
  thresholdPx = 120,
  velocityThreshold = 800,
}: {
  dy: number
  velocityY: number
  thresholdPx?: number
  velocityThreshold?: number
}) => Math.abs(dy) >= thresholdPx || Math.abs(velocityY) >= velocityThreshold

/** 화면 좌우 가장자리에서 시작한 제스처인가 — 브라우저 뒤로/앞으로 스와이프와 겹치므로 무시한다 */
export const isEdgeStart = ({ x, viewportWidth, edgePx = 24 }: { x: number; viewportWidth: number; edgePx?: number }) =>
  x <= edgePx || x >= viewportWidth - edgePx

/** 두 프레임 사이 보간 — t 0이면 from, 1이면 to */
export const interpolateFrame = ({ from, to, t }: { from: Frame; to: Frame; t: number }): Frame => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
  scale: from.scale + (to.scale - from.scale) * t,
})

/**
 * 썸네일 rect → 뷰어 중앙 이미지 기준의 프레임. 뷰어 이미지는 화면 중앙에 (imageWidth×imageHeight)로 놓여 있고,
 * 썸네일 자리로 "돌아간" 상태를 translate+scale로 표현한다 (공유 요소 전환의 FLIP 계산).
 */
export const frameFromRect = ({
  rect,
  image,
}: {
  rect: { left: number; top: number; width: number; height: number }
  image: { left: number; top: number; width: number; height: number }
}): Frame => {
  const scale = rect.width / image.width
  const x = rect.left + rect.width / 2 - (image.left + image.width / 2)
  const y = rect.top + rect.height / 2 - (image.top + image.height / 2)
  return { x, y, scale }
}
