/* @shared-core shakeCore.ts origin: form-shake-error — 다른 패턴 assets에 복사될 때 이 헤더를 유지한다(validateSkills가 원본과 해시 비교) */
/**
 * 프레임워크 무관 흔들림 트리거 (의존성 0).
 *
 * data-shake 속성을 붙이면 CSS 키프레임이 돌고, animationend에 속성을 뗀다.
 * 이미 흔들리는 중에 다시 부르면 속성을 뗐다 붙여 처음부터 재생한다 — 그 사이 강제 리플로우가 없으면
 * 브라우저가 두 변경을 합쳐 애니메이션이 재시작되지 않는다.
 *
 * 모션을 줄이는 설정에서는 CSS가 animation을 끄므로 animationend가 영원히 오지 않는다 —
 * 그대로 두면 data-shake가 남아 그 속성에 걸린 스타일(붉은 테두리 등)이 지워지지 않는다.
 * 그래서 시간 상한을 함께 건다.
 */

/** animationend가 오지 않는 환경을 위한 상한 — 흔들림 자체보다 넉넉하게 */
const FALLBACK_MS = 600

const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

export const shake = (element: HTMLElement) => {
  clearTimeout(timers.get(element)) // 다시 흔들 때 앞선 상한이 새 흔들림을 지우지 못하게

  if (element.hasAttribute('data-shake')) {
    element.removeAttribute('data-shake')
    void element.offsetWidth // 강제 리플로우 — 속성 제거를 확정해야 재부착이 새 애니메이션이 된다
  }
  element.setAttribute('data-shake', '')

  const done = () => {
    clearTimeout(timers.get(element))
    timers.delete(element)
    element.removeAttribute('data-shake')
  }
  element.addEventListener('animationend', done, { once: true })
  timers.set(element, setTimeout(done, FALLBACK_MS))
}
