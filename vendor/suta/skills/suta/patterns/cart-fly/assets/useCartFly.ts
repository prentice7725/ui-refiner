import { useRef } from 'react'
import { flyToTarget } from './flyToTarget'

/**
 * flyToTarget 코어의 React 래퍼 — targetRef를 장바구니 버튼에 달고,
 * 담기 버튼에서 flyFrom({ source })를 부르면 고스트가 날아간다.
 */
export const useCartFly = <T extends HTMLElement = HTMLElement>() => {
  const targetRef = useRef<T | null>(null)

  const flyFrom = ({
    source,
    onArrive,
    arc,
  }: {
    source: HTMLElement
    onArrive?: () => void
    arc?: 'horizontal-first' | 'vertical-first'
  }) => {
    const target = targetRef.current
    if (!target) return
    flyToTarget({ source, target, onArrive, arc })
  }

  return { targetRef, flyFrom }
}
