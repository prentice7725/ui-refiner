/**
 * 프레임워크 무관 스토리 프로그레스 코어 (의존성 0).
 *
 * 구간 막대들을 rAF로 차례로 채운다(transform: scaleX — GPU 속성만).
 * CSS animation 대신 rAF를 쓰는 이유: 일시정지·재개·임의 구간 이동을
 * 프레임 정확도로 제어해야 하기 때문이다(길게 눌러 멈춤이 스토리 UI의 관례).
 */

type CreateStoryProgressOptions = {
  /** 구간 막대의 채움 요소들(transform-origin: left) — 순서 = 재생 순서 */
  bars: HTMLElement[]
  /** 구간 하나의 재생 시간 (기본 5000ms) */
  durationMs?: number
  /** 구간이 바뀔 때(수동 이동 포함) — 배경 콘텐츠 전환은 여기서 */
  onIndexChange?: (index: number) => void
  /** 마지막 구간까지 끝났을 때 */
  onComplete?: () => void
}

export const createStoryProgress = ({
  bars,
  durationMs = 5000,
  onIndexChange,
  onComplete,
}: CreateStoryProgressOptions) => {
  let index = 0
  let elapsed = 0
  let lastTick: number | null = null
  let frame = 0
  let running = false

  const paint = (progress: number) => {
    bars.forEach((bar, barIndex) => {
      if (barIndex < index) bar.style.transform = 'scaleX(1)'
      else if (barIndex > index) bar.style.transform = 'scaleX(0)'
      else bar.style.transform = `scaleX(${Math.min(progress, 1)})`
    })
  }

  const tick = (now: number) => {
    if (lastTick !== null) elapsed += now - lastTick
    lastTick = now
    const progress = elapsed / durationMs
    paint(progress)
    if (progress >= 1) {
      advance()
      return
    }
    frame = requestAnimationFrame(tick)
  }

  const advance = () => {
    if (index >= bars.length - 1) {
      index = bars.length - 1
      paint(1)
      stopTicking()
      onComplete?.()
      return
    }
    setIndex(index + 1)
  }

  const setIndex = (next: number) => {
    index = Math.max(0, Math.min(next, bars.length - 1))
    elapsed = 0
    lastTick = null
    paint(0)
    onIndexChange?.(index)
    if (running) frame = requestAnimationFrame(tick)
  }

  const stopTicking = () => {
    cancelAnimationFrame(frame)
    running = false
    lastTick = null
  }

  const start = () => {
    stopTicking()
    running = true
    index = 0
    elapsed = 0
    paint(0)
    frame = requestAnimationFrame(tick)
  }

  const pause = () => {
    cancelAnimationFrame(frame)
    running = false
    lastTick = null
  }

  const resume = () => {
    if (running) return
    running = true
    frame = requestAnimationFrame(tick)
  }

  const next = () => {
    cancelAnimationFrame(frame)
    if (index >= bars.length - 1) {
      paint(1)
      stopTicking()
      onComplete?.()
      return
    }
    setIndex(index + 1)
  }

  const prev = () => {
    cancelAnimationFrame(frame)
    setIndex(index - 1)
  }

  const stop = () => {
    stopTicking()
    index = 0
    elapsed = 0
    paint(0)
  }

  return { start, pause, resume, next, prev, stop, getIndex: () => index }
}
