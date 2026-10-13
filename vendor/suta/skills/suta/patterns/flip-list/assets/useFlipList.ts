import { useLayoutEffect, useRef } from 'react'
import { captureFlip } from './captureFlip'

/**
 * captureFlip 코어의 React 래퍼 — containerRef를 리스트 컨테이너에 달고
 * 각 항목에 고유한 data-flip-id를 주면, 정렬·추가·삭제로 위치가 바뀔 때마다
 * 항목이 미끄러져 이동한다.
 *
 * 원리: 매 커밋 직후(useLayoutEffect) 직전 커밋에서 캡처해 둔 위치와 비교해 재생하고,
 * 다음 비교를 위해 새로 캡처한다 — React에서는 상태 변경 "직전"에 끼어들 수 없기 때문이다.
 */
export const useFlipList = <T extends HTMLElement = HTMLElement>() => {
  const containerRef = useRef<T | null>(null)
  const flipRef = useRef<ReturnType<typeof captureFlip> | null>(null)

  useLayoutEffect(function replayPositionChanges() {
    const container = containerRef.current
    if (!container) return
    // 캡처(현재 = 최종 위치)를 먼저 떠 둔다 — play()가 invert transform을 걸기 전이어야
    // 측정값이 오염되지 않는다
    const nextCapture = captureFlip({ container })
    flipRef.current?.play()
    flipRef.current = nextCapture
  })

  return { containerRef }
}
