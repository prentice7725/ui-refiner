/**
 * 프레임워크 무관 휠(드럼) 피커 코어 (의존성 0).
 *
 * 스크롤·스냅·관성은 브라우저 네이티브(CSS scroll-snap)에 맡기고, JS는
 *  ① 스크롤 위치 → 가운데 인덱스 계산(data-center 갱신; aria-activedescendant는 확정 인덱스를 가리킨다)
 *  ② 각 항목에 거리 기반 rotateX·opacity·translateZ 적용(rAF로 프레임당 1회)
 *  ③ 스크롤이 멎으면(scrollend, 미지원 시 150ms 디바운스) onChange
 *  ④ 키보드(방향키·Home/End·PageUp/Down)·항목 클릭 → 해당 인덱스로 scrollTo
 * 만 담당한다. 항목 높이·보이는 개수·패딩은 wheel-picker.css의 CSS 변수가 정한다.
 *
 * 바닐라 사용: createWheel({ container: 스크롤 트랙, onChange })
 * React 사용: WheelPicker.tsx가 이 코어를 감싼다.
 */
import { indexFromScrollTop, itemStyleAt, nextIndexForKey, scrollTopForIndex } from './wheelCore'

type CreateWheelOptions = {
  /** 스크롤 트랙 요소(.wheel-track) — 직계 자식이 항목(.wheel-item)이다 */
  container: HTMLElement
  /** 항목 높이(px). 생략하면 첫 항목의 offsetHeight, 그것도 0이면 36 */
  itemHeight?: number
  /** 가운데 항목이 확정될 때(스크롤 정지·키보드·클릭) */
  onChange?: (index: number) => void
  /** 거리 1당 기울기(도). 기본 20 */
  degPerItem?: number
  /** scrollend 미지원 브라우저의 정지 판정 대기(ms). 기본 150 */
  settleMs?: number
}

export type WheelHandle = {
  /** 인덱스로 이동. 외부 value 변경·초기 배치는 behavior 'instant'로 */
  setIndex: (index: number, options?: { behavior?: ScrollBehavior }) => void
  /** 마지막으로 확정된(onChange에 보고된) 인덱스 */
  getIndex: () => number
  destroy: () => void
}

const reducedMotionQuery = () =>
  typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null

export const createWheel = ({ container, itemHeight: itemHeightOption, onChange, degPerItem, settleMs = 150 }: CreateWheelOptions): WheelHandle => {
  const reduced = reducedMotionQuery()
  const items = () => Array.from(container.children).filter((el): el is HTMLElement => el instanceof HTMLElement)
  const first = items()[0]
  const itemHeight = itemHeightOption ?? (first?.offsetHeight || 36)
  /** 가운데 위·아래로 보이는 칸 수 — 트랙 높이에서 역산(jsdom처럼 0이면 2 = 5칸 기준) */
  const maxVisible = () => {
    const rows = Math.round(container.clientHeight / itemHeight)
    return rows > 1 ? Math.floor((rows - 1) / 2) : 2
  }

  let committed = -1
  let frame = 0
  let settleTimer = 0
  let destroyed = false

  const scrollBehavior = (): ScrollBehavior => (reduced?.matches ? 'instant' : 'smooth')

  /** 항목 id를 보장한다 — aria-activedescendant가 가리킬 수 있어야 한다 */
  const ensureId = (item: HTMLElement, index: number) => {
    if (!item.id) item.id = `${container.id || 'wheel'}-option-${index}`
    return item.id
  }

  /** 확정 인덱스를 보조기술에 알린다 — 굴러가는 중간 항목이 아니라 멈춘 값만 읽히게 */
  const announce = (index: number) => {
    const item = items()[index]
    if (item) container.setAttribute('aria-activedescendant', ensureId(item, index))
  }

  /** 현재 scrollTop 기준으로 3D 자세·가운데 표시를 그린다 (프레임당 1회) */
  const render = () => {
    frame = 0
    const list = items()
    if (list.length === 0) return
    const center = container.scrollTop / itemHeight
    const centerIndex = indexFromScrollTop({ scrollTop: container.scrollTop, itemHeight, count: list.length })
    const visible = maxVisible()
    const flat = reduced?.matches ?? false
    list.forEach((item, index) => {
      if (index === centerIndex) item.setAttribute('data-center', '')
      else item.removeAttribute('data-center')
      if (flat) {
        // 모션 완화: 평평한 스냅 리스트 — 기울기·흐림을 적용하지 않는다(CSS도 !important로 이중 보장)
        item.style.transform = ''
        item.style.opacity = ''
        return
      }
      const { rotateX, opacity, translateZ } = itemStyleAt({ distance: index - center, maxVisible: visible, degPerItem })
      item.style.transform = `rotateX(${rotateX}deg) translateZ(${translateZ}px)`
      item.style.opacity = String(opacity)
    })
  }

  const scheduleRender = () => {
    if (frame) return
    frame = requestAnimationFrame(render)
  }

  /** 인덱스를 확정하고 바뀌었을 때만 onChange */
  const commit = (index: number) => {
    if (index === committed) return
    committed = index
    announce(index)
    onChange?.(index)
  }

  const settle = () => {
    settleTimer = 0
    commit(indexFromScrollTop({ scrollTop: container.scrollTop, itemHeight, count: items().length }))
  }

  const supportsScrollEnd = 'onscrollend' in window
  const handleScroll = () => {
    scheduleRender()
    if (supportsScrollEnd) return
    // 마지막 scroll 이벤트 뒤 settleMs 동안 조용하면 멈춘 것으로 본다
    if (settleTimer) clearTimeout(settleTimer)
    settleTimer = window.setTimeout(settle, settleMs)
  }

  const setIndex: WheelHandle['setIndex'] = (index, options) => {
    const count = items().length
    const target = Math.max(0, Math.min(index, count - 1))
    if (count === 0 || destroyed) return
    committed = target
    announce(target)
    container.scrollTo({ top: scrollTopForIndex({ index: target, itemHeight }), behavior: options?.behavior ?? scrollBehavior() })
  }

  /** 키보드·클릭처럼 사용자가 의도한 이동은 스크롤이 끝나기를 기다리지 않고 바로 확정한다 */
  const moveTo = (index: number) => {
    const changed = index !== committed
    setIndex(index)
    if (changed) onChange?.(index)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const next = nextIndexForKey({ index: Math.max(0, committed), count: items().length, key: event.key, page: maxVisible() * 2 + 1 })
    if (next === null) return
    event.preventDefault() // 방향키가 페이지를 스크롤하지 않게
    moveTo(next)
  }

  const handleClick = (event: MouseEvent) => {
    // 클릭 지점에서 트랙 직계 자식(항목)까지 올라간다 — 클래스명에 의존하지 않는다
    let node = event.target as HTMLElement | null
    while (node && node.parentElement !== container) node = node.parentElement
    if (!node) return
    const index = items().indexOf(node)
    if (index >= 0) moveTo(index)
  }

  container.addEventListener('scroll', handleScroll, { passive: true })
  if (supportsScrollEnd) container.addEventListener('scrollend', settle)
  container.addEventListener('keydown', handleKeyDown)
  container.addEventListener('click', handleClick)
  reduced?.addEventListener?.('change', scheduleRender)
  // 보이는 칸 수·항목 높이가 바뀌면 스크롤 이벤트 없이도 기울기를 다시 그린다
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleRender) : null
  resizeObserver?.observe(container)
  render()

  return {
    setIndex,
    getIndex: () => committed,
    destroy: () => {
      destroyed = true
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('scrollend', settle)
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('click', handleClick)
      reduced?.removeEventListener?.('change', scheduleRender)
      resizeObserver?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      if (settleTimer) clearTimeout(settleTimer)
    },
  }
}
