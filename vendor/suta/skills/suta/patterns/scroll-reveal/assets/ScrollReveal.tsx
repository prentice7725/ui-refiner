import { type CSSProperties, type ReactNode } from 'react'
import { useScrollReveal } from './useScrollReveal'

type ScrollRevealProps = {
  children: ReactNode
  threshold?: number
  rootMargin?: string
  once?: boolean
  /** 연쇄(stagger) 공개용 지연 — CSS 변수 --reveal-delay로 전달된다 */
  delayMs?: number
  className?: string
}

/**
 * 스크롤로 뷰포트에 들어올 때 콘텐츠를 공개하는 래퍼.
 * 상태는 data-revealed 속성으로만 노출한다 — 애니메이션 정의는 scroll-reveal.css 몫(CSS 우선 원칙).
 */
export const ScrollReveal = ({
  children,
  threshold,
  rootMargin,
  once,
  delayMs,
  className,
}: ScrollRevealProps) => {
  const { targetRef, revealed } = useScrollReveal({ threshold, rootMargin, once })

  return (
    <div
      ref={targetRef}
      className={className ? `reveal ${className}` : 'reveal'}
      data-revealed={revealed ? 'true' : 'false'}
      style={delayMs === undefined ? undefined : ({ '--reveal-delay': `${delayMs}ms` } as CSSProperties)}
    >
      {children}
    </div>
  )
}
