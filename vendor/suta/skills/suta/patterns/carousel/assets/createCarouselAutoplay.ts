/**
 * 캐러셀 자동재생 (선택 확장, 의존성 0).
 *
 * 자동재생은 접근성 조건이 붙는 기능이다(WCAG 2.2.2 — 움직임을 멈출 수단 제공):
 * - 포인터가 올라와 있거나 키보드 포커스가 안에 있으면 멈춘다
 * - 사용자 토글(일시정지 버튼)을 제공할 수 있도록 toggle/isPlaying을 노출한다
 * - prefers-reduced-motion이면 처음부터 재생하지 않는다
 */

type CreateCarouselAutoplayOptions = {
  track: HTMLElement
  /** 다음 슬라이드로 넘어갈 간격 (기본 4000ms) */
  intervalMs?: number
  /** 간격마다 호출 — 여기서 다음 슬라이드로 이동시킨다 */
  onTick: () => void
}

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const createCarouselAutoplay = ({ track, intervalMs = 4000, onTick }: CreateCarouselAutoplayOptions) => {
  let timer: ReturnType<typeof setInterval> | undefined
  let hovered = false
  let focused = false
  let userPaused = prefersReducedMotion() // 모션 완화 사용자는 시작부터 정지 — toggle로 명시적 재생은 가능

  const shouldRun = () => !userPaused && !hovered && !focused

  const sync = () => {
    if (shouldRun() && timer === undefined) {
      timer = setInterval(onTick, intervalMs)
    } else if (!shouldRun() && timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  const onEnter = () => {
    hovered = true
    sync()
  }
  const onLeave = () => {
    hovered = false
    sync()
  }
  const onFocusIn = () => {
    focused = true
    sync()
  }
  const onFocusOut = () => {
    focused = false
    sync()
  }

  track.addEventListener('pointerenter', onEnter)
  track.addEventListener('pointerleave', onLeave)
  track.addEventListener('focusin', onFocusIn)
  track.addEventListener('focusout', onFocusOut)
  sync()

  return {
    /** 일시정지 버튼용 — 사용자 정지는 호버·포커스와 달리 떠나도 유지된다 */
    toggle: () => {
      userPaused = !userPaused
      sync()
    },
    isPlaying: () => timer !== undefined,
    stop: () => {
      if (timer !== undefined) clearInterval(timer)
      timer = undefined
      userPaused = true
      track.removeEventListener('pointerenter', onEnter)
      track.removeEventListener('pointerleave', onLeave)
      track.removeEventListener('focusin', onFocusIn)
      track.removeEventListener('focusout', onFocusOut)
    },
  }
}
