import { useEffect, useRef, type ReactNode } from 'react'
import { createPinchZoom } from './createPinchZoom'
import './pinch-zoom.css'

type PinchZoomProps = {
  /** 확대될 콘텐츠 — 보통 <img> 하나. 첫 자식이 확대 대상이 된다 */
  children: ReactNode
  maxScale?: number
  /** 이 배율에서 배경 딤이 최대 (기본 2) */
  dimAtScale?: number
  onChange?: (state: { scale: number; active: boolean }) => void
  className?: string
}

/**
 * createPinchZoom 코어의 React 래퍼 — 자식을 .pinch-target으로 감싸고 배경 딤을 붙인다.
 * 확대 상태를 React state로 올리지 않는다: 매 touchmove마다 렌더하면 손가락에 늦게 붙는다.
 */
export const PinchZoom = ({ children, maxScale, dimAtScale, onChange, className }: PinchZoomProps) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(
    function bindPinch() {
      const element = elementRef.current
      const target = targetRef.current
      if (!element || !target) return
      return createPinchZoom({
        element,
        target,
        maxScale,
        dimAtScale,
        onChange: (state) => onChangeRef.current?.(state),
      })
    },
    [maxScale, dimAtScale],
  )

  return (
    <div ref={elementRef} className={className ? `pinch ${className}` : 'pinch'}>
      <div ref={targetRef} className="pinch-target">
        {children}
      </div>
      <div className="pinch-backdrop" aria-hidden="true" />
    </div>
  )
}
