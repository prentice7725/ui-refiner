import { useRef, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { runThemeTransition } from './runThemeTransition'
import { useTheme } from './useTheme'
import './theme-toggle.css'

type ThemeToggleProps = {
  /** localStorage 키 (기본 'theme') */
  storageKey?: string
  /** 특정 영역만 전환할 때 — 기본은 문서 전체 */
  scopeRef?: { current: HTMLElement | null }
  durationMs?: number
  /** 스위치 이름(화면 낭독기가 "…, 스위치, 꺼짐"으로 읽는다) — 기본 '다크 모드' */
  label?: string
  className?: string
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" strokeLinecap="round" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5Z" strokeLinejoin="round" />
  </svg>
)

/**
 * 다크모드 토글 — 누른 지점에서 원이 퍼지며 테마가 바뀐다.
 *
 * 버튼은 role="switch"다. 두 값 사이를 오가는 켜기/끄기이므로 스크린 리더가
 * "다크 모드, 스위치, 꺼짐"처럼 현재 상태까지 읽어 준다.
 */
export const ThemeToggle = ({ storageKey, scopeRef, durationMs, label = '다크 모드', className }: ThemeToggleProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const theme = useTheme({ storageKey, targetRef: scopeRef })
  const isDark = theme.resolved === 'dark'

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    // 원은 누른 지점에서 퍼진다. 키보드(Enter/Space)로 눌렀을 땐 좌표가 0이므로 버튼 중심을 쓴다
    const rect = buttonRef.current?.getBoundingClientRect()
    const origin =
      event.clientX === 0 && event.clientY === 0 && rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: event.clientX, y: event.clientY }

    void runThemeTransition({
      origin,
      durationMs,
      scope: scopeRef?.current ?? undefined,
      // 사진을 찍은 뒤 콜백 안에서 DOM이 동기적으로 바뀌어야 한다
      apply: () => flushSync(() => theme.toggle()),
    })
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className ? `theme-toggle ${className}` : 'theme-toggle'}
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      data-theme-state={theme.resolved}
      onClick={onClick}
    >
      <span className="theme-toggle-icon" data-icon="sun">
        <SunIcon />
      </span>
      <span className="theme-toggle-icon" data-icon="moon">
        <MoonIcon />
      </span>
    </button>
  )
}
