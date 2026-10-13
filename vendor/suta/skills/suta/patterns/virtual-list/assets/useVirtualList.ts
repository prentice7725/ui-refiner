import { useEffect, useRef, useState } from 'react'
import { sameRange, virtualRange, type VirtualRange } from './virtualRange'
import './virtual-list.css'

type UseVirtualListOptions = {
  itemCount: number
  /** 항목 하나의 높이(px) — 모두 같아야 한다 */
  itemHeight: number
  /** 화면 밖으로 더 그려 둘 개수 (기본 3) */
  overscan?: number
  /**
   * 빠르게 스크롤할 때 진행 방향으로 미리 그려 둘 최대 개수 (기본 24).
   * 0으로 두면 이 보정을 끈다.
   */
  maxLead?: number
}

/** 속도로부터 "이만큼 앞을 미리 그린다"를 정할 때 내다보는 시간(ms) */
const LOOKAHEAD_MS = 120
/** 스크롤이 이만큼 조용하면 멈춘 것으로 보고 미리 그려 둔 몫을 걷어낸다(ms) */
const SETTLE_MS = 150

/**
 * virtualRange 계산의 React 래퍼.
 *
 * containerRef를 스크롤 상자에 달면 보이는 구간(range)만 알려 준다.
 * 스크롤할 때마다 상태를 갱신하지 않는다 — **구간이 실제로 바뀔 때만** 갱신한다.
 * 픽셀 단위로 리렌더하면 가상 스크롤을 쓰는 이유가 사라진다.
 */
export const useVirtualList = <T extends HTMLElement = HTMLDivElement>({
  itemCount,
  itemHeight,
  overscan,
  maxLead = 24,
}: UseVirtualListOptions) => {
  const containerRef = useRef<T | null>(null)
  const [range, setRange] = useState<VirtualRange>(() => ({
    startIndex: 0,
    endIndex: -1,
    offsetY: 0,
    totalHeight: itemCount * itemHeight,
  }))
  const rangeRef = useRef(range)
  rangeRef.current = range

  useEffect(
    function trackScroll() {
      const container = containerRef.current
      if (!container) return

      // 직전 위치·시각을 기억해 두면 스크롤 속도와 방향을 알 수 있다
      let lastTop = container.scrollTop
      let lastAt = performance.now()
      let settleTimer: ReturnType<typeof setTimeout> | undefined

      const measure = ({ withLead }: { withLead: boolean }) => {
        const scrollTop = container.scrollTop
        const now = performance.now()
        const elapsed = now - lastAt
        const moved = scrollTop - lastTop
        lastTop = scrollTop
        lastAt = now

        // 다음 LOOKAHEAD_MS 동안 지나갈 만큼을 미리 그린다 — 빠를수록 많이, 멈춰 있으면 0
        const speed = withLead && elapsed > 0 ? Math.abs(moved) / elapsed : 0
        const lead = maxLead === 0 ? 0 : Math.min(maxLead, Math.round((speed * LOOKAHEAD_MS) / itemHeight))

        const next = virtualRange({
          scrollTop,
          viewportHeight: container.clientHeight,
          itemHeight,
          itemCount,
          overscan,
          lead,
          direction: moved === 0 ? 0 : moved > 0 ? 1 : -1,
        })
        if (sameRange(rangeRef.current, next) && rangeRef.current.offsetY === next.offsetY) return
        rangeRef.current = next
        setRange(next)
      }

      const onScroll = () => {
        measure({ withLead: true })
        // 스크롤이 멎으면 미리 그려 둔 몫을 걷어낸다 — scrollend는 아직 지원이 고르지 않아 타이머로 판정한다
        clearTimeout(settleTimer)
        settleTimer = setTimeout(() => measure({ withLead: false }), SETTLE_MS)
      }
      const onResize = () => measure({ withLead: false })

      measure({ withLead: false })
      // passive: 스크롤을 막을 일이 없다고 알려 브라우저가 스크롤을 기다리지 않게 한다
      container.addEventListener('scroll', onScroll, { passive: true })
      // 창 크기·레이아웃 변화로 보이는 높이가 달라지면 구간도 달라진다
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize)
      observer?.observe(container)

      return () => {
        clearTimeout(settleTimer)
        container.removeEventListener('scroll', onScroll)
        observer?.disconnect()
      }
    },
    [itemCount, itemHeight, overscan, maxLead],
  )

  return {
    containerRef,
    range,
    /** 화면에 그릴 인덱스들 */
    indexes: Array.from({ length: Math.max(0, range.endIndex - range.startIndex + 1) }, (_, i) => range.startIndex + i),
    /**
     * 특정 항목으로 보낸다.
     * behavior: 'smooth'는 **짧은 거리에만** 쓴다 — 먼 거리를 부드럽게 스크롤하면 브라우저가
     * 화면을 초당 수천 픽셀로 옮기는 동안 JS가 따라가지 못해 빈 칸이 길게 스친다.
     */
    scrollToIndex: (index: number, behavior: ScrollBehavior = 'auto') =>
      containerRef.current?.scrollTo({ top: index * itemHeight, behavior }),
  }
}
