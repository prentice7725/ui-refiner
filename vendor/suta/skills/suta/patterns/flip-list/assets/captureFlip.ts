/**
 * 프레임워크 무관 FLIP 코어 (의존성 0).
 *
 * FLIP(First-Last-Invert-Play): 재배치 전 위치를 기억(First)하고, DOM이 바뀐 뒤(Last)
 * 각 요소를 이전 위치로 transform으로 되돌렸다가(Invert) 제자리로 전환(Play)한다.
 * top/left를 애니메이션하는 대신 transform만 쓰므로 GPU 합성으로 처리된다 —
 * 리스트 정렬·추가·삭제가 "순간이동" 대신 미끄러지는 이동으로 보인다.
 *
 * 각 항목에는 고유한 data-flip-id가 필요하다 — 재배치 전후의 같은 항목을 잇는 열쇠다.
 */

type PlayOptions = {
  durationMs?: number
  easing?: string
}

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const captureFlip = ({ container }: { container: HTMLElement }) => {
  const first = new Map<string, DOMRect>()
  for (const child of Array.from(container.children)) {
    const id = (child as HTMLElement).dataset.flipId
    if (id) first.set(id, child.getBoundingClientRect())
  }

  const play = ({ durationMs = 300, easing = 'cubic-bezier(0.22, 1, 0.36, 1)' }: PlayOptions = {}) => {
    if (prefersReducedMotion()) return // 이동 연출 생략 — 재배치 결과는 이미 화면에 있다

    for (const child of Array.from(container.children)) {
      const el = child as HTMLElement
      const id = el.dataset.flipId
      const prev = id ? first.get(id) : undefined
      if (!prev) continue // 캡처 이후 새로 생긴 항목 — 이동 이력이 없다
      const next = el.getBoundingClientRect()
      const dx = prev.left - next.left
      const dy = prev.top - next.top
      if (dx === 0 && dy === 0) continue

      // Invert: 전환 없이 이전 위치로 되돌려 놓는다
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`

      const finish = () => {
        el.style.transition = ''
        el.removeEventListener('transitionend', finish)
      }
      // Play: 브라우저가 invert 상태를 그린 다음 프레임에 제자리로 전환한다
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${durationMs}ms ${easing}`
          el.style.transform = ''
          el.addEventListener('transitionend', finish)
        })
      })
    }
  }

  return { play }
}
