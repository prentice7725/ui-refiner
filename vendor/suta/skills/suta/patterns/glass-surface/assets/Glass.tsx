import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import './glass.css'

type GlassProps = {
  /** 렌더할 태그 — 의미에 맞게 고른다(카드는 section/article, GNB는 header/nav) */
  as?: 'div' | 'section' | 'article' | 'header' | 'nav' | 'aside' | 'footer'
  /** card(둥근 판) · nav(상단에 붙는 GNB) · none(기본 유리만) */
  variant?: 'card' | 'nav' | 'none'
  /** light(흰 유리 — 어둡거나 알록달록한 배경용) · dark(검은 유리 — 밝은 배경용) */
  tone?: 'light' | 'dark'
  /** 흐림 반경 px (기본 16) */
  blur?: number
  /** 누를 수 있는 유리 — hover 시 tint가 진해진다 */
  interactive?: boolean
  /** true면 흐림 없이 불투명 판 — 뒤가 너무 밝거나 복잡해 글자가 안 읽히는 자리에 */
  opaque?: boolean
  children?: ReactNode
} & HTMLAttributes<HTMLElement>

/**
 * glass.css의 React 편의 래퍼 — 로직이 없는 순수 마크업 도우미다.
 * 순수 JS에서는 클래스와 data 속성만으로 동일하게 쓸 수 있다: <section class="glass glass-card" data-tone="dark">
 * 모달은 여기 없다 — <dialog className="glass glass-modal">에 붙이고 열기·닫기는 modal-dialog 패턴을 쓴다.
 */
export const Glass = ({
  as = 'div',
  variant = 'card',
  tone = 'light',
  blur,
  interactive = false,
  opaque = false,
  className,
  style,
  children,
  ...rest
}: GlassProps) => {
  const classes = ['glass', variant === 'none' ? '' : `glass-${variant}`, interactive ? 'glass-interactive' : '', className]
    .filter(Boolean)
    .join(' ')
  const mergedStyle = blur == null ? style : ({ ...style, '--glass-blur': `${blur}px` } as CSSProperties)

  return createElement(
    as,
    {
      ...rest,
      className: classes,
      style: mergedStyle,
      'data-tone': tone,
      'data-opaque': opaque ? 'true' : undefined,
    },
    children,
  )
}
