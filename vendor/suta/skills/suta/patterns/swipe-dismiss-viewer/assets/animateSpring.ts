/* @shared-core animateSpring.ts origin: spring-physics — 다른 패턴 assets에 복사될 때 이 헤더를 유지한다 */
import { springState, type SpringConfig } from './spring'

/**
 * rAF 스프링 애니메이터 (의존성 0).
 * 매 프레임 닫힌 해로 값을 구해 onUpdate에 넘긴다. retarget()으로 도중에 목표를 바꾸면
 * 현재 위치·속도에서 새 스프링이 출발한다 — 제스처 중단·연타에 튀지 않는 이유다.
 */

type AnimateSpringOptions = {
  from: number
  to: number
  velocity?: number
  config?: SpringConfig
  onUpdate: (value: number) => void
  onComplete?: () => void
}

export type SpringHandle = {
  /** 현재 위치·속도에서 새 목표로 다시 출발 */
  retarget: (to: number) => void
  stop: () => void
  /** 지금 값·속도 — 제스처가 애니메이션 도중 잡을 때 이어받는다 */
  current: () => { value: number; velocity: number }
}

export const animateSpring = ({ from, to, velocity = 0, config, onUpdate, onComplete }: AnimateSpringOptions): SpringHandle => {
  let motion = { from, to, velocity }
  let startedAt = performance.now()
  let frame = 0
  let latest = { value: from, velocity }
  let running = true

  const tick = (now: number) => {
    if (!running) return
    const state = springState({ t: (now - startedAt) / 1000, motion, config })
    latest = { value: state.value, velocity: state.velocity }
    onUpdate(state.value)
    if (state.done) {
      running = false
      onComplete?.()
      return
    }
    frame = requestAnimationFrame(tick)
  }

  frame = requestAnimationFrame(tick)

  return {
    retarget: (nextTo) => {
      motion = { from: latest.value, to: nextTo, velocity: latest.velocity }
      startedAt = performance.now()
      if (!running) {
        running = true
        frame = requestAnimationFrame(tick)
      }
    },
    stop: () => {
      running = false
      cancelAnimationFrame(frame)
    },
    current: () => latest,
  }
}
