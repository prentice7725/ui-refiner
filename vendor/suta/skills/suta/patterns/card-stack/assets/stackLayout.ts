/**
 * 카드 묶음(card-stack) 순수 계산 코어 (의존성 0, DOM 없음).
 *
 * 두 가지만 담당한다:
 *  1. 배치 — 카드 한 장의 translateY·scale·zIndex (cardTransform)와 컨테이너 높이(stackHeight)
 *  2. 상태 전이 — 탭·Esc에 따라 stacked → fanned → selected 사이를 오가는 규칙(nextStackState)
 *
 * 애니메이션은 CSS transition(card-stack.css)이 맡는다 — 여기서는 "어디에 있어야 하는가"만 정한다.
 * 바닐라 사용: 클릭 핸들러에서 nextStackState로 상태를 바꾸고, 각 카드에 cardTransform 결과를 인라인 style로 쓴다.
 * React 사용: CardStack.tsx가 이 코어를 감싼다.
 */

export type StackMode = 'stacked' | 'fanned' | 'selected'

export type StackState = {
  mode: StackMode
  /** selected 모드에서 앞으로 나온 카드. 그 외 모드에서는 null */
  selectedIndex: number | null
}

export type StackAction = { type: 'tapStack' } | { type: 'tapCard'; index: number } | { type: 'dismiss' }

type LayoutOptions = {
  count: number
  mode: StackMode
  /** stacked·selected에서 뒤 카드가 삐져나오는 높이 (기본 56px) */
  peekPx?: number
  /** fanned에서 카드 사이 간격 (기본 72px) */
  fanGapPx?: number
  cardHeight: number
}

type CardTransformOptions = LayoutOptions & {
  index: number
  selectedIndex?: number | null
}

export type CardTransform = {
  translateY: number
  scale: number
  zIndex: number
}

/** 선택 카드와 나머지 묶음 사이 여백 — 선택 카드가 "떠 있다"는 인상을 주는 최소 거리 */
const SELECTED_GAP_PX = 16
/** 뒤 카드 한 장당 줄어드는 배율 — 2%면 4장에서도 맨 뒤가 94%라 글자가 뭉개지지 않는다 */
const SCALE_STEP = 0.02

/** 부동소수 잔재(0.9400000001)를 없앤다 — style 문자열이 깔끔해야 스냅샷·비교가 안정적이다 */
const roundScale = (value: number) => Math.round(value * 100) / 100

/**
 * 카드 한 장의 배치. 모든 px 값은 정수.
 * zIndex는 index 순 — 애플 지갑처럼 "아래(뒤 index)에 있는 카드가 앞"이라 위 카드는 윗가장자리만 보인다.
 */
export const cardTransform = ({
  index,
  count,
  mode,
  selectedIndex = null,
  peekPx = 56,
  fanGapPx = 72,
  cardHeight,
}: CardTransformOptions): CardTransform => {
  if (mode === 'fanned') {
    return { translateY: Math.round(fanGapPx * index), scale: 1, zIndex: index }
  }

  if (mode === 'selected' && selectedIndex !== null) {
    if (index === selectedIndex) {
      // 선택 카드는 맨 위·원래 크기·맨 앞
      return { translateY: 0, scale: 1, zIndex: count }
    }
    // 나머지는 선택 카드 아래로 내려가 stacked와 같은 규칙으로 겹친다 — 순번은 선택 카드를 뺀 순서
    const rank = index < selectedIndex ? index : index - 1
    const restCount = count - 1
    return {
      translateY: Math.round(cardHeight + SELECTED_GAP_PX + peekPx * rank),
      scale: roundScale(1 - SCALE_STEP * (restCount - 1 - rank)),
      zIndex: rank,
    }
  }

  // stacked (selectedIndex가 없는 selected도 stacked로 취급 — 잘못된 상태로 카드를 잃지 않는다)
  return {
    translateY: Math.round(peekPx * index),
    scale: roundScale(1 - SCALE_STEP * (count - 1 - index)),
    zIndex: index,
  }
}

/**
 * 컨테이너 최소 높이(px). 카드는 전부 absolute라 컨테이너가 스스로 높이를 갖지 못한다 —
 * height를 transition하면 매 프레임 레이아웃이 돌므로, min-height를 즉시 바꾸고 이동은 카드 transform에 맡긴다.
 */
export const stackHeight = ({ count, mode, peekPx = 56, fanGapPx = 72, cardHeight }: LayoutOptions) => {
  if (count === 0) return 0
  const tail = Math.max(count - 1, 0)
  if (mode === 'fanned') return Math.round(cardHeight + fanGapPx * tail)
  if (mode === 'selected') return Math.round(cardHeight + SELECTED_GAP_PX + peekPx * tail)
  return Math.round(cardHeight + peekPx * tail)
}

/**
 * 상태 전이 — 한 단계씩만 움직인다(stacked ↔ fanned ↔ selected).
 * 되돌아가기(dismiss·같은 카드 다시 탭)는 항상 한 단계만 물러난다 — 선택에서 바로 접히면 "어디로 갔는지"를 놓친다.
 */
export const nextStackState = ({ mode, selectedIndex, action }: StackState & { action: StackAction }): StackState => {
  if (mode === 'stacked') {
    // 묶음을 누르든 카드 하나를 누르든 겹쳐 있을 때는 "펼치기" 하나뿐이다
    if (action.type === 'tapStack' || action.type === 'tapCard') return { mode: 'fanned', selectedIndex: null }
    return { mode, selectedIndex: null }
  }

  if (mode === 'fanned') {
    if (action.type === 'tapCard') return { mode: 'selected', selectedIndex: action.index }
    return { mode: 'stacked', selectedIndex: null }
  }

  // selected
  if (action.type === 'tapCard' && action.index !== selectedIndex) {
    // 다른 카드를 고르면 펼침으로 돌아가지 않고 바로 교체한다
    return { mode: 'selected', selectedIndex: action.index }
  }
  return { mode: 'fanned', selectedIndex: null }
}
