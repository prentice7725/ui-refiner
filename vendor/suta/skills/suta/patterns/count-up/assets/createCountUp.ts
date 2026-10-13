/**
 * 프레임워크 무관 숫자 카운트업 코어 (의존성 0).
 *
 * requestAnimationFrame으로 from→to를 보간해 요소의 textContent에 쓴다.
 * setInterval 방식과 달리 프레임에 정렬되어 끊김이 없고, 탭이 백그라운드면 자동으로 멈춘다.
 *
 * 바닐라 사용: createCountUp({ element, to: 1234567 }).start()
 * React 사용: CountUp.tsx가 이 코어를 감싼다.
 */

type CreateCountUpOptions = {
  element: HTMLElement
  from?: number
  to: number
  durationMs?: number
  /** 진행률(0~1) 커브 — 기본은 ease-out cubic(초반 빠르게, 끝에서 감속) */
  easing?: (progress: number) => number
  /** 값 → 표시 문자열. 기본: 정수 반올림 + 천 단위 구분(toLocaleString) */
  format?: (value: number) => string
  onUpdate?: (value: number) => void
}

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3)

/** 기본 표시 — 정수 반올림 + 천 단위 구분. React 래퍼가 화면 낭독기용 최종값을 같은 형식으로 쓴다 */
export const defaultFormat = (value: number) => Math.round(value).toLocaleString('ko-KR')

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const createCountUp = ({
  element,
  from = 0,
  to,
  durationMs = 800,
  easing = easeOutCubic,
  format = defaultFormat,
  onUpdate,
}: CreateCountUpOptions) => {
  let frame = 0
  let startTime: number | null = null

  const apply = (value: number) => {
    element.textContent = format(value)
    onUpdate?.(value)
  }

  const tick = (now: number) => {
    if (startTime === null) startTime = now
    const progress = Math.min((now - startTime) / durationMs, 1)
    apply(from + (to - from) * easing(progress))
    if (progress < 1) frame = requestAnimationFrame(tick)
  }

  const start = () => {
    stop()
    if (prefersReducedMotion()) {
      // 모션 완화: 굴러가는 숫자는 이동 연출이므로 최종값을 즉시 보여준다
      apply(to)
      return
    }
    startTime = null
    frame = requestAnimationFrame(tick)
  }

  const stop = () => {
    cancelAnimationFrame(frame)
  }

  return { start, stop }
}
