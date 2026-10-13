import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createMenu } from './createMenu'
import './dropdown-menu.css'

export type MenuItem = {
  id: string
  label: ReactNode
  onSelect: () => void
  disabled?: boolean
  /** 삭제처럼 되돌리기 어려운 항목 — 붉게 표시하고 구분선 위에 둔다 */
  danger?: boolean
}

type DropdownMenuProps = {
  /** 스크린 리더가 읽을 트리거 이름 (예: "주문 관리") */
  label: string
  items: MenuItem[]
  /** 트리거 안에 그릴 것 — 없으면 ⋯ */
  children?: ReactNode
  /** start = 트리거 왼쪽 맞춤, end = 오른쪽 맞춤 (기본 start) */
  align?: 'start' | 'end'
  className?: string
}

/**
 * 드롭다운 메뉴 — 위치 계산·키보드·닫기 규칙은 createMenu가, 모양은 CSS가 담당한다.
 *
 * 메뉴는 `position: fixed`로 띄운다. 부모의 overflow:hidden이나 transform 안에 갇히면
 * 잘리거나 엉뚱한 곳에 뜨는데, fixed면 그 영향을 받지 않는다.
 */
export const DropdownMenu = ({ label, items, children, align = 'start', className }: DropdownMenuProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<ReturnType<typeof createMenu> | null>(null)
  const menuId = useId()
  const [open, setOpen] = useState(false)

  useEffect(
    function bindMenu() {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return
      const controller = createMenu({ trigger, menu, align, onOpenChange: setOpen })
      controllerRef.current = controller
      return () => {
        controller.destroy()
        controllerRef.current = null
      }
    },
    [align],
  )

  return (
    <div className={className ? `menu-root ${className}` : 'menu-root'}>
      <button ref={triggerRef} type="button" className="menu-trigger" aria-label={label} aria-controls={menuId}>
        {children ?? '⋯'}
      </button>

      <div ref={menuRef} id={menuId} className="menu-panel" role="menu" aria-label={label} data-open={open ? 'true' : 'false'}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="menu-item"
            // 비활성 항목을 disabled로 두면 포커스가 닿지 않아 "왜 못 누르는지" 알 수 없다
            aria-disabled={item.disabled ? 'true' : undefined}
            data-danger={item.danger ? 'true' : undefined}
            tabIndex={-1}
            onClick={() => {
              if (item.disabled) return
              // 먼저 닫아 포커스를 트리거로 돌려놓고 실행한다 — 실행이 화면을 바꿔도 포커스를 잃지 않는다
              controllerRef.current?.close()
              item.onSelect()
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
