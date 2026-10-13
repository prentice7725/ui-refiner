import { useEffect, useRef, useState } from 'react'
import { createGlassNav, type SpyOptions } from './createGlassNav'
import { INITIAL_NAV_STATE, type NavOptions, type NavState } from './navScrollCore'
import './glass-nav.css'

type UseGlassNavOptions = NavOptions & {
  /** 스크롤 컨테이너 ref. 없으면 페이지(document) */
  containerRef?: { current: HTMLElement | null }
  /** 링크 → 섹션 이동과 활성 추적. true면 기본값. 붙일 때 한 번만 읽는다(링크·섹션 짝은 마운트 시 수집) */
  spy?: boolean | Omit<SpyOptions, 'onActive'>
}

/**
 * createGlassNav 코어의 React 래퍼.
 * navRef를 <header class="gnav">에 달면 스크롤에 따라 data-elevated·data-hidden·data-compact가 붙는다.
 * 상태는 DOM 속성으로만 바뀌고(렌더 없음), 화면에 표시하고 싶을 때만 반환된 state·activeId를 쓴다.
 */
export const useGlassNav = ({ containerRef, spy, ...options }: UseGlassNavOptions = {}) => {
  const navRef = useRef<HTMLElement | null>(null)
  const [state, setState] = useState<NavState>(INITIAL_NAV_STATE)
  const [activeId, setActiveId] = useState<string | null>(null)
  const controllerRef = useRef<ReturnType<typeof createGlassNav> | null>(null)

  useEffect(
    function attachScrollNav() {
      const nav = navRef.current
      if (!nav) return
      const controller = createGlassNav({
        container: containerRef?.current ?? document,
        nav,
        onChange: setState,
        spy: spy ? { ...(spy === true ? {} : spy), onActive: setActiveId } : undefined,
        ...options,
      })
      controllerRef.current = controller
      return () => {
        controller.destroy()
        controllerRef.current = null
      }
    },
    // 컨테이너가 바뀔 때만 다시 붙인다 — 옵션 변경은 아래 setOptions로 흘려 스크롤 상태를 잃지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containerRef?.current],
  )

  useEffect(
    function syncOptions() {
      controllerRef.current?.setOptions(options)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.mode, options.thresholdPx, options.hideAfterPx, options.minDeltaPx],
  )

  return { navRef, state, activeId }
}
