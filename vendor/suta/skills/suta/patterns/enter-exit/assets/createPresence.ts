/**
 * 프레임워크 무관 진입/퇴장 상태 머신 (의존성 0).
 *
 * 요소의 data-state를 (없음) → entering → entered → exiting → (없음)으로 구동한다 —
 * 애니메이션 정의는 전적으로 CSS 몫이고(enter-exit.css), 이 코어는 상태 전이와
 * "퇴장이 끝난 뒤에 제거"라는 타이밍 문제만 푼다.
 *
 * 바닐라 사용: 요소를 DOM에 넣고 show(), 제거하려면 hide() 후 onChange(null)에서 element.remove().
 * React 사용: Presence.tsx가 이 코어를 감싼다.
 */

export type PresenceState = 'entering' | 'entered' | 'exiting'

type CreatePresenceOptions = {
  element: HTMLElement
  /** transitionend/animationend가 오지 않을 때의 종료 폴백(ms). CSS duration보다 길게 */
  timeoutMs?: number
  /** 상태 전이 알림 — null이면 퇴장 완료(제거해도 안전한 시점) */
  onChange?: (state: PresenceState | null) => void
}

export const createPresence = ({ element, timeoutMs = 500, onChange }: CreatePresenceOptions) => {
  let state: PresenceState | null = null
  let outerFrame = 0
  let innerFrame = 0
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined

  const applyState = (next: PresenceState | null) => {
    state = next
    if (next === null) delete element.dataset.state
    else element.dataset.state = next
    onChange?.(next)
  }

  const clearPending = () => {
    cancelAnimationFrame(outerFrame)
    cancelAnimationFrame(innerFrame)
    clearTimeout(fallbackTimer)
    element.removeEventListener('transitionend', finishExit)
    element.removeEventListener('animationend', finishExit)
  }

  const finishExit = () => {
    clearPending()
    applyState(null)
  }

  const show = () => {
    if (state === 'entering' || state === 'entered') return
    clearPending()
    applyState('entering')
    // 브라우저가 entering 스타일을 먼저 그려야 entered로의 transition이 발동한다 — 두 프레임 대기
    outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => applyState('entered'))
    })
  }

  const hide = () => {
    if (state === null || state === 'exiting') return
    clearPending()
    applyState('exiting')
    // transitionend는 유실될 수 있다(display 전환·탭 백그라운드) — 타임아웃이 안전망
    fallbackTimer = setTimeout(finishExit, timeoutMs)
    element.addEventListener('transitionend', finishExit)
    element.addEventListener('animationend', finishExit)
  }

  const destroy = () => {
    clearPending()
  }

  return { show, hide, destroy, getState: () => state }
}
