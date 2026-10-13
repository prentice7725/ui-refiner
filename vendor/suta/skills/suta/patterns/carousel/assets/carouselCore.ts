/**
 * 프레임워크 무관 캐러셀 코어 (의존성 0).
 *
 * 스크롤·스냅은 전적으로 CSS(scroll-snap)가 담당한다 — JS는 두 가지만 한다:
 * ① 어느 슬라이드가 활성인지 추적(IntersectionObserver, 과반 노출 기준)
 * ② 도트·화살표로 특정 슬라이드로 이동(scrollTo)
 * scroll 이벤트 리스너 없이 동작하므로 스크롤 성능을 깎지 않는다.
 */

type ObserveActiveSlideOptions = {
  /** overflow-x 스크롤 + scroll-snap이 걸린 트랙 — 직계 자식들이 슬라이드다 */
  track: HTMLElement
  onChange: (index: number) => void
}

export const observeActiveSlide = ({ track, onChange }: ObserveActiveSlideOptions) => {
  if (typeof IntersectionObserver === 'undefined') return () => {}

  const slides = Array.from(track.children)
  let activeIndex = -1

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const index = slides.indexOf(entry.target)
        if (index !== activeIndex) {
          activeIndex = index
          onChange(index)
        }
      }
    },
    // 트랙 안에서 과반이 보이는 슬라이드를 활성으로 본다
    { root: track, threshold: 0.6 },
  )
  slides.forEach((slide) => observer.observe(slide))
  return () => observer.disconnect()
}

type ScrollToSlideOptions = {
  track: HTMLElement
  index: number
  /** 기본: smooth, 단 모션 완화 사용자는 즉시 점프 */
  behavior?: ScrollBehavior
}

const preferredBehavior = (): ScrollBehavior =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'

const activeFrames = new WeakMap<HTMLElement, number>()

/** snap 애니메이션 중 크롬이 프레임마다 스냅을 개입시키지 않도록, 이동 동안 스냅을 끄고 rAF로 보간한다.
 *  네이티브 scrollTo({behavior:'smooth'})를 쓰지 않는 이유: scroll-snap mandatory 트랙에서
 *  크롬이 smooth 프로그램 스크롤을 무시하는 문제가 있다. */
const animateScroll = ({ track, target }: { track: HTMLElement; target: number }) => {
  const from = track.scrollLeft
  if (from === target) return
  const pending = activeFrames.get(track)
  if (pending !== undefined) cancelAnimationFrame(pending)
  track.style.scrollSnapType = 'none'
  const durationMs = 320
  const start = performance.now()
  const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 3)
  const tick = (now: number) => {
    const progress = Math.min((now - start) / durationMs, 1)
    track.scrollLeft = from + (target - from) * easeOut(progress)
    if (progress < 1) {
      activeFrames.set(track, requestAnimationFrame(tick))
      return
    }
    track.style.scrollSnapType = ''
    activeFrames.delete(track)
  }
  activeFrames.set(track, requestAnimationFrame(tick))
}

export const scrollToSlide = ({ track, index, behavior = preferredBehavior() }: ScrollToSlideOptions) => {
  const slide = track.children[index] as HTMLElement | undefined
  if (!slide) return
  // 트랙이 position: relative(carousel.css)라 offsetLeft가 트랙 기준 좌표다.
  // snap-align: center에 맞춰 슬라이드가 트랙 중앙에 오는 좌표를 목표로 한다.
  const max = track.scrollWidth - track.clientWidth
  const centered = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2
  const target = Math.max(0, Math.min(centered, max))
  if (behavior === 'auto') {
    track.scrollTo({ left: target })
    return
  }
  animateScroll({ track, target })
}
