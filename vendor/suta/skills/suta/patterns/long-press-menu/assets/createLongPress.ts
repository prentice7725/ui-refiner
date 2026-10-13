/**
 * 프레임워크 무관 길게 누르기 판정 코어 (의존성 0).
 *
 * 포인터를 누르고 delayMs 동안 가만히 있으면 onLongPress를 부른다. 그 사이에
 * 손가락이 허용치보다 움직이면(스크롤·드래그를 하려던 것) 취소하고, 떼거나 취소되거나
 * 요소 밖으로 나가도 취소한다. 데스크톱의 우클릭(contextmenu)은 기다릴 필요가 없으므로
 * 즉시 같은 콜백을 부른다 — macOS의 "우클릭 = 길게 누르기" 관례다.
 *
 * 발화 뒤에 따라오는 click은 한 번 억제한다. 길게 누른 뒤 손을 떼면 브라우저가
 * click을 만드는데, 그대로 두면 메뉴를 연 손가락이 카드까지 눌러 버린다.
 *
 * 터치에서 브라우저의 기본 길게누르기 메뉴·텍스트 선택을 막는 것은 CSS 몫이다
 * (long-press-menu.css의 touch-action·-webkit-touch-callout·user-select).
 */

export type LongPressPoint = { x: number; y: number }

type CreateLongPressOptions = {
  target: HTMLElement
  /** 이만큼 누르고 있어야 발화 (기본 450ms — iOS 홈 화면 체감과 비슷한 값) */
  delayMs?: number
  /** 누른 자리에서 이 이상 움직이면 취소 (기본 10px) */
  moveTolerancePx?: number
  onLongPress: (point: LongPressPoint) => void
}

export const createLongPress = ({ target, delayMs = 450, moveTolerancePx = 10, onLongPress }: CreateLongPressOptions) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let startX = 0
  let startY = 0
  let pressing = false // 주 버튼이 눌린 채인가
  let fired = false // 이번 누름에서 이미 발화했는가 — 다음 click 억제·contextmenu 중복 방지용

  const cancel = () => {
    if (timer === undefined) return
    clearTimeout(timer)
    timer = undefined
  }

  const fire = (point: LongPressPoint) => {
    cancel()
    fired = true
    // 햅틱은 있으면 쓰고 없으면 조용히 넘어간다 — iOS 사파리는 vibrate가 없다
    if (typeof navigator !== 'undefined') navigator.vibrate?.(10)
    onLongPress(point)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return // 우클릭은 contextmenu 경로로 온다
    pressing = true
    fired = false
    startX = event.clientX
    startY = event.clientY
    cancel()
    timer = setTimeout(() => fire({ x: startX, y: startY }), delayMs)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (timer === undefined) return
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > moveTolerancePx) cancel()
  }

  const onPointerEnd = () => {
    pressing = false
    cancel()
  }

  const onClick = (event: MouseEvent) => {
    if (!fired) return
    fired = false
    event.preventDefault()
    event.stopPropagation()
  }

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault() // 브라우저 기본 메뉴는 항상 막는다
    // 안드로이드는 터치 길게누르기에도 contextmenu를 만든다 — 타이머가 이미 발화했으면 두 번 열지 않는다
    if (pressing && fired) return
    fire({ x: event.clientX, y: event.clientY })
  }

  target.addEventListener('pointerdown', onPointerDown)
  target.addEventListener('pointermove', onPointerMove)
  target.addEventListener('pointerup', onPointerEnd)
  target.addEventListener('pointercancel', onPointerEnd)
  target.addEventListener('pointerleave', onPointerEnd)
  target.addEventListener('contextmenu', onContextMenu)
  // 캡처 단계여야 카드 안쪽 버튼의 click 핸들러보다 먼저 멈출 수 있다
  target.addEventListener('click', onClick, true)

  return {
    /** 진행 중인 누름을 강제로 취소한다 (예: 열린 동안 스크롤이 시작될 때) */
    cancel: onPointerEnd,
    destroy: () => {
      cancel()
      target.removeEventListener('pointerdown', onPointerDown)
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerup', onPointerEnd)
      target.removeEventListener('pointercancel', onPointerEnd)
      target.removeEventListener('pointerleave', onPointerEnd)
      target.removeEventListener('contextmenu', onContextMenu)
      target.removeEventListener('click', onClick, true)
    },
  }
}
