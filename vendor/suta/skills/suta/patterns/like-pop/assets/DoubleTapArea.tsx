import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createDoubleTap } from './createDoubleTap'
import './like-pop.css'

type Burst = { id: number; x: number; y: number }

type DoubleTapAreaProps = {
  children: ReactNode
  /** 더블탭 성공 시 호출 — 좋아요 상태 갱신은 여기서 */
  onDoubleTap?: () => void
  /** 두 탭 사이 최대 간격(ms). 기본 300 */
  thresholdMs?: number
  className?: string
}

/**
 * createDoubleTap 코어의 React 래퍼 — 더블탭 지점에 버스트 하트를 띄운다.
 * 하트는 애니메이션이 끝나면 스스로 정리되므로 연타해도 누적되지 않는다.
 */
export const DoubleTapArea = ({ children, onDoubleTap, thresholdMs, className }: DoubleTapAreaProps) => {
  const areaRef = useRef<HTMLDivElement | null>(null)
  const nextIdRef = useRef(0)
  const [bursts, setBursts] = useState<Burst[]>([])
  // 최신 콜백을 ref로 들고 있어 인라인 함수를 넘겨도 리스너가 매 렌더 재등록되지 않는다
  const onDoubleTapRef = useRef(onDoubleTap)
  onDoubleTapRef.current = onDoubleTap

  useEffect(
    function detectDoubleTap() {
      const el = areaRef.current
      if (!el) return
      return createDoubleTap({
        element: el,
        thresholdMs,
        onDoubleTap: (point) => {
          const rect = el.getBoundingClientRect()
          nextIdRef.current += 1
          setBursts((prev) => [
            ...prev,
            { id: nextIdRef.current, x: point.x - rect.left, y: point.y - rect.top },
          ])
          onDoubleTapRef.current?.()
        },
      })
    },
    [thresholdMs],
  )

  const removeBurst = (id: number) => setBursts((prev) => prev.filter((burst) => burst.id !== id))

  return (
    <div ref={areaRef} className={className ? `double-tap-area ${className}` : 'double-tap-area'}>
      {children}
      {bursts.map((burst) => (
        <svg
          key={burst.id}
          className="burst-heart"
          style={{ left: burst.x, top: burst.y }}
          viewBox="0 0 24 24"
          aria-hidden="true"
          onAnimationEnd={() => removeBurst(burst.id)}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ))}
    </div>
  )
}
