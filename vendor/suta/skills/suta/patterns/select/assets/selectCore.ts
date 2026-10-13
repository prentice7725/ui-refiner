/**
 * 리스트박스 키보드 내비게이션의 순수 판정 (의존성 0, DOM 무관).
 *
 * "이 키가 하이라이트를 어디로 옮기는가"만 답한다 — 열림/닫힘·선택 확정은 래퍼 몫.
 * 하이라이트 없음은 -1: ArrowDown이면 처음부터, ArrowUp이면 끝부터 진입한다(WAI-ARIA 콤보박스 관례).
 */

type MoveHighlightOptions = {
  /** 현재 하이라이트 인덱스 — 없으면 -1 */
  index: number
  /** 옵션 개수 */
  count: number
  /** KeyboardEvent.key */
  key: string
}

export const moveHighlight = ({ index, count, key }: MoveHighlightOptions) => {
  if (count === 0) return -1
  switch (key) {
    case 'ArrowDown':
      return index < 0 ? 0 : Math.min(index + 1, count - 1)
    case 'ArrowUp':
      return index < 0 ? count - 1 : Math.max(index - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return index
  }
}
