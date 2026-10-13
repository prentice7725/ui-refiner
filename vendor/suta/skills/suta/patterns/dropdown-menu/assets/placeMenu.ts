/**
 * 메뉴 위치 계산 (의존성 0, DOM 없음).
 *
 * 드롭다운이 실무에서 무너지는 지점은 "어떻게 열리는가"가 아니라 **어디에 열리는가**다:
 * 화면 아래쪽 버튼에서 열면 메뉴가 화면 밖으로 나가 잘리고, 오른쪽 끝 버튼에서 열면
 * 가로로 삐져나간다. 이 함수가 그 두 가지를 답한다 — 아래가 좁으면 위로 뒤집고,
 * 좌우로 넘치면 화면 안으로 밀어 넣는다.
 *
 * DOM을 만지지 않으므로 테스트가 곧 명세다.
 */

type Rect = { top: number; left: number; width: number; height: number }

type PlaceMenuInput = {
  /** 트리거 버튼의 화면상 위치 */
  anchor: Rect
  /** 메뉴의 크기 (열기 직전에 잰 값) */
  menu: { width: number; height: number }
  viewport: { width: number; height: number }
  /** 트리거와 메뉴 사이 간격 (기본 6) */
  gap?: number
  /** 화면 가장자리에서 최소한 띄울 여백 (기본 8) */
  padding?: number
  /** start = 트리거 왼쪽에 맞춤, end = 오른쪽에 맞춤 (기본 start) */
  align?: 'start' | 'end'
}

export type MenuPlacement = {
  top: number
  left: number
  /** 실제로 열린 방향 — CSS가 이 값으로 등장 방향을 정한다(위로 열리면 아래에서 올라와야 한다) */
  side: 'bottom' | 'top'
}

const clamp = ({ value, min, max }: { value: number; min: number; max: number }) => Math.min(Math.max(value, min), max)

export const placeMenu = ({ anchor, menu, viewport, gap = 6, padding = 8, align = 'start' }: PlaceMenuInput): MenuPlacement => {
  const below = anchor.top + anchor.height + gap
  const above = anchor.top - gap - menu.height

  // 아래에 다 들어가면 아래로. 아니면 위를 보고, 위도 좁으면 그래도 아래로 둔다
  // (둘 다 좁을 때 아래를 고르는 이유: 아래는 스크롤로 마저 볼 수 있지만 위로 넘치면 잘린다)
  const fitsBelow = below + menu.height <= viewport.height - padding
  const fitsAbove = above >= padding
  const side: MenuPlacement['side'] = fitsBelow || !fitsAbove ? 'bottom' : 'top'

  const rawLeft = align === 'end' ? anchor.left + anchor.width - menu.width : anchor.left
  const maxLeft = Math.max(padding, viewport.width - padding - menu.width)
  const maxTop = Math.max(padding, viewport.height - padding - menu.height)

  return {
    top: clamp({ value: side === 'bottom' ? below : above, min: padding, max: maxTop }),
    left: clamp({ value: rawLeft, min: padding, max: maxLeft }),
    side,
  }
}
