import { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { createEdgeSwipe, type EdgeSwipeTunables } from './createEdgeSwipe'
import './edge-swipe-back.css'

type UseEdgeSwipeBackOptions = EdgeSwipeTunables & {
  /** 지금 뒤로 갈 수 있는가 (스택 깊이 > 1) */
  canGoBack: boolean
  /** 커밋 뒤 화면을 pop한다 — setState만 하면 된다(훅이 flushSync로 감싼다) */
  onBack: () => void
}

/**
 * createEdgeSwipe의 React 훅. 네 개의 ref를 돌려주며, 각각 상자·현재 화면·이전 화면·어둠 요소에 붙인다.
 * 네 요소는 **한 번 마운트되면 그대로 두고 안의 내용만 바꾼다**(key로 갈아 끼우지 않는다) — 코어가 요소를 붙잡고 있다.
 *
 * onBack은 flushSync로 감싼다: 커밋 스프링이 끝난 순간 화면은 오른쪽 끝에 밀려 있고, 코어는 onBack 직후 transform을
 * 걷어 낸다. 이때 DOM이 아직 옛 화면이면 옛 화면이 제자리로 튀어 한 프레임 깜빡인다 — 동기 렌더가 그 프레임을 없앤다.
 */
export const useEdgeSwipeBack = ({ canGoBack, onBack, ...tunables }: UseEdgeSwipeBackOptions) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const underlayRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<ReturnType<typeof createEdgeSwipe> | null>(null)
  // 최신 값은 ref로 — 코어를 다시 만들지 않기 위해(다시 만들면 진행 중인 스프링이 끊긴다)
  const canGoBackRef = useRef(canGoBack)
  canGoBackRef.current = canGoBack
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(function bindEdgeSwipe() {
    const container = containerRef.current
    const screen = screenRef.current
    if (!container || !screen) return
    const controller = createEdgeSwipe({
      container,
      screen,
      underlay: underlayRef.current,
      dim: dimRef.current,
      canGoBack: () => canGoBackRef.current,
      onBack: () => flushSync(() => onBackRef.current()),
    })
    controllerRef.current = controller
    return () => {
      controller.destroy()
      controllerRef.current = null
    }
  }, [])

  const { edgeWidth, threshold, velocityThreshold, shift, dimOpacity, config } = tunables
  useEffect(
    function syncTunables() {
      controllerRef.current?.setOptions({ edgeWidth, threshold, velocityThreshold, shift, dimOpacity, config })
    },
    // config는 보통 인라인 객체라 매 렌더 새 참조지만 setOptions는 대입 한 줄이라 비용이 없다
    [edgeWidth, threshold, velocityThreshold, shift, dimOpacity, config],
  )

  return { containerRef, screenRef, underlayRef, dimRef }
}
