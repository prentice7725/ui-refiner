/**
 * 길게 누르기 메뉴 위치 계산 (의존성 0, DOM 없음).
 *
 * 떠오른 항목 바로 아래, 항목의 왼쪽 선에 맞춰 붙이는 것이 기본이다(iOS 관례 —
 * 메뉴가 항목에서 자라 나온 것처럼 보인다). 화면 아래쪽 항목이면 위로 뒤집고,
 * 좌우로 넘치면 화면 안쪽으로 밀어 넣는다. 반환한 side는 CSS가 등장 방향
 * (transform-origin)을 정하는 데 쓴다.
 *
 * DOM을 만지지 않으므로 테스트가 곧 명세다.
 */

type Rect = { top: number; left: number; width: number; height: number }

type PlaceContextMenuInput = {
  /** 떠오른 항목의 화면상 위치 */
  anchor: Rect
  /** 메뉴의 크기 (보이게 한 뒤에 잰 값) */
  menu: { width: number; height: number }
  viewport: { width: number; height: number }
  /** 항목과 메뉴 사이 간격 (기본 8) */
  gap?: number
  /** 화면 가장자리에서 최소한 띄울 여백 (기본 8) */
  padding?: number
}

export type ContextMenuPlacement = {
  top: number
  left: number
  /** 실제로 열린 방향 — 위로 열리면 아래에서 자라 나와야 한다 */
  side: 'bottom' | 'top'
}

const clamp = ({ value, min, max }: { value: number; min: number; max: number }) => Math.min(Math.max(value, min), max)

export const placeContextMenu = ({ anchor, menu, viewport, gap = 8, padding = 8 }: PlaceContextMenuInput): ContextMenuPlacement => {
  const below = anchor.top + anchor.height + gap
  const above = anchor.top - gap - menu.height

  // 아래에 들어가면 아래. 아니면 위를 보고, 위도 좁으면 아래로 두고 클램프한다
  // (둘 다 좁을 때 아래를 고르는 이유: 위로 넘치면 잘리지만 아래는 여백까지 밀어 올려 보이게 할 수 있다)
  const fitsBelow = below + menu.height <= viewport.height - padding
  const fitsAbove = above >= padding
  const side: ContextMenuPlacement['side'] = fitsBelow || !fitsAbove ? 'bottom' : 'top'

  const maxLeft = Math.max(padding, viewport.width - padding - menu.width)
  const maxTop = Math.max(padding, viewport.height - padding - menu.height)

  return {
    top: clamp({ value: side === 'bottom' ? below : above, min: padding, max: maxTop }),
    left: clamp({ value: anchor.left, min: padding, max: maxLeft }),
    side,
  }
}
