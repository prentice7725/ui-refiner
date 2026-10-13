/**
 * 프레임워크 무관 테마 전환 코어 (의존성 0).
 *
 * 다크모드로 바꿀 때 화면 전체가 한 번에 뒤집히면 "무슨 일이 일어났는지"가 안 보인다.
 * 누른 지점에서 원이 퍼지며 새 테마가 덮이면, 바뀐 원인(내가 누른 그 버튼)과 결과가 이어진다.
 *
 * 방법: View Transitions API로 이전 화면을 사진으로 남긴 뒤, **새 화면**의 clip-path를
 * 점에서 원으로 키운다. 색을 하나씩 트랜지션하는 것이 아니라 스냅샷 두 장을 겹쳐 놓고
 * 위쪽을 도려내는 것이므로, 테마 변수가 몇 개든 비용이 같다.
 *
 * 지원하지 않는 브라우저·모션 민감 설정에서는 전환 없이 즉시 바뀐다(기능은 그대로).
 */

type ViewTransition = { ready: Promise<void>; finished: Promise<void> }
type StartViewTransition = (callback: () => void | Promise<void>) => ViewTransition

type RunThemeTransitionOptions = {
  /** 원이 퍼져 나갈 지점 — 보통 누른 버튼의 중심 (뷰포트 좌표) */
  origin: { x: number; y: number }
  /**
   * 테마를 실제로 바꾸는 함수. 이 안에서 DOM이 **동기적으로** 바뀌어야 한다 —
   * React라면 flushSync로 감싼다.
   */
  apply: () => void
  durationMs?: number
  /**
   * 기본값은 완만한 ease-in-out이다. 강한 ease-out(0.22, 1, 0.36, 1)을 쓰면 반지름이
   * 초반에 폭발적으로 커졌다가 후반에 기어가는데, 눈에 보이는 것은 반지름이 아니라
   * **가장자리가 화면을 쓸고 가는 속도**라 그 커브에서는 매끄럽지 않게 읽힌다.
   */
  easing?: string
  /** 전환 범위. 기본은 문서 전체이고, 특정 영역만 바꾸려면 그 요소를 준다 */
  scope?: HTMLElement
}

/** 범위 안에서 (x, y)로부터 가장 먼 모서리까지의 거리 — 원이 이만큼 커지면 전체가 덮인다 */
const coveringRadius = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) =>
  Math.max(Math.hypot(x, y), Math.hypot(width - x, y), Math.hypot(x, height - y), Math.hypot(width - x, height - y))

const round = (value: number) => Math.round(value * 1000) / 1000

/**
 * 원의 중심·반지름을 **백분율**로 만든다.
 *
 * px로 주면 안 된다: ::view-transition-new()가 그리는 것은 화면을 찍은 스냅샷이고,
 * 그 안에서 길이는 장치 픽셀 기준으로 해석된다 — 레티나(dpr 2) 화면에서는 원이 절반 위치에서
 * 절반 크기로 자라, 엉뚱한 데서 시작해 다 덮기도 전에 끝나며 나머지가 툭 바뀐다.
 * 백분율은 기준 상자에 맞춰 해석되므로 화면 배율과 무관하게 정확하다.
 * (circle()의 백분율 반지름 기준값은 '대각선 ÷ √2'다)
 */
const circlePath = ({ x, y, width, height, radius }: { x: number; y: number; width: number; height: number; radius: number }) => {
  const reference = Math.hypot(width, height) / Math.SQRT2
  const at = `${round((x / width) * 100)}% ${round((y / height) * 100)}%`
  return (grow: number) => `circle(${round(((radius * grow) / reference) * 100)}% at ${at})`
}

const SCOPED_NAME = 'theme-scope'

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const runThemeTransition = async ({
  origin,
  apply,
  durationMs = 450,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  scope,
}: RunThemeTransitionOptions): Promise<void> => {
  const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition

  if (typeof start !== 'function' || prefersReducedMotion()) {
    apply()
    return
  }

  const root = document.documentElement
  const target = scope ?? root
  const scoped = target !== root
  const name = scoped ? SCOPED_NAME : 'root'

  // 전환 대상 이름을 이 순간에만 손댄다 — page-transition 패턴이 :root를 꺼 놨어도,
  // 반대로 영역만 바꾸려는데 페이지 전체가 딸려 오는 일도 없게 한다
  const savedRootName = root.style.viewTransitionName
  const savedTargetName = target.style.viewTransitionName
  root.style.viewTransitionName = scoped ? 'none' : 'root'
  if (scoped) target.style.viewTransitionName = SCOPED_NAME

  const restore = () => {
    root.style.viewTransitionName = savedRootName
    if (scoped) target.style.viewTransitionName = savedTargetName
  }

  const transition = start.call(document, apply)

  try {
    await transition.ready
  } catch {
    // 브라우저가 전환을 건너뛴 경우(탭이 보이지 않는 등) — 테마는 이미 바뀌었다
    restore()
    return
  }

  // 가상 요소의 좌표계는 범위의 왼쪽 위가 원점이다 — 뷰포트 좌표를 그 기준으로 옮긴다
  const box = scoped
    ? target.getBoundingClientRect()
    : ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect)

  if (box.width > 0 && box.height > 0) {
    const x = origin.x - box.left
    const y = origin.y - box.top
    const path = circlePath({ x, y, width: box.width, height: box.height, radius: coveringRadius({ x, y, width: box.width, height: box.height }) })

    root.animate(
      { clipPath: [path(0), path(1)] },
      { duration: durationMs, easing, pseudoElement: `::view-transition-new(${name})` },
    )
  }

  await transition.finished.catch(() => {})
  restore()
}
