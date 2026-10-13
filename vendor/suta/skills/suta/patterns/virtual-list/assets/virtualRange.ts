/**
 * 가상 스크롤 범위 계산 (의존성 0, DOM 없음).
 *
 * 항목 1만 개를 전부 그리면 DOM 노드 1만 개가 생긴다 — 스크롤이 끊기고, 메모리가 늘고,
 * 브라우저는 보이지도 않는 것들의 레이아웃을 계속 계산한다.
 * 가상 스크롤은 **화면에 보이는 구간만 그리고**, 나머지는 "그만큼 높은 빈 상자"로 대신한다.
 *
 * 이 파일은 그 구간을 구하는 순수 함수다. DOM을 만지지 않으므로 테스트가 곧 명세다.
 *
 *   전체 높이 = 개수 × 항목 높이           (스크롤바가 진짜 길이를 갖게)
 *   보이는 구간 = 스크롤 위치 ~ +뷰포트 높이
 *   여유분(overscan) = 구간 위아래로 몇 개 더  (빠르게 스크롤할 때 빈 칸이 스치지 않게)
 */

type VirtualRangeInput = {
  /** 스크롤 상자의 현재 scrollTop */
  scrollTop: number
  /** 스크롤 상자의 보이는 높이 */
  viewportHeight: number
  /** 항목 하나의 높이 (모두 같다고 가정한다) */
  itemHeight: number
  itemCount: number
  /** 화면 밖으로 더 그려 둘 개수 (기본 3) */
  overscan?: number
  /**
   * 스크롤 **가는 방향으로만** 더 그려 둘 개수.
   * 빠르게 스크롤하면 브라우저가 화면을 먼저 옮기고 JS가 뒤늦게 따라가면서 빈 칸이 스친다 —
   * 진행 방향으로 미리 그려 두면 그 틈이 줄어든다. 반대 방향은 이미 지나간 곳이라 늘리지 않는다.
   */
  lead?: number
  /** 스크롤 방향: 1 = 아래로, -1 = 위로, 0 = 멈춤 */
  direction?: -1 | 0 | 1
}

export type VirtualRange = {
  /** 그려야 할 첫 항목 */
  startIndex: number
  /** 그려야 할 마지막 항목 (포함) */
  endIndex: number
  /** 그린 묶음을 이만큼 아래로 밀어 놓으면 제자리에 온다 */
  offsetY: number
  /** 스크롤바가 가져야 할 전체 높이 */
  totalHeight: number
}

export const virtualRange = ({
  scrollTop,
  viewportHeight,
  itemHeight,
  itemCount,
  overscan = 3,
  lead = 0,
  direction = 0,
}: VirtualRangeInput): VirtualRange => {
  const totalHeight = itemCount * itemHeight

  if (itemCount === 0 || itemHeight <= 0) {
    return { startIndex: 0, endIndex: -1, offsetY: 0, totalHeight: Math.max(0, totalHeight) }
  }

  // 스크롤이 범위를 벗어난 값(고무줄 스크롤의 음수 등)으로 들어와도 계산이 깨지지 않게 가둔다
  const top = Math.max(0, Math.min(scrollTop, Math.max(0, totalHeight - viewportHeight)))

  const firstVisible = Math.floor(top / itemHeight)
  const lastVisible = Math.floor((top + Math.max(0, viewportHeight)) / itemHeight)

  const startIndex = Math.max(0, firstVisible - overscan - (direction < 0 ? lead : 0))
  const endIndex = Math.min(itemCount - 1, lastVisible + overscan + (direction > 0 ? lead : 0))

  return { startIndex, endIndex, offsetY: startIndex * itemHeight, totalHeight }
}

/** 두 범위가 같은지 — 같으면 다시 그리지 않는다(스크롤 한 번에 리렌더 한 번을 막는 열쇠다) */
export const sameRange = (a: VirtualRange, b: VirtualRange) =>
  a.startIndex === b.startIndex && a.endIndex === b.endIndex && a.totalHeight === b.totalHeight
