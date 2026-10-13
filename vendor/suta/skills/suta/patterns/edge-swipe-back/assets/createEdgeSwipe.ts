import { animateSpring, type SpringHandle } from './animateSpring'
import type { SpringConfig } from './spring'
import { isEdgeStart, progressFrom, shouldCommit, underlayFrame } from './edgeSwipeCore'

/**
 * 프레임워크 무관 "가장자리를 끌어 뒤로가기" 코어 (의존성 0).
 *
 * 컨테이너 왼쪽 가장자리에서 오른쪽으로 끌면 현재 화면이 손가락을 따라 밀리고, 그 아래 이전 화면이
 * −shift에서 0으로 따라 나오며 어둠이 걷힌다. 놓는 순간 거리·속도로 판정해
 *  (a) 커밋 — 스프링으로 끝(진행도 1)까지 간 뒤 onBack을 부르고 스타일을 초기화한다
 *  (b) 취소 — 스프링으로 0으로 되돌아온다
 * 드래그 중에만 transition을 끄고 프레임마다 직접 쓴다. 놓은 뒤 이동은 CSS transition이 아니라 JS 스프링이다 —
 * 놓는 순간의 손가락 속도를 이어받아야 "던진 대로" 움직이기 때문이다.
 *
 * 스타일의 기준값(shift·dim)은 CSS 변수(--edge-shift·--edge-dim)를 읽는다 — CSS가 정본이고 JS는 따라간다.
 * 옵션으로 주면 옵션이 이긴다.
 */

type CreateEdgeSwipeOptions = {
  /** 포인터를 받는 요소 — 화면들을 담은 상자(position: relative; overflow: hidden) */
  container: HTMLElement
  /** 현재 화면 — 손가락을 따라 오른쪽으로 밀린다 */
  screen: HTMLElement
  /** 이전 화면 — 아래에서 −shift → 0으로 따라 나온다 */
  underlay?: HTMLElement | null
  /** 이전 화면 위의 어둠 — 진행도에 따라 걷힌다 */
  dim?: HTMLElement | null
  /** 지금 뒤로 갈 수 있는가 — false면 가장자리에서 시작해도 무시한다 */
  canGoBack: () => boolean
  /** 커밋 애니메이션이 끝난 뒤 — 여기서 **동기적으로** 화면을 pop한다(React라면 flushSync) */
  onBack: () => void
  /** 가장자리 폭(px, 기본 24) */
  edgeWidth?: number
  /** 커밋 거리 임계(0~1, 기본 0.4) */
  threshold?: number
  /** 커밋 속도 임계(px/ms, 기본 0.5) */
  velocityThreshold?: number
  /** 이전 화면이 물러나 있는 비율(0~1). 생략하면 CSS --edge-shift(30%) */
  shift?: number
  /** 어둠의 최대 불투명도(0~1). 생략하면 CSS --edge-dim(0.4) */
  dimOpacity?: number
  /** 놓은 뒤 스프링 (기본 300/34 — 거의 임계 감쇠, 튀지 않고 빠르게 정착) */
  config?: SpringConfig
}

export type EdgeSwipeTunables = Partial<Pick<CreateEdgeSwipeOptions, 'edgeWidth' | 'threshold' | 'velocityThreshold' | 'shift' | 'dimOpacity' | 'config'>>

/** 축 잠금 판정 거리 — 이보다 작게 움직인 동안은 가로/세로를 정하지 않는다 */
const AXIS_LOCK_PX = 6
/** 마지막 move 뒤 이만큼 지나 놓으면 멈췄다 본다(속도 0) */
const STALE_MS = 80
/** 진행도(0~1)용 정착 기준 — px 기본값(0.1)은 너무 거칠다 */
const PROGRESS_REST: SpringConfig = { restDelta: 0.001, restVelocity: 0.01 }

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** CSS 변수를 비율로 읽는다 — "30%"는 0.3, "0.4"는 0.4. 없거나 못 읽으면 fallback */
const readRatio = ({ el, name, fallback }: { el: HTMLElement; name: string; fallback: number }) => {
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  if (!raw) return fallback
  const value = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw)
  return Number.isFinite(value) ? value : fallback
}

export const createEdgeSwipe = ({
  container,
  screen,
  underlay,
  dim,
  canGoBack,
  onBack,
  edgeWidth,
  threshold,
  velocityThreshold,
  shift,
  dimOpacity,
  config = { stiffness: 300, damping: 34 },
}: CreateEdgeSwipeOptions) => {
  let options = { edgeWidth, threshold, velocityThreshold, shift, dimOpacity, config }
  let dragging = false
  let axis: 'none' | 'x' | 'y' = 'none'
  let pointerId = -1
  let startX = 0
  let startY = 0
  let lastX = 0
  let lastTime = 0
  let velocity = 0
  let width = 0
  let shiftRatio = 0.3
  let dimRatio = 0.4
  let progress = 0
  let handle: SpringHandle | null = null

  const write = (next: number) => {
    progress = next
    const frame = underlayFrame({ progress: next, shift: shiftRatio, dim: dimRatio })
    screen.style.transform = `translateX(${next * width}px)`
    if (underlay) underlay.style.transform = `translateX(${frame.translateXPercent}%)`
    if (dim) dim.style.opacity = String(frame.dimOpacity)
  }

  /** 인라인 스타일을 전부 걷어 CSS의 정지 상태(진행도 0)로 돌린다 */
  const reset = () => {
    progress = 0
    screen.style.transform = ''
    screen.style.transition = ''
    if (underlay) {
      underlay.style.transform = ''
      underlay.style.transition = ''
    }
    if (dim) {
      dim.style.opacity = ''
      dim.style.transition = ''
    }
    delete container.dataset.edgeSwipe
  }

  const setTransition = (value: string) => {
    screen.style.transition = value
    if (underlay) underlay.style.transition = value
    if (dim) dim.style.transition = value
  }

  /** 커밋 — 화면이 끝까지 밀린 상태에서 pop한 뒤 초기화. onBack이 동기적으로 DOM을 바꿔야 한 프레임 깜빡임이 없다 */
  const finishCommit = () => {
    handle = null
    onBack()
    reset()
  }

  const finishCancel = () => {
    handle = null
    reset()
  }

  const settle = ({ to, velocityPxPerMs }: { to: 0 | 1; velocityPxPerMs: number }) => {
    const done = to === 1 ? finishCommit : finishCancel
    // 모션 민감 사용자: 손가락 추종은 이미 끝났으니 스프링 없이 바로 결과로
    if (prefersReducedMotion()) {
      done()
      return
    }
    container.dataset.edgeSwipe = 'settling'
    handle?.stop()
    handle = animateSpring({
      from: progress,
      to,
      // px/ms → 진행도/s (스프링은 초 단위 속도를 받는다)
      velocity: width > 0 ? (velocityPxPerMs * 1000) / width : 0,
      config: { ...PROGRESS_REST, ...options.config },
      onUpdate: write,
      onComplete: done,
    })
  }

  const releaseCapture = () => {
    try {
      container.releasePointerCapture(pointerId)
    } catch {
      /* 이미 풀렸거나 합성 이벤트 — 무시 */
    }
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !canGoBack()) return
    const rect = container.getBoundingClientRect()
    if (!isEdgeStart({ x: event.clientX - rect.left, edgeWidth: options.edgeWidth })) return
    // 진행 중인 스프링(취소 복귀 등)은 멈추고 그 자리에서 이어 잡는다
    handle?.stop()
    handle = null
    width = rect.width || window.innerWidth
    shiftRatio = options.shift ?? readRatio({ el: container, name: '--edge-shift', fallback: 0.3 })
    dimRatio = options.dimOpacity ?? readRatio({ el: container, name: '--edge-dim', fallback: 0.4 })
    dragging = true
    axis = 'none'
    pointerId = event.pointerId
    startX = event.clientX - progress * width
    startY = event.clientY
    lastX = event.clientX
    lastTime = event.timeStamp
    velocity = 0
    // 요소 밖으로 나가도 move/up을 계속 받는다. 합성 이벤트(활성 포인터 없음)에서는 던지므로 삼킨다
    try {
      container.setPointerCapture(event.pointerId)
    } catch {
      /* 캡처 실패는 치명적이지 않다 — 리스너가 컨테이너에 있어 안에서는 계속 동작한다 */
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (axis === 'none') {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      if (axis === 'y') {
        // 세로 스크롤이다 — 이 드래그는 포기하고 캡처를 풀어 스크롤이 이어지게 한다
        dragging = false
        releaseCapture()
        return
      }
      setTransition('none')
      container.dataset.edgeSwipe = 'dragging'
    }

    const dt = event.timeStamp - lastTime
    if (dt > 0) velocity = (event.clientX - lastX) / dt
    lastX = event.clientX
    lastTime = event.timeStamp
    write(progressFrom({ dx, width }))
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    if (axis !== 'x') return
    releaseCapture()
    if (event.timeStamp - lastTime > STALE_MS) velocity = 0
    const commit =
      event.type !== 'pointercancel' &&
      shouldCommit({ progress, velocity, threshold: options.threshold, velocityThreshold: options.velocityThreshold })
    settle({ to: commit ? 1 : 0, velocityPxPerMs: velocity })
  }

  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('pointerup', onPointerUp)
  container.addEventListener('pointercancel', onPointerUp)

  return {
    /** 지금 진행도(0~1) — 드래그·스프링 중 값, 정지 상태면 0 */
    get progress() {
      return progress
    },
    /** 임계·가장자리 폭·스프링 등을 바꾼다 — 다시 만들지 않아도 된다(진행 중인 애니메이션을 끊지 않기 위해) */
    setOptions: (next: EdgeSwipeTunables) => {
      options = { ...options, ...next }
    },
    destroy: () => {
      handle?.stop()
      handle = null
      dragging = false
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointercancel', onPointerUp)
      reset()
    },
  }
}
