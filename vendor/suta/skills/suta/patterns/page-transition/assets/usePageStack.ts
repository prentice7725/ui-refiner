import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { runPageTransition } from './runPageTransition'
import './page-transition.css'

type UsePageStackOptions<T> = {
  /** 첫 화면 */
  initial: T
  /** 스크롤되는 요소. 없으면 창(window) 기준 */
  scrollRef?: { current: HTMLElement | null }
}

/**
 * 화면 스택 — push로 들어가고 back으로 나온다. 라우터가 아니라 라우터 **없이도**
 * 앱 같은 전환을 쓰기 위한 최소 구현이다(라우터가 있다면 PATTERN.md의 조합 방법을 보라).
 *
 * 전환 자체 못지않게 중요한 것이 스크롤이다:
 *  - 들어갈 때: 지금 위치를 기억해 두고 새 화면은 맨 위에서 시작한다
 *  - 나올 때: 기억해 둔 위치로 되돌린다 — 목록 중간에서 상세로 갔다 오면 그 자리여야 한다
 * 위치 복원은 전환이 끝난 뒤가 아니라 DOM을 바꾸는 그 순간에 한다. 나중에 되돌리면
 * 애니메이션이 끝나고 화면이 한 번 튄다.
 */
export const usePageStack = <T,>({ initial, scrollRef }: UsePageStackOptions<T>) => {
  const [stack, setStack] = useState<T[]>([initial])
  const scrollMemory = useRef(new Map<number, number>())

  const readScroll = () => (scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY)
  const writeScroll = (top: number) => {
    if (scrollRef?.current) scrollRef.current.scrollTop = top
    else window.scrollTo(0, top)
  }

  const push = (screen: T) => {
    scrollMemory.current.set(stack.length - 1, readScroll())
    void runPageTransition({
      direction: 'forward',
      update: () => {
        flushSync(() => setStack((prev) => [...prev, screen]))
        writeScroll(0)
      },
    })
  }

  const back = () => {
    if (stack.length <= 1) return
    const restoreTo = scrollMemory.current.get(stack.length - 2) ?? 0
    void runPageTransition({
      direction: 'back',
      update: () => {
        flushSync(() => setStack((prev) => prev.slice(0, -1)))
        writeScroll(restoreTo)
      },
    })
  }

  return {
    current: stack[stack.length - 1],
    depth: stack.length,
    canGoBack: stack.length > 1,
    push,
    back,
  }
}
