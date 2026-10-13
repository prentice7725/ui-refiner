import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

type UseThemeOptions = {
  /** localStorage 키 (기본 'theme') */
  storageKey?: string
  /** data-theme를 쓸 요소. 기본은 <html> — 특정 영역만 바꿀 때만 준다 */
  targetRef?: { current: HTMLElement | null }
}

const systemTheme = (): ResolvedTheme =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const readStored = (key: string): ThemeChoice => {
  try {
    const saved = localStorage.getItem(key)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system' // 프라이빗 모드·저장 차단 — 선택을 기억하지 못할 뿐 동작은 한다
  }
}

/**
 * 테마 선택을 기억하고 data-theme로 적용한다.
 *
 * 선택은 세 가지다: light · dark · system(기기 설정 따라가기).
 * "따라가기"를 따로 두는 이유는, 한 번 고른 사람도 나중에 기기 설정을 바꿀 수 있기 때문이다 —
 * dark로 고정해 두면 기기가 밝아져도 그대로 어둡다.
 */
export const useTheme = ({ storageKey = 'theme', targetRef }: UseThemeOptions = {}) => {
  const [choice, setChoice] = useState<ThemeChoice>(() => readStored(storageKey))
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme)
  const resolved: ResolvedTheme = choice === 'system' ? system : choice

  useEffect(function followSystem() {
    if (typeof matchMedia === 'undefined') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystem(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(
    function applyToDom() {
      const element = targetRef?.current ?? document.documentElement
      element.dataset.theme = resolved
    },
    [resolved, targetRef],
  )

  const setTheme = (next: ThemeChoice) => {
    setChoice(next)
    try {
      if (next === 'system') localStorage.removeItem(storageKey)
      else localStorage.setItem(storageKey, next)
    } catch {
      // 저장이 막혀도 이번 세션 동안은 동작한다
    }
  }

  return {
    /** 사용자의 선택 (system 포함) */
    choice,
    /** 실제로 적용된 테마 */
    resolved,
    setTheme,
    toggle: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
  }
}
