import { computePinch, dimProgress, midpoint, type Pair, type Point } from './pinchCore'

/**
 * 프레임워크 무관 핀치줌 코어 (의존성 0).
 *
 * 상태는 래퍼의 data-zooming 하나로 표현한다: active(손가락 추종 중) → settling(복귀 전이 중) → 제거.
 * 두 손가락이 닿으면 그 중점을 transform-origin으로 잡고, 손가락을 따라 배율·이동을 인라인 transform으로 쓴다.
 * 손가락을 떼면 인라인 transform을 걷어 CSS transition(pinch-zoom.css)이 제자리로 되돌린다 — 확대 상태를 유지하지 않는다.
 * 한 손가락은 건드리지 않는다(세로 스크롤은 브라우저 몫). 두 손가락 이동만 preventDefault해 페이지 확대를 막는다.
 * 터치 이벤트를 쓰는 이유: 포인터 이벤트는 브라우저가 두 손가락 제스처를 가로채면 pointercancel로 끊기지만,
 * touchmove는 passive:false로 등록하면 우리가 취소권을 갖는다.
 */

type CreatePinchZoomOptions = {
  /** 제스처를 받는 래퍼 — data-zooming·--pinch-progress가 여기에 쓰인다 */
  element: HTMLElement
  /** 실제로 확대되는 요소 (기본 element의 첫 자식, 없으면 element) */
  target?: HTMLElement
  maxScale?: number
  /** 이 배율에서 배경 딤이 최대가 된다 (기본 2) */
  dimAtScale?: number
  onChange?: (state: { scale: number; active: boolean }) => void
}

type TouchLike = { identifier?: number; clientX: number; clientY: number }

/** 복귀 transitionend가 오지 않는 환경(jsdom·transition 미지원)을 위한 상한 */
const SETTLE_FALLBACK_MS = 500

const toPair = (touches: ArrayLike<TouchLike>): Pair => [
  { x: touches[0].clientX, y: touches[0].clientY },
  { x: touches[1].clientX, y: touches[1].clientY },
]

export const createPinchZoom = ({ element, target, maxScale = 4, dimAtScale = 2, onChange }: CreatePinchZoomOptions) => {
  const zoomTarget = target ?? (element.firstElementChild as HTMLElement | null) ?? element
  let active = false
  let start: Pair | null = null
  let settleTimer = 0
  let lastScale = 1

  const setProgress = (scale: number) => {
    element.style.setProperty('--pinch-progress', String(dimProgress({ scale, dimAtScale })))
  }

  const begin = (touches: ArrayLike<TouchLike>) => {
    window.clearTimeout(settleTimer)
    zoomTarget.removeEventListener('transitionend', finishSettle)
    active = true
    start = toPair(touches)
    const rect = zoomTarget.getBoundingClientRect()
    const origin: Point = midpoint(start)
    zoomTarget.style.transformOrigin = `${origin.x - rect.left}px ${origin.y - rect.top}px`
    zoomTarget.style.transition = 'none'
    element.setAttribute('data-zooming', 'active')
    onChange?.({ scale: 1, active: true })
  }

  const finishSettle = () => {
    window.clearTimeout(settleTimer)
    zoomTarget.removeEventListener('transitionend', finishSettle)
    element.removeAttribute('data-zooming')
    zoomTarget.style.transformOrigin = ''
    onChange?.({ scale: 1, active: false })
  }

  const end = () => {
    if (!active) return
    active = false
    start = null
    // 인라인 transform을 걷으면 CSS transition이 현재 위치에서 제자리로 되돌린다
    zoomTarget.style.transition = ''
    zoomTarget.style.transform = ''
    element.setAttribute('data-zooming', 'settling') // 복귀 중 — 딤은 페이드, 카드는 아직 위에
    setProgress(1)
    if (lastScale === 1) {
      finishSettle() // 움직이지 않았으면 transition이 없어 transitionend도 없다
      return
    }
    lastScale = 1
    zoomTarget.addEventListener('transitionend', finishSettle, { once: true })
    settleTimer = window.setTimeout(finishSettle, SETTLE_FALLBACK_MS)
  }

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 2) begin(event.touches)
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!active || !start) return
    if (event.touches.length < 2) {
      end()
      return
    }
    event.preventDefault() // 페이지 자체가 확대되는 것을 막는다 — passive:false 필수
    const { scale, tx, ty } = computePinch({ start, current: toPair(event.touches), maxScale })
    lastScale = scale
    zoomTarget.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
    setProgress(scale)
    onChange?.({ scale, active: true })
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (event.touches.length < 2) end()
  }

  element.addEventListener('touchstart', onTouchStart, { passive: true })
  element.addEventListener('touchmove', onTouchMove, { passive: false })
  element.addEventListener('touchend', onTouchEnd)
  element.addEventListener('touchcancel', onTouchEnd)

  return () => {
    element.removeEventListener('touchstart', onTouchStart)
    element.removeEventListener('touchmove', onTouchMove)
    element.removeEventListener('touchend', onTouchEnd)
    element.removeEventListener('touchcancel', onTouchEnd)
    zoomTarget.removeEventListener('transitionend', finishSettle)
    window.clearTimeout(settleTimer)
  }
}
