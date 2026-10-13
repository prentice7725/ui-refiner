import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { createLongPress } from './createLongPress'
import { placeContextMenu } from './placeContextMenu'
import './long-press-menu.css'

export type LongPressMenuItem = {
  label: ReactNode
  onSelect: () => void
  /** 삭제·숨기기처럼 되돌리기 어려운 항목 — 붉게 표시한다 */
  destructive?: boolean
}

type LongPressMenuProps = {
  items: LongPressMenuItem[]
  /** 길게 누를 항목 — 복제하지 않고 이 원본 자체가 떠오른다 */
  children: ReactNode
  /** 스크린 리더가 읽을 메뉴 이름 (예: "잔치국수 동작") */
  label?: string
  /** 이만큼 누르고 있어야 열림 (기본 450ms) */
  delayMs?: number
  className?: string
}

/**
 * createLongPress 코어의 React 래퍼 — 길게 누르기·우클릭으로 열리고,
 * 백드롭 클릭·Esc·스크롤·항목 선택으로 닫힌다.
 *
 * 트리거·백드롭·메뉴를 같은 부모 아래 형제로 그린다. 떠오르는 원본(z-index 41)이 백드롭(40)을
 * 이기려면 둘이 같은 stacking context에 있어야 하기 때문이다 — 포털로 body에 보내면 트리거 조상의
 * transform·opacity 하나로 순서가 깨진다.
 */
export const LongPressMenu = ({ items, children, label, delayMs, className }: LongPressMenuProps) => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const [open, setOpen] = useState(false)

  const close = () => {
    setOpen(false)
    // 메뉴 안에 있던 포커스가 body로 떨어지면 키보드 사용자는 처음부터 다시 찾아야 한다
    triggerRef.current?.focus({ preventScroll: true })
  }
  // 효과 안에서 최신 close를 쓰되 의존성에 넣지 않는다 — 렌더마다 리스너를 다시 달 이유가 없다
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(
    function bindLongPress() {
      const trigger = triggerRef.current
      if (!trigger) return
      const press = createLongPress({ target: trigger, delayMs, onLongPress: () => setOpen(true) })
      return press.destroy
    },
    [delayMs],
  )

  useLayoutEffect(
    function placeAndFocusMenu() {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!open || !trigger || !menu) return
      // 떠오른 항목 기준으로 위치를 잰다 — scale(1.04) 뒤의 rect라야 메뉴가 커진 카드에 붙는다
      const anchor = trigger.getBoundingClientRect()
      const { top, left, side } = placeContextMenu({
        anchor: { top: anchor.top, left: anchor.left, width: anchor.width, height: anchor.height },
        menu: { width: menu.offsetWidth, height: menu.offsetHeight },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      })
      menu.style.top = `${top}px`
      menu.style.left = `${left}px`
      menu.dataset.side = side // CSS가 등장 방향(transform-origin)을 이 값으로 정한다
      menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true })
    },
    [open],
  )

  useEffect(
    function closeOnScrollOrEscape() {
      if (!open) return
      const onScroll = () => closeRef.current()
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') closeRef.current()
      }
      // 열린 채 스크롤되면 메뉴가 항목에서 떨어진다 — 따라다니게 하는 대신 닫는다(iOS도 그렇다)
      window.addEventListener('scroll', onScroll, true)
      window.addEventListener('keydown', onKeyDown)
      return () => {
        window.removeEventListener('scroll', onScroll, true)
        window.removeEventListener('keydown', onKeyDown)
      }
    },
    [open],
  )

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const menu = menuRef.current
    if (!menu) return
    const buttons = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    const current = buttons.indexOf(document.activeElement as HTMLElement)
    // 끝에서 반대편으로 감는다 — 메뉴 관례다
    const focusAt = (index: number) => buttons[(index + buttons.length) % buttons.length]?.focus()

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusAt(current + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusAt(current - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAt(-1)
    } else if (event.key === 'Tab') {
      // 메뉴를 열어 둔 채 탭으로 빠져나가면 백드롭만 남는다 — 닫되 포커스는 탭이 가는 곳으로 보낸다
      setOpen(false)
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={className ? `lpm-item ${className}` : 'lpm-item'}
        data-open={open ? 'true' : 'false'}
        // 키보드 사용자는 포커스한 뒤 Shift+F10(또는 메뉴 키)으로 연다 — 브라우저가 contextmenu 이벤트를 만든다
        tabIndex={0}
        // 메뉴를 여는 트리거라 button 역할을 준다 — 역할이 없는 div에는 aria-expanded가 허용되지 않는다
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        {children}
      </div>

      {open && (
        <>
          <div className="lpm-backdrop" onClick={close} />
          <div ref={menuRef} id={menuId} className="lpm-menu" role="menu" aria-label={label} onKeyDown={onMenuKeyDown}>
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                role="menuitem"
                className="lpm-menu-item"
                data-destructive={item.destructive ? 'true' : undefined}
                tabIndex={-1}
                onClick={() => {
                  // 먼저 닫아 포커스를 트리거로 돌려놓고 실행한다 — 실행이 화면을 바꿔도 포커스를 잃지 않는다
                  close()
                  item.onSelect()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
