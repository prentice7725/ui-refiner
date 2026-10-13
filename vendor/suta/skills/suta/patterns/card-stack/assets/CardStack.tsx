import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cardTransform, nextStackState, stackHeight, type StackAction, type StackState } from './stackLayout'
import './card-stack.css'

export type CardStackCard = {
  id: string
  /** 카드 안쪽 내용 — 버튼 안에 들어가므로 button·a 같은 인터랙티브 요소는 넣지 않는다 */
  render: () => ReactNode
}

type CardStackProps = {
  cards: CardStackCard[]
  cardHeight?: number
  /** 겹침 높이(뒤 카드가 삐져나오는 px, 기본 56) */
  peekPx?: number
  /** 펼침 간격(px, 기본 72) */
  fanGapPx?: number
  /** 그룹 이름 — 스크린리더가 "카드 지갑, 그룹"으로 읽는다 */
  label?: string
  /** 모드가 바뀔 때 알림 (상태 표시·분석용) */
  onStateChange?: (state: StackState) => void
  className?: string
}

const INITIAL_STATE: StackState = { mode: 'stacked', selectedIndex: null }

/**
 * stackLayout 코어의 React 래퍼.
 * 카드마다 <button>이라 Tab으로 오가고 Enter/Space로 누른다. Esc는 한 단계 되돌린다(selected→fanned→stacked).
 * 높이는 모드별 min-height로 즉시 바꾸고, 이동은 CSS가 카드 transform만 전환한다.
 */
export const CardStack = ({ cards, cardHeight = 180, peekPx = 56, fanGapPx = 72, label = '카드 지갑', onStateChange, className }: CardStackProps) => {
  const [state, setState] = useState<StackState>(INITIAL_STATE)
  const count = cards.length
  // 최신 콜백을 ref로 들고 있어 인라인 함수를 넘겨도 알림 effect가 매 렌더 다시 돌지 않는다
  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange

  const dispatch = (action: StackAction) => setState((prev) => nextStackState({ ...prev, action }))

  useEffect(
    function notifyStateChange() {
      // 마운트 직후 초기 상태(stacked)도 한 번 알린다 — 표시 UI가 첫 화면부터 맞는다
      onStateChangeRef.current?.(state)
    },
    [state],
  )

  useEffect(
    function dismissOnEscape() {
      if (state.mode === 'stacked') return
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setState((prev) => nextStackState({ ...prev, action: { type: 'dismiss' } }))
      }
      window.addEventListener('keydown', handleKeydown)
      return () => window.removeEventListener('keydown', handleKeydown)
    },
    [state.mode],
  )

  const layout = { count, mode: state.mode, peekPx, fanGapPx, cardHeight }
  const containerStyle = {
    minHeight: stackHeight(layout),
    '--stack-count': count,
    '--stack-peek': `${peekPx}px`,
    '--stack-fan-gap': `${fanGapPx}px`,
    '--stack-card-height': `${cardHeight}px`,
  } as CSSProperties

  return (
    <div className={className ? `card-stack ${className}` : 'card-stack'} role="group" aria-label={label} data-mode={state.mode} style={containerStyle}>
      {cards.map((card, index) => {
        const { translateY, scale, zIndex } = cardTransform({ ...layout, index, selectedIndex: state.selectedIndex })
        const selected = state.mode === 'selected' && state.selectedIndex === index
        const cardStyle = {
          transform: `translateY(${translateY}px) scale(${scale})`,
          zIndex,
          '--stack-index': index,
        } as CSSProperties
        return (
          <button
            key={card.id}
            type="button"
            className="card-stack-card"
            aria-expanded={selected}
            data-selected={selected ? 'true' : undefined}
            style={cardStyle}
            onClick={() => dispatch({ type: 'tapCard', index })}
          >
            {card.render()}
          </button>
        )
      })}
    </div>
  )
}
