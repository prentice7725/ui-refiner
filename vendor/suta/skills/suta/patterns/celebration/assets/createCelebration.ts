/**
 * 프레임워크 무관 축하 코어 (의존성 0).
 *
 * 축하 연출에서 JS가 맡는 것은 한 번 터지는 조각의 궤적뿐이다 — 화면을 그릴 때마다 모양이 바뀌지 않게 seed로 정한다.
 * 움직임 자체는 CSS(transform·opacity)가 하고, 띄우기·포커스·Esc는 네이티브 <dialog>가 한다.
 * 자주 생기는 작은 적립(+3P)은 이 오버레이가 아니라 토스트 한 줄로 알린다 — 모달은 어두운 막이 화면 전체라 "읽는 중에는 멈추는" 자동 닫힘을 만들 수 없다.
 *
 * 바닐라 사용: burstPieces({ count: 14, seed: 1 })로 조각 요소의 --x·--y·--r·--delay를 채운다
 * React 사용: Celebration.tsx가 이 코어를 감싼다.
 */

export type BurstPiece = {
  /** 가운데에서 날아갈 거리(px) — 오른쪽·아래가 양수 */
  x: number
  y: number
  /** 날아가며 도는 각도(deg) */
  rotate: number
  /** 시작 지연(ms) — 조각이 한꺼번에 뜨지 않고 한 박자 안에 흩어진다 */
  delayMs: number
  /** 색 순번 0·1·2 — CSS가 보상 색·강조색·은색으로 칠한다 */
  tone: 0 | 1 | 2
  /** 모양 — 막대와 점을 섞는다 */
  shape: 'bar' | 'dot'
}

type BurstOptions = {
  count: number
  seed: number
  minDistance?: number
  maxDistance?: number
}

/** 작은 결정적 난수 — 같은 seed면 같은 수열(mulberry32) */
const random = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (value: number) => Math.round(value * 100) / 100

/** 위로 펼친 부채꼴 — 왼쪽 옆(조금 아래)부터 위를 지나 오른쪽 옆(조금 아래)까지. 아래로 내려가면 제목·보상 글자를 가린다 */
const SPREAD_START = Math.PI - 0.25
const SPREAD = Math.PI + 0.5

/** 위와 양옆으로 고르게 퍼지는 조각 궤적 — 각도를 개수로 나눠 빈 방향이 없게 하고, 거리·회전·지연만 흔든다 */
export const burstPieces = ({ count, seed, minDistance = 64, maxDistance = 128 }: BurstOptions): BurstPiece[] => {
  const next = random(seed)
  return Array.from({ length: count }, (_, index) => {
    const slice = SPREAD / count
    const angle = SPREAD_START + (index + 0.5) * slice + (next() - 0.5) * slice * 0.6
    const distance = minDistance + next() * (maxDistance - minDistance)
    return {
      x: round(Math.cos(angle) * distance),
      y: round(Math.sin(angle) * distance),
      rotate: Math.round((next() * 2 - 1) * 180),
      delayMs: Math.round(next() * 120),
      tone: (index % 3) as 0 | 1 | 2,
      shape: index % 2 === 0 ? 'bar' : 'dot',
    }
  })
}

/** 동작 줄이기 설정 — 켜져 있으면 조각은 날아가지 않고 제자리에 놓이며, 보상 그림도 튀지 않는다(페이드만) */
export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
