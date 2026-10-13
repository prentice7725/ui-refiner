/**
 * 프레임워크 무관 "길게 누르면 반복" 코어 (의존성 0).
 *
 * 수량을 20까지 올리려고 버튼을 스무 번 누르게 하는 UI는 만들지 않는다.
 * 누르고 있으면 반복되고, 오래 누를수록 빨라져야 한다 — 시계 알람 설정, 볼륨, 수량 모두 같은 규칙이다.
 *
 * 타이밍은 세 단계다:
 *  1. 첫 실행은 누르는 즉시 (호출하는 쪽이 한다 — 짧게 누른 한 번은 반복이 아니다)
 *  2. delayMs 동안 아무 일도 없다 (짧게 누른 것이 연타로 바뀌지 않게)
 *  3. 그 뒤 intervalMs 간격으로 반복하며, 간격이 minIntervalMs까지 점점 줄어든다
 *
 * setInterval이 아니라 setTimeout을 이어 거는 이유가 3번이다 — 간격이 매번 달라진다.
 */

type CreateHoldRepeatOptions = {
  /** 반복할 동작 */
  onRepeat: () => void
  /** 누르고 있어야 반복이 시작되는 시간 (ms, 기본 400) */
  delayMs?: number
  /** 반복 간격의 시작값 (ms, 기본 160) */
  intervalMs?: number
  /** 한 번 반복할 때마다 간격에 곱하는 비율 (기본 0.82 — 반복할수록 빨라진다) */
  acceleration?: number
  /** 아무리 빨라져도 이보다 짧아지지 않는다 (ms, 기본 45) */
  minIntervalMs?: number
}

export const createHoldRepeat = ({
  onRepeat,
  delayMs = 400,
  intervalMs = 160,
  acceleration = 0.82,
  minIntervalMs = 45,
}: CreateHoldRepeatOptions) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let interval = intervalMs

  const tick = () => {
    onRepeat()
    interval = Math.max(minIntervalMs, interval * acceleration)
    timer = setTimeout(tick, interval)
  }

  return {
    /** 누르는 순간 부른다 — 첫 실행은 호출하는 쪽이 이미 했다고 본다 */
    start: () => {
      clearTimeout(timer)
      interval = intervalMs
      timer = setTimeout(tick, delayMs)
    },
    /** 떼거나 손가락이 벗어나면 부른다 — pointerup·pointercancel·pointerleave 모두 */
    stop: () => {
      clearTimeout(timer)
      timer = undefined
    },
    isRunning: () => timer !== undefined,
  }
}
