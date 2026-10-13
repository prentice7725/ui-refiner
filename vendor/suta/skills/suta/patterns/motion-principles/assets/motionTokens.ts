/**
 * motion-principles — 모션 토큰의 JS 쪽 정본 (의존성 0). motion-tokens.css와 같은 값이다.
 * CSS로 못 하는 곳(rAF 애니메이터·스프링·JS 타이머)에서 같은 시간·이징을 쓰기 위한 것.
 *
 * 두 파일의 값이 어긋나면 화면마다 속도가 달라지므로, 값을 바꿀 때는 둘 다 바꾼다(테스트가 비교한다).
 */

export type MotionSize = 'instant' | 'fast' | 'base' | 'slow' | 'page'

/** 무엇이 움직이는가 → 진입 시간(ms) */
export const DURATION: Record<MotionSize, number> = {
  instant: 100, // 색·불투명도 상태 변화
  fast: 150, // 작은 요소의 등장·퇴장
  base: 250, // 컴포넌트 전환
  slow: 350, // 화면 크기의 이동
  page: 420, // 화면 전환·공유 요소 확장
}

/** 퇴장 = 진입 × 0.75 — 결과를 이미 아는 사용자를 기다리게 하지 않는다 */
export const EXIT_RATIO = 0.75

export const EASE = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
  overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
} as const

/** 스프링(spring-physics 패턴)으로 같은 느낌을 낼 때의 프리셋 — stiffness·damping */
export const SPRING = {
  /** 기본 정착 — ease-out과 비슷한 느낌 */
  settle: { stiffness: 170, damping: 26 },
  /** 살짝 튐 — overshoot과 비슷한 느낌 */
  bouncy: { stiffness: 300, damping: 15 },
  /** 임계 감쇠 — 튐 없이 가장 빠르게 정착. 텍스트·레이아웃 */
  critical: { stiffness: 200, damping: 28 },
} as const

/** 목록 항목 사이 스태거(ms). 항목이 많으면 처음 maxItems개까지만 벌리고 나머지는 같이 나온다 */
export const STAGGER_MS = 30
export const STAGGER_MAX_ITEMS = 10

/** 진입 시간 → 퇴장 시간. 5ms 단위로 반올림해 CSS에 그대로 쓸 수 있게 한다 */
export const exitDuration = (enterMs: number) => Math.round((enterMs * EXIT_RATIO) / 5) * 5

/** 요소 크기·이동 거리로 시간을 고른다. 거리(px)가 주어지면 크기보다 우선한다 — 멀리 갈수록 길게 */
export const durationFor = ({ size, distancePx }: { size?: MotionSize; distancePx?: number }) => {
  if (distancePx != null) {
    if (distancePx < 24) return DURATION.fast
    if (distancePx < 160) return DURATION.base
    if (distancePx < 480) return DURATION.slow
    return DURATION.page
  }
  return DURATION[size ?? 'base']
}

/** index번째 항목의 스태거 지연(ms) — 상한을 넘는 항목은 상한에서 멈춘다 */
export const staggerDelay = ({ index, stepMs = STAGGER_MS, maxItems = STAGGER_MAX_ITEMS }: { index: number; stepMs?: number; maxItems?: number }) =>
  Math.min(index, Math.max(0, maxItems - 1)) * stepMs

/** cubic-bezier 문자열을 (t → 진행도) 함수로. 데모의 곡선 그리기와 테스트용. linear는 항등 */
export const cubicBezier = (easing: string) => {
  const m = easing.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/)
  if (!m) return (t: number) => t
  const [x1, y1, x2, y2] = m.slice(1).map(Number)
  const bez = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3
  // x(t)=목표 x가 되는 t를 이분 탐색으로 찾고 y(t)를 돌려준다 — CSS 타이밍 함수의 정의 그대로
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2
      if (bez(x1, x2, mid) < x) lo = mid
      else hi = mid
    }
    return bez(y1, y2, (lo + hi) / 2)
  }
}
