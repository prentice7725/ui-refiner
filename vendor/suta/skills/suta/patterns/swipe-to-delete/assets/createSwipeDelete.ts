/**
 * 프레임워크 무관 스와이프 삭제 제스처 코어 (의존성 0).
 *
 * 행을 왼쪽으로 끌면 손가락을 따라오고, 놓는 순간 세 갈래로 판정한다:
 *  - 액션 폭의 절반을 넘겼거나 왼쪽으로 튕겼다 → 열림(삭제 버튼 노출, -actionWidth에 정착)
 *  - swipeOutThresholdPx를 넘겼거나 세게 튕겼다 → 끝까지 밀어 삭제(onSwipeOut)
 *  - 그 외 → 닫힘(0으로 스냅백)
 * 세로 스크롤과의 충돌은 축 잠금으로 푼다 — 처음 몇 px의 방향이 세로면 이 드래그는 포기한다.
 * 드래그 중에만 transition을 끄고, 놓으면 CSS transition(swipe-to-delete.css)이 정착 이동을 처리한다.
 */

type CreateSwipeDeleteOptions = {
  /** 미끄러지는 내용 요소 — transform이 여기에 걸린다 */
  content: HTMLElement
  /** 열렸을 때 드러나는 액션 영역 폭(px, 기본 88) */
  actionWidth?: number
  /** 이만큼 끌면 끝까지 밀어 삭제 (px, 기본 actionWidth * 2.5) */
  swipeOutThresholdPx?: number
  /** 놓는 순간 왼쪽 속도가 이 이상이면 거리와 무관하게 삭제 (px/ms, 기본 0.8) */
  swipeOutVelocity?: number
  onOpenChange?: (open: boolean) => void
  onSwipeOut: () => void
}

/** 축 잠금 판정 거리 — 이보다 작게 움직인 동안은 가로/세로를 정하지 않는다 */
const AXIS_LOCK_PX = 6
/** 살짝 튕김 판정 속도 (px/ms) */
const NUDGE_VELOCITY = 0.3

export const createSwipeDelete = ({
  content,
  actionWidth = 88,
  swipeOutThresholdPx = actionWidth * 2.5,
  swipeOutVelocity = 0.8,
  onOpenChange,
  onSwipeOut,
}: CreateSwipeDeleteOptions) => {
  let isOpen = false
  let swipedOut = false
  let dragging = false
  let axis: 'none' | 'x' | 'y' = 'none'
  let startX = 0
  let startY = 0
  let baseOffset = 0
  let offset = 0
  let lastX = 0
  let lastTime = 0
  let velocity = 0

  const settle = (target: number) => {
    content.style.transition = ''
    content.style.transform = target === 0 ? '' : `translateX(${target}px)`
  }

  const setOpen = (next: boolean) => {
    if (swipedOut) return // 이미 삭제로 빠진 행은 되돌리지 않는다
    settle(next ? -actionWidth : 0)
    if (next !== isOpen) {
      isOpen = next
      onOpenChange?.(next)
    }
  }

  const swipeOut = () => {
    if (swipedOut) return
    swipedOut = true
    content.style.transition = ''
    content.style.transform = 'translateX(-100%)'
    isOpen = false
    onSwipeOut()
  }

  const onPointerDown = (event: PointerEvent | MouseEvent) => {
    if (swipedOut || ('button' in event && event.button !== 0)) return
    dragging = true
    axis = 'none'
    startX = event.clientX
    startY = event.clientY
    lastX = event.clientX
    lastTime = Date.now()
    velocity = 0
    baseOffset = isOpen ? -actionWidth : 0
    offset = baseOffset
  }

  const onPointerMove = (event: PointerEvent | MouseEvent) => {
    if (!dragging) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (axis === 'none') {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      if (axis === 'y') {
        dragging = false // 세로 스크롤이다 — 이 드래그는 포기한다
        return
      }
      content.style.transition = 'none'
    }

    const now = Date.now()
    if (now > lastTime) velocity = (event.clientX - lastX) / (now - lastTime)
    lastX = event.clientX
    lastTime = now

    // 오른쪽으로는 0을 넘지 못한다 — 열림 상태에서 오른쪽으로 끌면 닫힐 뿐
    offset = Math.min(0, baseOffset + dx)
    content.style.transform = `translateX(${offset}px)`
  }

  const onPointerUp = () => {
    if (!dragging) return
    dragging = false
    if (axis !== 'x') return

    const flungLeft = velocity <= -swipeOutVelocity
    const nudgedLeft = velocity <= -NUDGE_VELOCITY
    const nudgedRight = velocity >= NUDGE_VELOCITY

    if (-offset >= swipeOutThresholdPx || flungLeft) {
      swipeOut()
      return
    }
    if (nudgedRight) {
      setOpen(false)
      return
    }
    setOpen(nudgedLeft || -offset >= actionWidth / 2)
  }

  content.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    swipeOut,
    destroy: () => {
      content.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    },
  }
}
