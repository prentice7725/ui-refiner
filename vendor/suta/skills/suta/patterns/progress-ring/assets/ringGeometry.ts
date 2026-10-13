/**
 * 진행 링의 순수 기하 계산 (의존성 0, DOM 없음).
 *
 * 링은 SVG <circle>의 stroke-dasharray/dashoffset 트릭으로 그린다:
 *   dasharray = 둘레, dashoffset = 둘레 × (1 − 진행률)
 * offset이 둘레와 같으면 획이 전부 숨고, 0이면 한 바퀴가 다 보인다.
 * 이 파일은 그 숫자만 계산한다 — 실제 이동은 CSS transition이 맡는다.
 *
 * 바닐라 사용: circle.style.setProperty('--ring-offset', `${dashOffset({ radius, progress })}px`)
 * React 사용: ProgressRing.tsx · ActivityRings.tsx가 이 계산을 감싼다.
 */

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1)

/** 반지름 → 둘레(2πr). stroke-dasharray에 그대로 넣는다 */
export const circumference = ({ radius }: { radius: number }) => 2 * Math.PI * radius

/** 진행률(0~1, 범위 밖은 클램프) → stroke-dashoffset. 0이면 빈 링(둘레 전체), 1이면 가득 찬 링(0) */
export const dashOffset = ({ radius, progress }: { radius: number; progress: number }) =>
  circumference({ radius }) * (1 - clamp01(progress))

/**
 * 값/목표 → 0~1 진행률과 초과 여부.
 * 목표를 넘겨도 링은 한 바퀴에서 멈춘다(over로 표시) — 한 바퀴 더 그려 겹치면 "얼마나 넘었는지"가 안 보인다.
 * max가 0 이하면 나눌 수 없으니 0으로 취급한다.
 */
export const clampProgress = ({ value, max = 100 }: { value: number; max?: number }) => {
  if (max <= 0) return { progress: 0, over: false }
  const ratio = value / max
  return { progress: clamp01(ratio), over: ratio > 1 }
}

/**
 * 겹친 링 count개의 반지름을 바깥부터 안쪽으로 돌려준다.
 * 바깥 링은 캔버스 절반에서 획 두께 절반을 뺀다 — 획의 바깥 절반이 캔버스 밖으로 잘리지 않게.
 * 안쪽으로 갈수록 (획 두께 + 간격)만큼 줄어든다.
 */
export const ringRadii = ({ size, stroke, gap, count }: { size: number; stroke: number; gap: number; count: number }) =>
  Array.from({ length: Math.max(0, count) }, (_, index) => size / 2 - stroke / 2 - index * (stroke + gap))
