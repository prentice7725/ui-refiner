import { useEffect, useRef } from 'react'
import { observeHeaderCollapse } from './observeHeaderCollapse'
import './sticky-header.css'

/**
 * observeHeaderCollapse 코어의 React 래퍼.
 * headerRef를 고정 헤더에, sentinelRef를 큰 제목 블록에 달면
 * 제목이 스크롤에 밀려 나갈 때 헤더에 data-collapsed가 걸린다.
 */
export const useStickyHeader = <
  HeaderT extends HTMLElement = HTMLElement,
  SentinelT extends HTMLElement = HTMLElement,
>() => {
  const headerRef = useRef<HeaderT | null>(null)
  const sentinelRef = useRef<SentinelT | null>(null)

  useEffect(function watchSentinel() {
    const header = headerRef.current
    const sentinel = sentinelRef.current
    if (!header || !sentinel) return
    return observeHeaderCollapse({ header, sentinel })
  }, [])

  return { headerRef, sentinelRef }
}
