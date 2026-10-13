import { useEffect, useRef, type ReactNode } from 'react'
import { createPullToRefresh } from './createPullToRefresh'
import './pull-to-refresh.css'

type PullToRefreshProps = {
  /** 당겨서 놓았을 때 실행 — Promise가 끝나면 인디케이터가 복귀한다 */
  onRefresh: () => Promise<void> | void
  children: ReactNode
  /** 새로고침 판정 당김 거리 (기본 70px) */
  thresholdPx?: number
  /** 스크롤 영역의 이름(예: "가게 소식") — 주면 이름 있는 영역(region)이 되어 화면 낭독기가 읽는다 */
  label?: string
  className?: string
}

/**
 * createPullToRefresh 코어의 React 래퍼 — 스크롤 영역을 감싸면
 * 최상단에서 아래로 당겼을 때 새로고침 제스처가 붙는다.
 */
export const PullToRefresh = ({ onRefresh, children, thresholdPx, label, className }: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  // 최신 콜백을 ref로 들고 있어 인라인 함수를 넘겨도 리스너가 재등록되지 않는다
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(
    function attachPullGesture() {
      const container = containerRef.current
      const content = contentRef.current
      if (!container || !content) return
      return createPullToRefresh({
        container,
        content,
        thresholdPx,
        onRefresh: (done) => {
          Promise.resolve(onRefreshRef.current()).finally(done)
        },
      })
    },
    [thresholdPx],
  )

  return (
    // 스크롤 상자는 키보드로도 스크롤할 수 있어야 한다 — 초점을 받게 tabIndex를 둔다
    <div
      ref={containerRef}
      className={className ? `ptr-container ${className}` : 'ptr-container'}
      tabIndex={0}
      role={label ? 'region' : undefined}
      aria-label={label}
    >
      <span className="ptr-indicator" aria-hidden="true">
        ↻
      </span>
      <div ref={contentRef} className="ptr-content">
        {children}
      </div>
    </div>
  )
}
