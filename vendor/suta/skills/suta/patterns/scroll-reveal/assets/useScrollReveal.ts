import { useEffect, useRef, useState } from 'react'
import { revealOnScroll } from './revealOnScroll'

type UseScrollRevealOptions = {
  /** 요소가 몇 % 보였을 때 공개할지 (0~1). 기본 0.15 */
  threshold?: number
  /** 뷰포트 경계 보정 — 미리 공개하려면 '0px 0px -10% 0px' 형태로 */
  rootMargin?: string
  /** true(기본)면 한 번 공개 후 유지, false면 벗어날 때 다시 감춘다 */
  once?: boolean
}

/**
 * revealOnScroll 코어의 React 래퍼 — 반환된 targetRef를 대상 요소에 달면
 * 코어가 data-revealed를 구동하고, revealed로 상태를 읽을 수 있다.
 */
export const useScrollReveal = <T extends HTMLElement = HTMLDivElement>({
  threshold = 0.15,
  rootMargin,
  once = true,
}: UseScrollRevealOptions = {}) => {
  const targetRef = useRef<T | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(
    function observeViewportEntry() {
      const el = targetRef.current
      if (!el) return
      return revealOnScroll({ element: el, threshold, rootMargin, once, onChange: setRevealed })
    },
    [threshold, rootMargin, once],
  )

  return { targetRef, revealed }
}
