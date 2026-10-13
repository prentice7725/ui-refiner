/**
 * 프레임워크 무관 스크롤 리빌 코어 (의존성 0).
 *
 * IntersectionObserver로 뷰포트 진입을 감지해 요소의 data-revealed를 구동한다 —
 * 애니메이션 정의는 전적으로 CSS 몫이다(scroll-reveal.css).
 *
 * 바닐라 사용: document.querySelectorAll('.reveal').forEach((el) => revealOnScroll({ element: el }))
 * React 사용: useScrollReveal.ts가 이 코어를 감싼다.
 */

type RevealOnScrollOptions = {
  element: HTMLElement
  /** 요소가 몇 % 보였을 때 공개할지 (0~1). 기본 0.15 */
  threshold?: number
  /** 뷰포트 경계 보정 — 미리 공개하려면 '0px 0px -10% 0px' 형태로 */
  rootMargin?: string
  /** true(기본)면 한 번 공개 후 유지, false면 벗어날 때 다시 감춘다 */
  once?: boolean
  /** 공개 상태 변화 알림 (초기 등록은 변화가 아니므로 호출되지 않는다) */
  onChange?: (revealed: boolean) => void
}

/** 관찰을 시작하고 해제 함수를 반환한다 */
export const revealOnScroll = ({
  element,
  threshold = 0.15,
  rootMargin,
  once = true,
  onChange,
}: RevealOnScrollOptions) => {
  const apply = (revealed: boolean) => {
    element.dataset.revealed = revealed ? 'true' : 'false'
    onChange?.(revealed)
  }

  if (typeof IntersectionObserver === 'undefined') {
    // 구형 환경·SSR 폴백: 감추지 말고 그냥 보여준다 — 콘텐츠가 실종되는 것보다 낫다
    element.dataset.revealed = 'true'
    onChange?.(true)
    return () => {}
  }

  element.dataset.revealed = 'false'

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          apply(true)
          if (once) observer.unobserve(entry.target)
        } else if (!once) {
          apply(false)
        }
      }
    },
    { threshold, rootMargin },
  )
  observer.observe(element)
  return () => observer.disconnect()
}
