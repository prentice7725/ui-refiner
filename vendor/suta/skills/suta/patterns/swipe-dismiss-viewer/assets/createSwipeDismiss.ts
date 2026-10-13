import { animateSpring, type SpringHandle } from './animateSpring'
import type { SpringConfig } from './spring'
import { dismissProgress, dismissScale, frameFromRect, interpolateFrame, isEdgeStart, shouldDismiss, type Frame } from './dismissCore'

/**
 * 프레임워크 무관 "끌어내려 닫기" 코어 (의존성 0).
 *
 * 뷰어 이미지를 아무 방향으로 끌면 손가락을 따라가며 거리만큼 작아지고 배경이 투명해진다.
 * 놓는 순간 거리·속도로 판정해 (a) 닫기 — 썸네일 자리(returnTo)로 스프링 복귀 후 onDismiss, 또는
 * (b) 취소 — 화면 중앙으로 스프링 복귀. 열 때도 같은 스프링으로 썸네일에서 중앙으로 커진다(공유 요소 전환).
 * 진행도는 뷰어 요소의 --dismiss-progress(0~1)로 쓰여 배경 딤·UI 페이드를 CSS가 담당한다.
 */

type CreateSwipeDismissOptions = {
  /** 뷰어 루트 — 포인터를 받고 --dismiss-progress가 쓰인다 */
  viewer: HTMLElement
  /** 움직이는 이미지 요소 */
  image: HTMLElement
  /** 닫을 때 돌아갈 썸네일 — 없으면 끌던 방향으로 빠져나간다 */
  returnTo?: () => HTMLElement | null
  onDismiss: () => void
  thresholdPx?: number
  velocityThreshold?: number
  spring?: SpringConfig
  /** 닫기 판정 거리(px)에서 진행도 1 (기본 240) */
  progressDistance?: number
  minScale?: number
}

const IDENTITY: Frame = { x: 0, y: 0, scale: 1 }

export const createSwipeDismiss = ({
  viewer,
  image,
  returnTo,
  onDismiss,
  thresholdPx,
  velocityThreshold,
  spring = { stiffness: 260, damping: 28 },
  progressDistance,
  minScale,
}: CreateSwipeDismissOptions) => {
  let dragging = false
  let startX = 0
  let startY = 0
  let lastY = 0
  let lastTime = 0
  let velocityY = 0
  let frame: Frame = IDENTITY
  let handle: SpringHandle | null = null
  let closed = false

  const write = ({ next, progress }: { next: Frame; progress: number }) => {
    frame = next
    image.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`
    viewer.style.setProperty('--dismiss-progress', String(progress))
  }

  const thumbnailFrame = (): Frame | null => {
    const target = returnTo?.()
    if (!target) return null
    // 이미지의 "기본 자리"(transform 없는 rect) 기준으로 계산해야 하므로 현재 transform을 걷어낸 rect를 쓴다
    const previous = image.style.transform
    image.style.transform = ''
    const imageRect = image.getBoundingClientRect()
    image.style.transform = previous
    return frameFromRect({ rect: target.getBoundingClientRect(), image: imageRect })
  }

  /** from→to 프레임을 스프링 t(0→1)로 보간. progress는 progressFrom→progressTo */
  const animateTo = ({
    to,
    progressTo,
    velocity = 0,
    onComplete,
  }: {
    to: Frame
    progressTo: number
    velocity?: number
    onComplete?: () => void
  }) => {
    handle?.stop()
    const from = frame
    const progressFrom = Number(viewer.style.getPropertyValue('--dismiss-progress') || 0)
    handle = animateSpring({
      from: 0,
      to: 1,
      velocity,
      config: { restDelta: 0.001, restVelocity: 0.01, ...spring },
      onUpdate: (t) =>
        write({ next: interpolateFrame({ from, to, t }), progress: progressFrom + (progressTo - progressFrom) * t }),
      onComplete: () => {
        handle = null
        onComplete?.()
      },
    })
  }

  const dismiss = () => {
    if (closed) return
    closed = true
    const target = thumbnailFrame() ?? { x: frame.x, y: frame.y + Math.sign(frame.y || 1) * window.innerHeight, scale: 0.5 }
    // 세로 속도를 t 속도로 환산 — 남은 거리 대비 초당 몇 배 진행하는가
    const remaining = Math.max(1, Math.abs(target.y - frame.y))
    animateTo({ to: target, progressTo: 1, velocity: Math.abs(velocityY) / remaining, onComplete: onDismiss })
  }

  const cancel = () => {
    animateTo({ to: IDENTITY, progressTo: 0, velocity: 0 })
  }

  const onPointerDown = (event: PointerEvent) => {
    if (closed || event.button !== 0) return
    if (isEdgeStart({ x: event.clientX, viewportWidth: window.innerWidth })) return
    handle?.stop()
    handle = null
    dragging = true
    startX = event.clientX - frame.x
    startY = event.clientY - frame.y
    lastY = event.clientY
    lastTime = event.timeStamp
    velocityY = 0
    // 요소 밖으로 나가도 move/up을 계속 받는다. 합성 이벤트(활성 포인터 없음)에서는 던지므로 삼킨다
    try {
      viewer.setPointerCapture(event.pointerId)
    } catch {
      /* 캡처 실패는 치명적이지 않다 — 리스너가 요소에 있어 안에서는 계속 동작한다 */
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    const dt = event.timeStamp - lastTime
    if (dt > 0) velocityY = ((event.clientY - lastY) / dt) * 1000
    lastY = event.clientY
    lastTime = event.timeStamp
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    const progress = dismissProgress({ dy, distance: progressDistance })
    write({ next: { x: dx, y: dy, scale: dismissScale({ progress, minScale }) }, progress })
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    if (event.timeStamp - lastTime > 80) velocityY = 0
    if (shouldDismiss({ dy: frame.y, velocityY, thresholdPx, velocityThreshold })) dismiss()
    else cancel()
  }

  viewer.addEventListener('pointerdown', onPointerDown)
  viewer.addEventListener('pointermove', onPointerMove)
  viewer.addEventListener('pointerup', onPointerUp)
  viewer.addEventListener('pointercancel', onPointerUp)

  return {
    /** 썸네일 자리에서 중앙으로 커지며 열기 — 썸네일이 없으면 살짝 작은 상태에서 페이드 */
    open: () => {
      const from = thumbnailFrame() ?? { x: 0, y: 0, scale: 0.9 }
      write({ next: from, progress: 1 })
      animateTo({ to: IDENTITY, progressTo: 0 })
    },
    /** 버튼·Esc로 닫기 — 드래그 없이도 같은 복귀 애니메이션 */
    close: dismiss,
    get frame() {
      return frame
    },
    destroy: () => {
      handle?.stop()
      viewer.removeEventListener('pointerdown', onPointerDown)
      viewer.removeEventListener('pointermove', onPointerMove)
      viewer.removeEventListener('pointerup', onPointerUp)
      viewer.removeEventListener('pointercancel', onPointerUp)
    },
  }
}
