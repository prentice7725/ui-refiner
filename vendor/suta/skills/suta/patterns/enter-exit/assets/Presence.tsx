import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import { createPresence, type PresenceState } from './createPresence'

type PresenceProps = {
  /** true면 자식을 표시(진입 애니메이션), false면 퇴장 애니메이션 후 언마운트 */
  show: boolean
  /** transitionend/animationend가 오지 않을 때의 언마운트 폴백(ms). CSS duration보다 길게 잡는다 */
  timeoutMs?: number
  /** 단일 React 엘리먼트 — data-state 속성이 주입되므로 CSS는 [data-state]로 스타일링한다 */
  children: ReactElement
}

type Bound = {
  element: HTMLElement
  timeoutMs: number
  controller: ReturnType<typeof createPresence>
}

/**
 * presence.ts 코어의 React 래퍼. React는 조건부 렌더링에서 즉시 언마운트하므로
 * CSS 퇴장 효과가 보일 틈이 없다 — show=false 후에도 자식을 exiting 상태로 유지하다가
 * 코어가 null을 알리는 시점(전환 종료)에 언마운트한다.
 */
export const Presence = ({ show, timeoutMs = 500, children }: PresenceProps) => {
  const [state, setState] = useState<PresenceState | null>(show ? 'entering' : null)
  const elementRef = useRef<HTMLElement | null>(null)
  const boundRef = useRef<Bound | null>(null)

  const captureElement = (el: HTMLElement | null) => {
    elementRef.current = el
  }

  useEffect(
    function drivePresence() {
      if (show && state === null) {
        // 마운트 유도 — 요소가 entering 상태로 렌더된 뒤 이 effect가 다시 돌아 코어에 연결된다
        setState('entering')
        return
      }
      const el = elementRef.current
      if (!el) return
      if (boundRef.current?.element !== el || boundRef.current.timeoutMs !== timeoutMs) {
        boundRef.current?.controller.destroy()
        boundRef.current = {
          element: el,
          timeoutMs,
          controller: createPresence({ element: el, timeoutMs, onChange: setState }),
        }
      }
      if (show) boundRef.current.controller.show()
      else boundRef.current.controller.hide()
    },
    [show, state, timeoutMs],
  )

  useEffect(function destroyOnUnmount() {
    return () => boundRef.current?.controller.destroy()
  }, [])

  if (state === null || !isValidElement(children)) return null

  return cloneElement(children, {
    'data-state': state,
    ref: captureElement,
  } as Partial<unknown>)
}
