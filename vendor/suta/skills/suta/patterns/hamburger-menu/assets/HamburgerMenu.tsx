import { useEffect, useRef, type ReactNode } from 'react'
import './hamburger-menu.css'

type HamburgerButtonProps = {
  open: boolean
  onToggle: () => void
  /** 스크린 리더용 라벨 (기본 '메뉴 열기') */
  label?: string
  className?: string
}

/**
 * ≡ ↔ X 모핑 버튼 — 상태 표현은 aria-expanded 하나로 끝난다(CSS가 그 속성을 보고 모핑).
 * 시각 상태와 접근성 상태가 같은 속성이라 어긋날 수 없다.
 */
export const HamburgerButton = ({ open, onToggle, label = '메뉴 열기', className }: HamburgerButtonProps) => (
  <button
    type="button"
    className={className ? `hamburger ${className}` : 'hamburger'}
    aria-expanded={open}
    aria-label={label}
    onClick={onToggle}
  >
    <span className="hamburger-bar" aria-hidden="true" />
    <span className="hamburger-bar" aria-hidden="true" />
    <span className="hamburger-bar" aria-hidden="true" />
  </button>
)

type DrawerProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** 나오는 방향 (기본 left) */
  side?: 'left' | 'right'
  className?: string
}

/**
 * 사이드 드로어 — 백드롭 클릭·Esc 두 경로로 닫힌다.
 * 언마운트하지 않고 data-open으로 여닫아 닫힘 애니메이션을 CSS에 맡긴다.
 */
export const Drawer = ({ open, onClose, children, side = 'left', className }: DrawerProps) => {
  // 최신 콜백을 ref로 들고 있어 인라인 함수를 넘겨도 리스너가 재등록되지 않는다
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(
    function lockBodyScroll() {
      if (!open) return
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previous
      }
    },
    [open],
  )

  useEffect(
    function closeOnEscape() {
      if (!open) return
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onCloseRef.current()
      }
      window.addEventListener('keydown', handleKeydown)
      return () => window.removeEventListener('keydown', handleKeydown)
    },
    [open],
  )

  return (
    <>
      <div className="drawer-backdrop" data-open={open ? 'true' : 'false'} onClick={() => onCloseRef.current()} />
      <aside
        className={className ? `drawer ${className}` : 'drawer'}
        data-open={open ? 'true' : 'false'}
        data-side={side}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {children}
      </aside>
    </>
  )
}
