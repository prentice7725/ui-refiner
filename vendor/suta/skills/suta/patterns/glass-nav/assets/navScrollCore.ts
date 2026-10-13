/**
 * glass-nav 순수 판정 코어 (의존성 0, DOM 없음).
 *
 * 스크롤 위치·방향으로 GNB의 세 상태를 정한다:
 *  - elevated — 맨 위(0)에서는 투명, threshold를 넘으면 유리(배경·흐림·테두리)로. 배민 홈·카카오맵 검색 바
 *  - hidden   — 아래로 스크롤하면 위로 숨고, 조금이라도 위로 올리면 다시 나타난다. 배민·카카오 목록 화면
 *  - compact  — 아래로 스크롤하면 링크가 접혀 알약으로 줄고, 위로 올리면 펼쳐진다. iOS 26 Liquid Glass 탭 바
 * hidden과 compact는 같은 신호(방향)를 쓰고 표현만 다르다 — mode로 하나를 고른다.
 *
 * 왜 "방향"에 최소 이동량(minDelta)을 두는가: 손가락이 멈칫할 때 1~2px 튀는 스크롤로 바가 들썩이지 않게.
 * 왜 hideAfter가 있는가: 화면 맨 위 근처에서는 숨기지 않는다 — 바가 사라질 만큼 내용이 없다.
 */

export type NavMode = 'elevate' | 'hide' | 'compact'

export type NavState = {
  elevated: boolean
  hidden: boolean
  compact: boolean
  /** 마지막으로 판정에 쓴 scrollTop — 다음 판정의 기준점 */
  anchorY: number
}

export type NavOptions = {
  mode?: NavMode
  /** 이만큼 내려가면 투명 → 유리 (px, 기본 8) */
  thresholdPx?: number
  /** 이만큼 내려간 뒤부터 숨기기·축소가 시작된다 (px, 기본 80) */
  hideAfterPx?: number
  /** 방향이 바뀌었다고 볼 최소 이동량 (px, 기본 6) — 미세한 튐 무시 */
  minDeltaPx?: number
}

export const INITIAL_NAV_STATE: NavState = { elevated: false, hidden: false, compact: false, anchorY: 0 }

const DEFAULTS: Required<NavOptions> = { mode: 'elevate', thresholdPx: 8, hideAfterPx: 80, minDeltaPx: 6 }

export const reduceNavState = ({ prev, scrollTop, options }: { prev: NavState; scrollTop: number; options?: NavOptions }): NavState => {
  const { mode, thresholdPx, hideAfterPx, minDeltaPx } = { ...DEFAULTS, ...options }
  const y = Math.max(0, scrollTop) // iOS 고무줄(음수)은 0으로 — 맨 위와 같다
  const elevated = y > thresholdPx
  const delta = y - prev.anchorY

  // 방향 판정 — 최소 이동량을 넘겨야 기준점을 옮긴다. 그 안에서는 이전 상태를 유지
  if (Math.abs(delta) < minDeltaPx && y !== 0) {
    return { ...prev, elevated }
  }
  const goingDown = delta > 0
  const collapse = mode !== 'elevate' && goingDown && y > hideAfterPx
  // 위로 올리면 즉시 펼친다(delta<0). 맨 위(0)에서는 항상 펼친 상태
  const expand = !goingDown || y === 0
  const next = collapse ? true : expand ? false : mode === 'hide' ? prev.hidden : prev.compact

  return {
    elevated,
    hidden: mode === 'hide' ? next : false,
    compact: mode === 'compact' ? next : false,
    anchorY: y,
  }
}
