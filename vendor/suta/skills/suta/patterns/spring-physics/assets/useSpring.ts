import { useEffect, useRef } from 'react'
import { animateSpring, type SpringHandle } from './animateSpring'
import type { SpringConfig } from './spring'

type UseSpringOptions = {
  /** 초기값 */
  initial?: number
  config?: SpringConfig
  /** 매 프레임 값 — 여기서 DOM에 직접 쓴다(React state로 올리면 프레임마다 렌더된다) */
  onUpdate: (value: number) => void
}

/**
 * 스프링 값 하나를 다루는 훅. to(target, velocity)로 목표를 주면 현재 위치·속도에서 이어서 움직인다.
 * 값은 React state가 아니다 — onUpdate에서 ref로 잡은 요소의 transform에 직접 쓴다.
 */
export const useSpring = ({ initial = 0, config, onUpdate }: UseSpringOptions) => {
  const handleRef = useRef<SpringHandle | null>(null)
  const valueRef = useRef(initial)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const configRef = useRef(config)
  configRef.current = config

  useEffect(function stopOnUnmount() {
    return () => handleRef.current?.stop()
  }, [])

  const to = (target: number, velocity?: number) => {
    const running = handleRef.current
    if (running && velocity === undefined) {
      running.retarget(target)
      return
    }
    const from = running ? running.current().value : valueRef.current
    const v = velocity ?? running?.current().velocity ?? 0
    running?.stop()
    handleRef.current = animateSpring({
      from,
      to: target,
      velocity: v,
      config: configRef.current,
      onUpdate: (value) => {
        valueRef.current = value
        onUpdateRef.current(value)
      },
    })
  }

  /** 제스처 중 손가락 값을 그대로 쓸 때 — 애니메이션을 멈추고 값만 기록한다 */
  const set = (value: number) => {
    handleRef.current?.stop()
    handleRef.current = null
    valueRef.current = value
    onUpdateRef.current(value)
  }

  return { to, set, get: () => valueRef.current }
}
