/**
 * 프레임워크 무관 더블탭(더블클릭) 판정 코어 (의존성 0).
 *
 * dblclick 이벤트를 쓰지 않는 이유: 모바일에서 지원이 일관되지 않고,
 * 판정 시간·이동 허용치를 조절할 수 없다. click 두 번을 직접 판정한다.
 *
 * 바닐라 사용: const cleanup = createDoubleTap({ element, onDoubleTap: ({ x, y }) => {...} })
 * React 사용: DoubleTapArea.tsx가 이 코어를 감싼다.
 */

type Point = { x: number; y: number }

type CreateDoubleTapOptions = {
  element: HTMLElement
  /** 두 탭 사이 최대 간격(ms). 기본 300 — 시스템 더블클릭 관례 */
  thresholdMs?: number
  /** 두 탭 사이 최대 이동 거리(px). 넘으면 스와이프·오조작으로 보고 무시. 기본 24 */
  maxDistancePx?: number
  /** 좌표는 뷰포트 기준(clientX/Y) — 요소 내부 좌표가 필요하면 getBoundingClientRect로 변환 */
  onDoubleTap: (point: Point) => void
}

export const createDoubleTap = ({
  element,
  thresholdMs = 300,
  maxDistancePx = 24,
  onDoubleTap,
}: CreateDoubleTapOptions) => {
  let lastTime = 0
  let lastPoint: Point | null = null

  const handleClick = (event: MouseEvent) => {
    const now = Date.now()
    const point = { x: event.clientX, y: event.clientY }
    const isSecondTap =
      lastPoint !== null &&
      now - lastTime <= thresholdMs &&
      Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) <= maxDistancePx

    if (isSecondTap) {
      // 발화 후 초기화 — 연타(3번째 클릭)가 곧바로 재발화하지 않게 한다
      lastPoint = null
      lastTime = 0
      onDoubleTap(point)
      return
    }
    lastPoint = point
    lastTime = now
  }

  element.addEventListener('click', handleClick)
  return () => element.removeEventListener('click', handleClick)
}
