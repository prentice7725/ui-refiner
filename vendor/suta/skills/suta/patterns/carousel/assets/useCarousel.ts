import { useEffect, useRef, useState } from 'react'
import { observeActiveSlide, scrollToSlide } from './carouselCore'
import { createCarouselAutoplay } from './createCarouselAutoplay'
import './carousel.css'

/**
 * carousel 코어의 React 래퍼 — trackRef를 트랙에 달면
 * activeIndex가 스와이프를 따라가고, goTo(index)로 도트·화살표 이동을 만든다.
 * autoplayMs를 주면 자동재생이 붙는다(호버·포커스 정지, 일시정지 토글 제공).
 */
export const useCarousel = ({ autoplayMs }: { autoplayMs?: number } = {}) => {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const autoplayRef = useRef<ReturnType<typeof createCarouselAutoplay> | null>(null)
  const [autoplayOn, setAutoplayOn] = useState(false)

  useEffect(function trackActiveSlide() {
    const track = trackRef.current
    if (!track) return
    return observeActiveSlide({
      track,
      onChange: (index) => {
        activeIndexRef.current = index
        setActiveIndex(index)
      },
    })
  }, [])

  useEffect(
    function runAutoplay() {
      const track = trackRef.current
      if (!track || !autoplayMs) return
      const autoplay = createCarouselAutoplay({
        track,
        intervalMs: autoplayMs,
        onTick: () => {
          const count = track.children.length
          if (count > 0) scrollToSlide({ track, index: (activeIndexRef.current + 1) % count })
        },
      })
      autoplayRef.current = autoplay
      setAutoplayOn(autoplay.isPlaying())
      return () => {
        autoplay.stop()
        autoplayRef.current = null
        setAutoplayOn(false)
      }
    },
    [autoplayMs],
  )

  const goTo = (index: number) => {
    const track = trackRef.current
    if (track) scrollToSlide({ track, index })
  }

  /** 자동재생 일시정지 버튼용 — 자동재생은 사용자가 멈출 수단이 있어야 한다(WCAG 2.2.2) */
  const toggleAutoplay = () => {
    autoplayRef.current?.toggle()
    setAutoplayOn(autoplayRef.current?.isPlaying() ?? false)
  }

  return { trackRef, activeIndex, goTo, autoplayOn, toggleAutoplay }
}
