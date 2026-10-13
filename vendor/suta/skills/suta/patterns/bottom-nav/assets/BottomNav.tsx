import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { badgeLabel, formatBadge, isCurrentTab, watchKeyboard, type BadgeLabels, type TabBadge } from './bottomNavCore'
import './bottom-nav.css'

export type BottomNavItem = {
  href: string
  label: string
  /** 선 아이콘 하나(24px). 글자 라벨이 함께 있으니 아이콘은 장식이다 — aria-hidden으로 그린다 */
  icon: ReactNode
  /** 현재 탭일 때 바꿔 그릴 아이콘(채운 모양). 없으면 icon을 그대로 쓰고 색만 바뀐다 */
  currentIcon?: ReactNode
  badge?: TabBadge
}

type BottomNavProps = {
  items: BottomNavItem[]
  /** 지금 경로 — 라우터의 location.pathname */
  path: string
  /** 상세·장바구니·주문처럼 탭 바를 두지 않는 화면이면 true(shouldShowBottomNav로 정한다) */
  hidden?: boolean
  /** 내비게이션 이름 — 기본 '주요 메뉴' */
  label?: string
  /** 배지를 말로 읽을 문구 — 기본은 한국어("새 항목 3개") */
  badgeLabels?: BadgeLabels
  /** 라우터에 연결 — event.preventDefault() 뒤 라우터로 이동한다. 없으면 링크가 그대로 이동한다 */
  onNavigate?: (args: { href: string; event: MouseEvent<HTMLAnchorElement> }) => void
  /** 지금 탭을 다시 눌렀을 때 — 없으면 맨 위로 스크롤한다(앱의 관례) */
  onReselect?: (href: string) => void
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 하단 탭 바(GNB) — 최상위 화면 사이를 오간다. 높이·안전 영역·숨김은 bottom-nav.css가 맡는다 */
export const BottomNav = ({ items, path, hidden = false, label = '주요 메뉴', badgeLabels, onNavigate, onReselect }: BottomNavProps) => {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(function hideWhileTyping() {
    return watchKeyboard({ onChange: setKeyboardOpen })
  }, [])

  const concealed = hidden || keyboardOpen

  const handleClick = ({ href, event }: { href: string; event: MouseEvent<HTMLAnchorElement> }) => {
    if (isCurrentTab({ href, path })) {
      event.preventDefault()
      if (onReselect) onReselect(href)
      else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      return
    }
    onNavigate?.({ href, event })
  }

  return (
    <nav className="bottom-nav" aria-label={label} data-hidden={concealed ? 'true' : undefined} inert={concealed}>
      <ul className="bottom-nav-list">
        {items.map((item) => {
          const current = isCurrentTab({ href: item.href, path })
          const badge = formatBadge(item.badge)
          const spoken = badgeLabel({ badge: item.badge, labels: badgeLabels })
          return (
            <li key={item.href} className="bottom-nav-item">
              <a className="bottom-nav-link" href={item.href} aria-current={current ? 'page' : undefined} onClick={(event) => handleClick({ href: item.href, event })}>
                <span className="bottom-nav-icon" aria-hidden="true">
                  {current && item.currentIcon ? item.currentIcon : item.icon}
                  {badge != null && (
                    <span className="bottom-nav-badge" data-dot={badge === '' ? 'true' : undefined} aria-hidden="true">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="bottom-nav-label">{item.label}</span>
                {spoken && <span className="bottom-nav-sr"> {spoken}</span>}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
