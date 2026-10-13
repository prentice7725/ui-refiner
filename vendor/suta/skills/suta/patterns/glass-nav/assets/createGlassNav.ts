import { INITIAL_NAV_STATE, reduceNavState, type NavOptions, type NavState } from './navScrollCore'
import { activeSectionFor, pillFrame, scrollTargetFor, type SectionOffset } from './navSpyCore'

/**
 * 프레임워크 무관 GNB 스크롤 반응 코어 (의존성 0).
 *
 * 스크롤 컨테이너(또는 window)의 scroll 이벤트를 passive로 듣고, 프레임당 한 번만 판정해
 * nav 요소에 data-elevated · data-hidden · data-compact를 붙인다. 움직임 자체는 CSS(glass-nav.css)가
 * transition으로 그린다 — JS는 상태만 정한다.
 *
 * spy 옵션을 켜면 링크(.gnav-links a[href^="#"])와 같은 id의 섹션을 짝지어:
 *  - 링크 클릭 → 그 섹션 시작이 GNB 바로 아래에 오도록 부드럽게 스크롤(해시는 바꾸지 않는다)
 *  - 스크롤 → 지금 보이는 섹션의 링크에 aria-current="page", .gnav-current 텍스트, .gnav-pill 위치를 맞춘다
 *
 * 바닐라: createGlassNav({ container: document, nav, mode: 'hide', spy: true })
 * React: useGlassNav.ts가 이 코어를 감싼다.
 */

export type SpyOptions = {
  /** 섹션 시작을 GNB 아래 몇 px에 둘지·활성 판정 여유 (기본 8) */
  offsetPx?: number
  /** 클릭 스크롤 동안 숨김·축소·활성 추적을 멈추는 시간 (기본 900ms — 부드러운 스크롤이 끝나기에 충분) */
  lockMs?: number
  /** 활성 섹션 id가 바뀔 때 (없으면 null) */
  onActive?: (id: string | null) => void
}

type CreateGlassNavOptions = NavOptions & {
  /** 스크롤되는 요소. 페이지 전체가 스크롤되면 document(기본) */
  container?: HTMLElement | Document
  /** 상태 속성을 붙일 GNB 요소 */
  nav: HTMLElement
  onChange?: (state: NavState) => void
  /** 링크 → 섹션 이동과 활성 추적. true면 기본값으로 켠다 */
  spy?: boolean | SpyOptions
}

const scrollTopOf = (container: HTMLElement | Document) =>
  container instanceof Document ? container.documentElement.scrollTop || document.body.scrollTop || 0 : container.scrollTop

const maxScrollTopOf = (container: HTMLElement | Document) =>
  container instanceof Document
    ? container.documentElement.scrollHeight - window.innerHeight
    : container.scrollHeight - container.clientHeight

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const createGlassNav = ({ container = document, nav, onChange, spy, ...options }: CreateGlassNavOptions) => {
  let state: NavState = INITIAL_NAV_STATE
  let current: NavOptions = options
  let frame = 0

  const apply = (next: NavState) => {
    const changed = next.elevated !== state.elevated || next.hidden !== state.hidden || next.compact !== state.compact
    state = next
    if (!changed) return
    nav.dataset.elevated = String(next.elevated)
    nav.dataset.hidden = String(next.hidden)
    nav.dataset.compact = String(next.compact)
    onChange?.(next)
  }

  // ── 섹션 추적(spy) ──
  const spyOptions: SpyOptions | null = spy ? (spy === true ? {} : spy) : null
  const offsetPx = spyOptions?.offsetPx ?? 8
  const lockMs = spyOptions?.lockMs ?? 900
  const doc = container instanceof Document ? container : container.ownerDocument
  // 링크와 섹션 짝 — href="#id"와 같은 id의 요소가 컨테이너 안에 있어야 한다
  const pairs = spyOptions
    ? Array.from(nav.querySelectorAll<HTMLAnchorElement>('.gnav-links a[href^="#"]')).flatMap((link) => {
        const id = (link.getAttribute('href') ?? '').slice(1)
        const section = id ? doc.getElementById(id) : null
        return section && container.contains(section) ? [{ id, link, section }] : []
      })
    : []
  const pill = spyOptions ? nav.querySelector<HTMLElement>('.gnav-pill') : null
  const currentLabel = spyOptions ? nav.querySelector<HTMLElement>('.gnav-current') : null
  let activeId: string | null = null
  let lockUntil = 0
  let unlockTimer: ReturnType<typeof setTimeout> | undefined

  const sectionOffsets = (): SectionOffset[] => {
    const scrollTop = scrollTopOf(container)
    const originTop = container instanceof Document ? 0 : container.getBoundingClientRect().top
    return pairs.map(({ id, section }) => ({ id, top: section.getBoundingClientRect().top - originTop + scrollTop }))
  }

  const placePill = () => {
    if (!pill) return
    const active = pairs.find((pair) => pair.id === activeId)?.link
    if (!active) return
    const frameStyle = pillFrame({ offsetLeft: active.offsetLeft, offsetWidth: active.offsetWidth })
    pill.style.transform = frameStyle.transform
    pill.style.width = frameStyle.width
  }

  const setActive = (id: string | null) => {
    if (id === activeId) return
    activeId = id
    for (const pair of pairs) {
      if (pair.id === id) pair.link.setAttribute('aria-current', 'page')
      else pair.link.removeAttribute('aria-current')
    }
    const active = pairs.find((pair) => pair.id === id)
    if (currentLabel && active) currentLabel.textContent = active.link.textContent
    placePill()
    spyOptions?.onActive?.(id)
  }

  const measure = () => {
    frame = 0
    const scrollTop = scrollTopOf(container)
    const next = reduceNavState({ prev: state, scrollTop, options: current })
    if (Date.now() < lockUntil) {
      // 클릭으로 움직이는 동안: 바는 펼친 채 두고, 기준점만 따라가 잠금이 풀린 직후 방향 판정이 새로 시작되게
      apply({ ...next, hidden: false, compact: false, anchorY: scrollTop })
      return
    }
    apply(next)
    if (pairs.length) {
      setActive(activeSectionFor({ scrollTop, sections: sectionOffsets(), navHeight: nav.offsetHeight, offsetPx, maxScrollTop: maxScrollTopOf(container) }))
    }
  }

  const onScroll = () => {
    // 스크롤 이벤트는 프레임보다 자주 올 수 있다 — 프레임당 한 번만 판정
    if (frame) return
    frame = requestAnimationFrame(measure)
  }

  const scrollContainerTo = (top: number) => {
    const target: { scrollTo?: (options: ScrollToOptions) => void } = container instanceof Document ? window : container
    if (typeof target.scrollTo === 'function') target.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    else if (!(container instanceof Document)) container.scrollTop = top
  }

  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest?.('a[href^="#"]')
    const pair = pairs.find((item) => item.link === link)
    if (!pair) return
    // 해시 라우터(#/path)가 있는 앱에서 #id로 해시가 바뀌면 라우트가 깨진다 — 기본 이동을 막고 직접 스크롤한다
    event.preventDefault()
    const sectionTop = sectionOffsets().find((item) => item.id === pair.id)?.top ?? 0
    const top = scrollTargetFor({ sectionTop, navHeight: nav.offsetHeight, offsetPx })
    lockUntil = Date.now() + lockMs
    clearTimeout(unlockTimer)
    unlockTimer = setTimeout(function unlockAndResync() {
      lockUntil = 0
      measure()
    }, lockMs)
    setActive(pair.id) // 도착을 기다리지 않고 바로 옮긴다 — 눌렀다는 반응이 즉시 보이도록
    apply({ ...state, hidden: false, compact: false, anchorY: top })
    scrollContainerTo(top)
  }

  // 첫 상태 — 새로고침으로 중간에서 시작해도 맞는 모양으로
  nav.dataset.elevated = 'false'
  nav.dataset.hidden = 'false'
  nav.dataset.compact = 'false'
  measure()
  container.addEventListener('scroll', onScroll, { passive: true })
  if (pairs.length) {
    nav.addEventListener('click', onClick)
    // 알약 너비는 글자 너비다 — 웹폰트가 늦게 실리거나 창 크기가 바뀌면 다시 잰다
    doc.fonts?.ready.then(placePill)
    window.addEventListener('resize', placePill)
  }

  return {
    /** 지금 상태 */
    getState: () => state,
    /** 지금 활성 섹션 id (spy를 켰을 때만) */
    getActive: () => activeId,
    /** 옵션 변경(모드·임계) — 다음 스크롤부터 반영. 모드가 바뀌면 숨김·축소를 풀어 어색한 잔상을 없앤다 */
    setOptions: (next: NavOptions) => {
      current = { ...current, ...next }
      apply({ ...state, hidden: false, compact: false })
    },
    /** 링크 너비가 바뀌었을 때(폰트 로드·창 크기) 알약을 다시 맞춘다 */
    refresh: () => {
      placePill()
    },
    destroy: () => {
      cancelAnimationFrame(frame)
      clearTimeout(unlockTimer)
      container.removeEventListener('scroll', onScroll)
      nav.removeEventListener('click', onClick)
      window.removeEventListener('resize', placePill)
      delete nav.dataset.elevated
      delete nav.dataset.hidden
      delete nav.dataset.compact
    },
  }
}
