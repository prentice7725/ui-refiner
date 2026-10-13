import { useEffect, useRef } from 'react'
import { createToastStack } from './createToastStack'
import './toast-stack.css'

type UseToastStackOptions = {
  durationMs?: number
  maxVisible?: number
  /** 'bottom'(기본) 또는 'top' — 상단 배너처럼 위에서 내려온다 */
  position?: 'bottom' | 'top'
}

/**
 * createToastStack 코어의 React 래퍼 — 마운트 시 스택을 만들고 언마운트 시 정리한다.
 * 반환된 toast(message)를 어디서든 호출하면 쌓인다.
 */
export const useToastStack = ({ durationMs, maxVisible, position }: UseToastStackOptions = {}) => {
  const stackRef = useRef<ReturnType<typeof createToastStack> | null>(null)

  useEffect(
    function mountToastRegion() {
      const stack = createToastStack({ durationMs, maxVisible, position })
      stackRef.current = stack
      return () => {
        stackRef.current = null
        stack.destroy()
      }
    },
    [durationMs, maxVisible, position],
  )

  const toast = (message: string) => stackRef.current?.show(message)
  /** 화면이 바뀔 때 부른다 — 라우터의 경로가 바뀌는 useEffect에서 */
  const clearToasts = () => stackRef.current?.clear()

  return { toast, clearToasts }
}
