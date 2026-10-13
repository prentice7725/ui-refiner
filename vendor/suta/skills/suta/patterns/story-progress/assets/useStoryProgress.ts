import { useEffect, useRef, useState } from 'react'
import { createStoryProgress } from './createStoryProgress'
import './story-progress.css'

type UseStoryProgressOptions = {
  /** 구간(스토리 장면) 수 */
  count: number
  /** 구간 하나의 재생 시간 (기본 5000ms) */
  durationMs?: number
  onComplete?: () => void
}

/**
 * createStoryProgress 코어의 React 래퍼.
 * registerBar(index)를 각 .story-bar-fill에 달면 마운트 시 재생이 시작되고,
 * index로 장면을 전환하며 controls로 일시정지(길게 누름)·이동(탭)을 만든다.
 */
export const useStoryProgress = ({ count, durationMs, onComplete }: UseStoryProgressOptions) => {
  const barsRef = useRef<Array<HTMLElement | null>>([])
  const [index, setIndex] = useState(0)
  const controlsRef = useRef<ReturnType<typeof createStoryProgress> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const registerBar = (barIndex: number) => (el: HTMLElement | null) => {
    barsRef.current[barIndex] = el
  }

  useEffect(
    function playStory() {
      const bars = barsRef.current.filter((bar): bar is HTMLElement => bar !== null)
      if (bars.length !== count) return
      const story = createStoryProgress({
        bars,
        durationMs,
        onIndexChange: setIndex,
        onComplete: () => onCompleteRef.current?.(),
      })
      controlsRef.current = story
      story.start()
      return () => story.stop()
    },
    [count, durationMs],
  )

  return {
    registerBar,
    index,
    pause: () => controlsRef.current?.pause(),
    resume: () => controlsRef.current?.resume(),
    next: () => controlsRef.current?.next(),
    prev: () => controlsRef.current?.prev(),
    restart: () => controlsRef.current?.start(),
  }
}
