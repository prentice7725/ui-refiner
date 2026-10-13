/**
 * 프레임워크 무관 드롭다운 메뉴 코어 (의존성 0).
 *
 * select 패턴과 헷갈리기 쉬운데 ARIA 패턴부터 다르다:
 *  - select(listbox)는 **값을 고른다** — 포커스는 입력창에 남고 aria-activedescendant로 가리킨다
 *  - menu는 **동작을 실행한다** — 포커스가 항목으로 실제로 옮겨 간다(로빙 포커스)
 * 그래서 이 코어는 항목에 focus()를 건다. 스크린 리더가 "이름 바꾸기, 메뉴 항목 2/4"로 읽는 이유다.
 *
 * 담당하는 것: 열기·닫기, 위치 적용(placeMenu), 로빙 포커스, 첫 글자 점프,
 * 바깥 누름·Esc·Tab으로 닫기, 닫힐 때 트리거로 포커스 되돌리기.
 */

import { placeMenu } from './placeMenu'

type CreateMenuOptions = {
  /** 메뉴를 여는 버튼 */
  trigger: HTMLElement
  /** role="menu" 요소 — 열려 있지 않을 때는 hidden으로 감춘다 */
  menu: HTMLElement
  /** start = 트리거 왼쪽 맞춤, end = 오른쪽 맞춤 (기본 start) */
  align?: 'start' | 'end'
  gap?: number
  onOpenChange?: (open: boolean) => void
}

/** 실행 가능한 항목만 — 비활성 항목은 건너뛴다 */
const itemsOf = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter((item) => item.getAttribute('aria-disabled') !== 'true')

export const createMenu = ({ trigger, menu, align = 'start', gap, onOpenChange }: CreateMenuOptions) => {
  let open = false
  let typed = ''
  let typedTimer: ReturnType<typeof setTimeout> | undefined

  const position = () => {
    const anchor = trigger.getBoundingClientRect()
    const { top, left, side } = placeMenu({
      anchor: { top: anchor.top, left: anchor.left, width: anchor.width, height: anchor.height },
      menu: { width: menu.offsetWidth, height: menu.offsetHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      align,
      gap,
    })
    menu.style.top = `${top}px`
    menu.style.left = `${left}px`
    menu.dataset.side = side // CSS가 등장 방향을 이 값으로 정한다
  }

  const focusItem = (index: number) => {
    const items = itemsOf(menu)
    if (items.length === 0) return
    // 끝에서 반대편으로 감는다 — 메뉴 관례다(리스트박스와 다른 점)
    items[(index + items.length) % items.length].focus()
  }

  const currentIndex = () => itemsOf(menu).indexOf(document.activeElement as HTMLElement)

  const setOpen = (next: boolean, options: { restoreFocus?: boolean } = {}) => {
    if (next === open) return
    open = next
    trigger.setAttribute('aria-expanded', String(next))

    if (next) {
      menu.hidden = false
      position() // 크기를 알아야 위치를 정할 수 있으므로 보이게 한 뒤에 잰다
      focusItem(0)
    } else {
      menu.hidden = true
      // 메뉴 안에 있던 포커스가 body로 떨어지면 키보드 사용자는 처음부터 다시 찾아야 한다
      if (options.restoreFocus !== false) trigger.focus()
    }
    onOpenChange?.(next)
  }

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      focusItem(-1) // 위 방향키로 열면 마지막 항목부터
    }
  }

  const onMenuKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'Tab') {
      // 메뉴를 열어 둔 채 탭으로 빠져나가면 메뉴만 남는다 — 닫되 포커스는 탭이 가는 곳으로 보낸다
      setOpen(false, { restoreFocus: false })
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(currentIndex() + 1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(currentIndex() - 1)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      focusItem(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      focusItem(-1)
      return
    }

    // 첫 글자 점프 — 항목이 많을 때 방향키만으로는 느리다
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return
    clearTimeout(typedTimer)
    typed += event.key.toLowerCase()
    typedTimer = setTimeout(() => (typed = ''), 600)
    const items = itemsOf(menu)
    const match = items.findIndex((item) => (item.textContent ?? '').trim().toLowerCase().startsWith(typed))
    if (match !== -1) items[match].focus()
  }

  const onTriggerClick = () => setOpen(!open)

  const onOutsidePointerDown = (event: PointerEvent | MouseEvent) => {
    if (!open) return
    const target = event.target as Node
    if (menu.contains(target) || trigger.contains(target)) return
    // 바깥을 누른 사람은 그곳을 누르려던 것이다 — 포커스를 트리거로 되돌리지 않는다
    setOpen(false, { restoreFocus: false })
  }

  const onReposition = () => {
    if (open) position()
  }

  menu.hidden = true
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.setAttribute('aria-expanded', 'false')

  trigger.addEventListener('click', onTriggerClick)
  trigger.addEventListener('keydown', onTriggerKeyDown)
  menu.addEventListener('keydown', onMenuKeyDown)
  document.addEventListener('pointerdown', onOutsidePointerDown, true)
  // 열린 채 스크롤·크기 변화가 나면 메뉴가 트리거에서 떨어진다 — 따라다니게 한다
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('resize', onReposition)

  return {
    isOpen: () => open,
    open: () => setOpen(true),
    /** 항목을 실행한 뒤 부른다 — 메뉴를 닫고 트리거로 포커스를 되돌린다 */
    close: () => setOpen(false),
    destroy: () => {
      clearTimeout(typedTimer)
      trigger.removeEventListener('click', onTriggerClick)
      trigger.removeEventListener('keydown', onTriggerKeyDown)
      menu.removeEventListener('keydown', onMenuKeyDown)
      document.removeEventListener('pointerdown', onOutsidePointerDown, true)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    },
  }
}
