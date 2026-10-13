/* @shared-core spring.ts origin: spring-physics — 다른 패턴 assets에 복사될 때 이 헤더를 유지한다(validateSkills가 원본과 해시 비교) */
/**
 * 스프링 물리 순수 계산 (의존성 0, DOM 없음).
 *
 * duration+easing 대신 stiffness(강성)·damping(감쇠)·mass(질량)로 모션을 정의한다.
 * 왜 스프링인가: 제스처가 끊긴 순간의 속도를 그대로 이어받아 자연스럽게 정착하고,
 * 목표가 도중에 바뀌어도 현재 위치·속도에서 다시 출발한다 — duration 기반은 둘 다 못 한다.
 * 감쇠 조화진동의 닫힌 해를 쓰므로 프레임 누적 오차가 없다(시간 t를 넣으면 값이 바로 나온다).
 */

export type SpringConfig = {
  /** 강성 — 클수록 빠르고 단단하다 (기본 170) */
  stiffness?: number
  /** 감쇠 — 클수록 덜 튄다 (기본 26). 임계 감쇠 = 2·√(stiffness·mass) */
  damping?: number
  /** 질량 — 클수록 느리고 묵직하다 (기본 1) */
  mass?: number
  /** 정착 판정 — 목표까지 남은 거리(기본 0.1 — px 기준. 0~1 진행도라면 0.001로) */
  restDelta?: number
  /** 정착 판정 — 속도(단위/초, 기본 1) */
  restVelocity?: number
}

export type SpringState = { value: number; velocity: number; done: boolean }

type SpringMotion = {
  from: number
  to: number
  /** 시작 속도 (단위/초). 제스처에서 놓는 순간의 속도를 넣는다 */
  velocity?: number
}

const DEFAULTS: Required<SpringConfig> = { stiffness: 170, damping: 26, mass: 1, restDelta: 0.1, restVelocity: 1 }

/** 감쇠비 ζ — 1 미만이면 튀고(underdamped), 1이면 튀지 않고 가장 빠르게 정착(critical), 초과면 굼뜨다(overdamped) */
export const dampingRatio = ({ stiffness, damping, mass }: Required<Pick<SpringConfig, 'stiffness' | 'damping' | 'mass'>>) =>
  damping / (2 * Math.sqrt(stiffness * mass))

/** 시간 t(초)에서의 위치 — 닫힌 해. 목표 기준 변위 x0=from−to, 초기 속도 v0 */
export const springAt = ({ t, motion, config }: { t: number; motion: SpringMotion; config?: SpringConfig }): number => {
  const { stiffness, damping, mass } = { ...DEFAULTS, ...config }
  const x0 = motion.from - motion.to
  const v0 = motion.velocity ?? 0
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = dampingRatio({ stiffness, damping, mass })

  let x: number
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    x = Math.exp(-zeta * w0 * t) * (x0 * Math.cos(wd * t) + ((v0 + zeta * w0 * x0) / wd) * Math.sin(wd * t))
  } else if (zeta === 1) {
    x = Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t)
  } else {
    const root = w0 * Math.sqrt(zeta * zeta - 1)
    const r1 = -zeta * w0 + root
    const r2 = -zeta * w0 - root
    const a = (v0 - r2 * x0) / (r1 - r2)
    const b = x0 - a
    x = a * Math.exp(r1 * t) + b * Math.exp(r2 * t)
  }
  return motion.to + x
}

/** 시간 t에서의 위치·속도·정착 여부 — 속도는 중앙 차분으로 구한다(닫힌 해 미분보다 단순하고 충분히 정확) */
export const springState = ({ t, motion, config }: { t: number; motion: SpringMotion; config?: SpringConfig }): SpringState => {
  const { restDelta, restVelocity } = { ...DEFAULTS, ...config }
  const eps = 0.001
  const value = springAt({ t, motion, config })
  const velocity = (springAt({ t: t + eps, motion, config }) - springAt({ t: Math.max(0, t - eps), motion, config })) / (2 * eps)
  const done = Math.abs(value - motion.to) < restDelta && Math.abs(velocity) < restVelocity
  return { value: done ? motion.to : value, velocity: done ? 0 : velocity, done }
}

/** 정착까지 걸리는 시간(ms) 추정 — 16ms 간격으로 훑어 처음 정착하는 시점. 상한 10초 */
export const springDuration = ({ motion, config }: { motion: SpringMotion; config?: SpringConfig }): number => {
  if (motion.from === motion.to && !(motion.velocity ?? 0)) return 0
  for (let ms = 0; ms <= 10_000; ms += 16) {
    if (springState({ t: ms / 1000, motion, config }).done) return ms
  }
  return 10_000
}

/**
 * CSS `linear()` easing 문자열 생성 — 스프링 곡선을 사전 샘플링해 CSS transition/animation에 얹는다.
 * 반환 duration을 transition-duration에 함께 쓴다. 인터럽트(도중 목표 변경)는 못 이어받으니 그 경우는 animateSpring을 쓴다.
 */
export const springToLinear = ({ config, velocity = 0, samples = 40 }: { config?: SpringConfig; velocity?: number; samples?: number }) => {
  const motion = { from: 0, to: 1, velocity }
  // 0~1 진행도라 px용 기본 정착 기준은 너무 거칠다 — 진행도 전용 기준으로 고정
  const progressConfig: SpringConfig = { restDelta: 0.001, restVelocity: 0.01, ...config }
  const duration = Math.max(1, springDuration({ motion, config: progressConfig }))
  const points: string[] = []
  for (let i = 0; i <= samples; i += 1) {
    const p = i / samples
    const value = springAt({ t: (p * duration) / 1000, motion, config: progressConfig })
    points.push(`${Number(value.toFixed(4))} ${Number((p * 100).toFixed(2))}%`)
  }
  return { easing: `linear(${points.join(', ')})`, duration }
}
