import { useEffect, useRef } from 'react'
import { moveSegmentThumb } from './moveSegmentThumb'
import './segmented-control.css'

/**
 * moveSegmentThumb 코어의 React 래퍼.
 * registerSegment(index)를 각 칸(label)의 ref로, thumbRef를 thumb 요소에 달면
 * activeIndex가 바뀔 때마다 thumb가 선택 칸 뒤로 미끄러진다.
 * 마크업을 직접 짜고 싶을 때 쓰고, 일반적인 경우는 SegmentedControl.tsx를 쓴다.
 */
export const useSegmentedControl = ({ activeIndex }: { activeIndex: number }) => {
  const segmentsRef = useRef<Array<HTMLElement | null>>([])
  const thumbRef = useRef<HTMLElement | null>(null)
  const initializedRef = useRef(false)

  const registerSegment = (index: number) => (el: HTMLElement | null) => {
    segmentsRef.current[index] = el
  }

  useEffect(
    function slideToActiveSegment() {
      const thumb = thumbRef.current
      const target = segmentsRef.current[activeIndex]
      if (!thumb || !target) return
      // 첫 배치는 슬라이드 없이 — 0에서 미끄러져 오는 가짜 이동을 막는다
      moveSegmentThumb({ thumb, target, immediate: !initializedRef.current })
      initializedRef.current = true

      if (typeof ResizeObserver === 'undefined') return
      // 폰트 로드·컨테이너 리사이즈로 칸 폭이 변하면 제자리로 재측정한다
      const observer = new ResizeObserver(() => moveSegmentThumb({ thumb, target, immediate: true }))
      observer.observe(target)
      return () => observer.disconnect()
    },
    [activeIndex],
  )

  return { registerSegment, thumbRef }
}
