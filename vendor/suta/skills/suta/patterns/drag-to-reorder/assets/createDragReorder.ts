/**
 * 프레임워크 무관 끌어서 순서 바꾸기 코어 (의존성 0).
 *
 * 세로 목록에서 손잡이를 끌면 그 항목이 손가락을 따라오고, 지나친 항목들이 자리를 비켜 준다.
 * 놓으면 빈 자리로 정착한 뒤에야 onReorder로 새 순서를 알린다 — 순서를 먼저 바꾸면
 * 화면이 한 번 튀고 그 위에서 애니메이션이 시작돼 "어디로 갔는지"를 놓치기 때문이다.
 *
 * 자리 비키기는 끌리는 항목의 높이+간격만큼 이웃을 밀어 두는 것이다(transform).
 * DOM 순서는 드래그 내내 그대로다 — 끄는 도중 목록을 다시 그리면 손가락 아래 요소가 바뀐다.
 *
 * 키보드로도 순서를 바꿀 수 있다(손잡이에 포커스 → 위/아래 방향키). 마우스가 없는 사람에게
 * 드래그는 존재하지 않는 기능이므로, 손잡이는 반드시 <button>이어야 한다.
 */

type ReorderDetail = { id: string; from: number; to: number; total: number }

type CreateDragReorderOptions = {
  /** 항목들의 부모. 직계 자식 중 data-reorder-id가 있는 것만 항목으로 본다 */
  container: HTMLElement
  /** 순서가 확정됐을 때 — 여기서 실제 배열을 바꾼다 */
  onReorder: (detail: ReorderDetail) => void
  /** 손잡이 없이 항목 전체를 끌 때 눌러야 하는 시간 (ms, 기본 0 = 손잡이만 사용) */
  longPressMs?: number
  /** 끌어올렸을 때 커지는 비율 (기본 1.02) */
  liftScale?: number
  /** 정착 전환 시간 (ms, 기본 200) — CSS의 --reorder-duration과 맞춘다 */
  settleMs?: number
  /** 드래그 시작·종료 알림 (끌고 있는 항목 id, 끝나면 null) */
  onDragChange?: (id: string | null) => void
  /** 키보드로 이동했을 때 — 스크린 리더 안내 문구를 만들 때 쓴다 */
  onKeyboardMove?: (detail: ReorderDetail) => void
}

/** 길게 누르는 동안 이만큼 움직이면 드래그가 아니라 스크롤로 본다 */
const LONG_PRESS_TOLERANCE_PX = 10

export const createDragReorder = ({
  container,
  onReorder,
  longPressMs = 0,
  liftScale = 1.02,
  settleMs = 200,
  onDragChange,
  onKeyboardMove,
}: CreateDragReorderOptions) => {
  type DragState = {
    item: HTMLElement
    items: HTMLElement[]
    rects: DOMRect[]
    from: number
    to: number
    /** 이웃이 비켜 줄 거리 = 끌리는 항목의 높이 + 항목 간 간격 */
    slotSpan: number
    startY: number
  }

  let drag: DragState | null = null
  let pending: { timer: ReturnType<typeof setTimeout>; startY: number; startX: number; item: HTMLElement } | null = null

  const itemsOf = () =>
    Array.from(container.children).filter((child): child is HTMLElement => child instanceof HTMLElement && Boolean(child.dataset.reorderId))

  /** 드래그 중 터치 스크롤을 막는다 — 손가락은 지금 항목을 끌고 있다 */
  const blockTouchScroll = (event: TouchEvent) => event.preventDefault()

  const shiftNeighbors = () => {
    if (!drag) return
    const { items, from, to, slotSpan } = drag
    items.forEach((item, index) => {
      if (index === from) return
      const movedUp = to < from && index >= to && index < from
      const movedDown = to > from && index > from && index <= to
      const shift = movedUp ? slotSpan : movedDown ? -slotSpan : 0
      item.style.transform = shift === 0 ? '' : `translateY(${shift}px)`
    })
  }

  const beginDrag = ({ item, clientY }: { item: HTMLElement; clientY: number }) => {
    const items = itemsOf()
    const from = items.indexOf(item)
    if (from === -1) return
    const rects = items.map((el) => el.getBoundingClientRect())
    // 간격은 첫 두 항목 사이로 잰다 — 목록은 보통 균일한 간격을 쓴다
    const gap = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0

    drag = { item, items, rects, from, to: from, slotSpan: rects[from].height + gap, startY: clientY }
    container.dataset.reordering = 'true'
    item.dataset.dragging = 'true'
    item.style.transform = `translateY(0px) scale(${liftScale})`
    document.addEventListener('touchmove', blockTouchScroll, { passive: false })
    onDragChange?.(item.dataset.reorderId ?? null)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (drag || event.button !== 0) return
    const target = event.target as HTMLElement | null
    const item = target?.closest<HTMLElement>('[data-reorder-id]')
    if (!item || item.parentElement !== container) return

    const handle = target?.closest<HTMLElement>('[data-reorder-handle]')
    if (handle) {
      beginDrag({ item, clientY: event.clientY })
      return
    }
    // 손잡이가 아닌 곳: 길게 누르기를 허용한 목록에서만, 마우스는 기다리지 않고 바로 시작한다
    if (longPressMs <= 0) return
    if (event.pointerType === 'mouse') {
      beginDrag({ item, clientY: event.clientY })
      return
    }
    pending = {
      item,
      startX: event.clientX,
      startY: event.clientY,
      timer: setTimeout(() => {
        const held = pending
        pending = null
        if (held) beginDrag({ item: held.item, clientY: held.startY })
      }, longPressMs),
    }
  }

  const cancelPending = () => {
    if (!pending) return
    clearTimeout(pending.timer)
    pending = null
  }

  const onPointerMove = (event: PointerEvent) => {
    if (pending) {
      // 기다리는 동안 손가락이 움직이면 스크롤 의도다 — 드래그를 포기한다
      const moved = Math.abs(event.clientY - pending.startY) + Math.abs(event.clientX - pending.startX)
      if (moved > LONG_PRESS_TOLERANCE_PX) cancelPending()
      return
    }
    const current = drag
    if (!current) return

    const dy = event.clientY - current.startY
    current.item.style.transform = `translateY(${dy}px) scale(${liftScale})`

    // 끌리는 항목의 중심이 어느 항목의 중심을 지났는지로 자리를 정한다
    const center = current.rects[current.from].top + current.rects[current.from].height / 2 + dy
    let to = current.from
    current.rects.forEach((rect, index) => {
      if (index === current.from) return
      const otherCenter = rect.top + rect.height / 2
      if (index < current.from && center < otherCenter) to = Math.min(to, index)
      if (index > current.from && center > otherCenter) to = Math.max(to, index)
    })

    if (to !== current.to) {
      current.to = to
      shiftNeighbors()
    }
  }

  const finishDrag = () => {
    if (!drag) return
    const { item, items, rects, from, to } = drag
    drag = null
    document.removeEventListener('touchmove', blockTouchScroll)

    // 빈 자리의 좌표 — 아래로 갔으면 목표 슬롯의 아래끝에, 위로 갔으면 목표 슬롯의 위끝에 맞춘다
    const settleY =
      to === from ? 0 : to > from ? rects[to].bottom - rects[from].height - rects[from].top : rects[to].top - rects[from].top

    const commit = () => {
      items.forEach((el) => {
        el.style.transform = ''
        el.style.transition = ''
      })
      delete item.dataset.dragging
      delete container.dataset.reordering
      onDragChange?.(null)
      // 화면은 이미 최종 배치다 — 여기서 순서를 바꿔도 튀지 않는다
      if (to !== from) onReorder({ id: item.dataset.reorderId ?? '', from, to, total: items.length })
    }

    delete item.dataset.dragging // 전환을 다시 켠다 (CSS가 [data-dragging]에서 transition을 껐다)
    item.style.transform = `translateY(${settleY}px)`

    let done = false
    const settle = () => {
      if (done) return
      done = true
      item.removeEventListener('transitionend', onEnd)
      commit()
    }
    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName === 'transform') settle()
    }
    item.addEventListener('transitionend', onEnd)
    // transitionend가 오지 않는 경우(값이 그대로거나 전환 미지원)의 상한
    setTimeout(settle, settleMs + 60)
  }

  const onPointerUp = () => {
    cancelPending()
    finishDrag()
  }

  /** 키보드 이동 — 애니메이션 없이 즉시 확정한다(연타해도 위치를 놓치지 않게) */
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    const target = event.target as HTMLElement | null
    if (!target?.closest('[data-reorder-handle]')) return
    const item = target.closest<HTMLElement>('[data-reorder-id]')
    if (!item || item.parentElement !== container) return

    const items = itemsOf()
    const from = items.indexOf(item)
    const to = from + (event.key === 'ArrowUp' ? -1 : 1)
    if (to < 0 || to >= items.length) return

    event.preventDefault() // 목록이 스크롤되지 않게
    const detail = { id: item.dataset.reorderId ?? '', from, to, total: items.length }
    onReorder(detail)
    onKeyboardMove?.(detail)

    // 목록이 다시 그려지며 포커스를 잃는 구현을 대비해 손잡이를 되찾아 준다
    requestAnimationFrame(() => {
      const moved = container.querySelector<HTMLElement>(`[data-reorder-id="${detail.id}"] [data-reorder-handle]`)
      if (moved && document.activeElement !== moved) moved.focus()
    })
  }

  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('keydown', onKeyDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)

  return {
    /** 지금 끌고 있는 항목 id (없으면 null) */
    draggingId: () => drag?.item.dataset.reorderId ?? null,
    destroy: () => {
      cancelPending()
      document.removeEventListener('touchmove', blockTouchScroll)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    },
  }
}
