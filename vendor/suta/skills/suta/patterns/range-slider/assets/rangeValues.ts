/**
 * 범위 슬라이더 값 계산 (의존성 0, DOM 없음).
 *
 * 두 손잡이 슬라이더가 어려운 이유는 드래그가 아니라 **값의 규칙**이다:
 * 눈금(step)에 맞추기, 범위 밖으로 못 나가게 하기, 두 손잡이가 서로를 지나치지 않게 하기,
 * 겹쳐 있을 때 어느 쪽을 잡을지 정하기. 그 규칙만 여기 모았다 — 테스트가 곧 명세다.
 */

type Bounds = { min: number; max: number; step?: number }

/** step이 0.1처럼 소수면 부동소수 오차가 쌓인다 — 눈금의 소수 자릿수로 정리한다 */
const decimalsOf = (step: number) => (String(step).split('.')[1] ?? '').length

/** 눈금에 맞추고 범위 안으로 가둔다 */
export const snapValue = ({ value, min, max, step = 1 }: Bounds & { value: number }) => {
  const snapped = min + Math.round((value - min) / step) * step
  const clamped = Math.min(Math.max(snapped, min), max)
  return Number(clamped.toFixed(decimalsOf(step)))
}

/**
 * 두 손잡이가 서로를 지나치지 않게 한다.
 * 상대를 밀어내지 않고 **움직인 쪽이 멈춘다** — 밀어내면 건드리지도 않은 값이 바뀌어,
 * "최저가만 올렸는데 최고가도 따라 올라갔다"가 된다.
 */
export const clampPair = ({
  lower,
  upper,
  moved,
  minDistance = 0,
}: {
  lower: number
  upper: number
  /** 방금 사용자가 움직인 쪽 */
  moved: 'lower' | 'upper'
  /** 두 값 사이 최소 간격 (기본 0 = 같아져도 된다) */
  minDistance?: number
}) =>
  moved === 'lower'
    ? { lower: Math.min(lower, upper - minDistance), upper }
    : { lower, upper: Math.max(upper, lower + minDistance) }

/** 값 → 트랙 위 위치(%) */
export const toPercent = ({ value, min, max }: Bounds & { value: number }) =>
  max === min ? 0 : ((value - min) / (max - min)) * 100

/** 트랙 위 위치(%) → 눈금에 맞춘 값 — 트랙을 눌러 손잡이를 옮길 때 쓴다 */
export const valueAtPercent = ({ percent, min, max, step = 1 }: Bounds & { percent: number }) =>
  snapValue({ value: min + ((max - min) * percent) / 100, min, max, step })

/**
 * 누른 지점에서 어느 손잡이를 움직일지 — 가까운 쪽이다.
 * 정확히 가운데면 아래쪽 손잡이를 고른다(둘 중 하나는 정해야 하고, 어느 쪽이든 다음 조작으로 바로잡힌다).
 */
export const nearerHandle = ({ value, lower, upper }: { value: number; lower: number; upper: number }): 'lower' | 'upper' =>
  Math.abs(value - lower) <= Math.abs(value - upper) ? 'lower' : 'upper'

/**
 * 두 손잡이가 겹쳤을 때 어느 쪽을 위에 둘지.
 * 오른쪽 끝에 몰려 있으면 사용자가 하려는 것은 왼쪽으로 끄는 일이므로 아래쪽 손잡이를 위로 올린다.
 * 반대로 왼쪽에 몰려 있으면 오른쪽으로 끌 테니 위쪽 손잡이를 남긴다.
 */
export const lowerOnTop = ({ lower, upper, min, max }: Bounds & { lower: number; upper: number }) =>
  (lower + upper) / 2 >= (min + max) / 2
