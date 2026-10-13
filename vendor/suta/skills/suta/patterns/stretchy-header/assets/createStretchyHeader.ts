/**
 * 프레임워크 무관 스트레치 헤더 코어 (의존성 0).
 *
 * - 위로 스크롤: 이미지가 콘텐츠보다 느리게 밀려 올라가며 어두워진다(패럴랙스).
 *   scroll 리스너(passive) + rAF 스로틀로 프레임당 한 번만 parallaxFrame을 적용한다.
 * - 맨 위에서 아래로 당김: 포인터로 이미지를 늘린다(stretchFrame, 위 가장자리 고정).
 *   드래그 중에는 transition을 끄고(data-stretch=pulling), 놓으면 켜서(release)
 *   CSS transition이 제자리로 되돌린다 — bottom-sheet·pull-to-refresh와 같은 분업.
 * - iOS 사파리처럼 scrollTop이 음수로 바운스하는 환경은 scroll 경로에서 native 늘어남으로 처리한다.
 * - prefers-reduced-motion이면 이동(패럴랙스 translate·늘어남)을 건너뛰고 페이드만 남긴다.
 *
 * 수치 계산은 stretchCore.ts, 모양·전환은 stretchy-header.css 몫이다.
 */
import { parallaxFrame, stretchFrame } from './stretchCore'

type CreateStretchyHeaderOptions = {
  /** 스크롤 컨테이너 — scrollTop을 읽고, scrollTop 0에서만 당김을 받는다 */
  container: HTMLElement
  /** 변형 대상 이미지(img 또는 배경 div). transform-origin: top center여야 한다 */
  image: HTMLElement
  /** 헤더 높이(px). 생략하면 image.offsetHeight를 생성 시점에 한 번 잰다 */
  headerHeight?: number
  /** 패럴랙스 비율 0~1 (기본 0.5 = 절반 속도) */
  parallaxRatio?: number
  /** 포인터 당김의 최대 늘어남(px, 기본 headerHeight) */
  maxPull?: number
}

/** 이 거리 안의 움직임은 축을 정하지 않는다 — 손떨림으로 가로/세로를 오판하지 않기 위해 */
const AXIS_LOCK_PX = 6

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const createStretchyHeader = ({
  container,
  image,
  headerHeight,
  parallaxRatio = 0.5,
  maxPull,
}: CreateStretchyHeaderOptions) => {
  const reduced = prefersReducedMotion()
  const height = headerHeight ?? image.offsetHeight
  let rafId = 0
  let pulling = false
  let axis: 'none' | 'x' | 'y' = 'none'
  let startX = 0
  let startY = 0

  const applyScroll = () => {
    const scrollTop = container.scrollTop
    if (scrollTop < 0) {
      // 브라우저가 이미 바운스한 상태 — 헤더 박스가 내려간 만큼 이미지를 올려 붙이고 늘린다
      if (reduced) return
      const { scale, translateY } = stretchFrame({ pull: -scrollTop, headerHeight: height, native: true })
      image.style.transform = `translateY(${translateY}px) scale(${scale})`
      image.style.opacity = ''
      return
    }
    // 복귀 전환이 남아 있어도 스크롤이 시작되면 프레임 단위 이동이 우선이다
    if (scrollTop > 0 && image.dataset.stretch) delete image.dataset.stretch
    const { translateY, opacity } = parallaxFrame({
      scrollTop,
      headerHeight: height,
      parallaxRatio: reduced ? 0 : parallaxRatio, // 모션 민감: 이동은 끄고 페이드만
    })
    image.style.transform = translateY === 0 ? '' : `translateY(${translateY}px)`
    image.style.opacity = opacity === 1 ? '' : String(opacity)
  }

  const onScroll = () => {
    if (rafId) return // 한 프레임에 한 번만 — scroll 이벤트는 프레임보다 잦을 수 있다
    rafId = requestAnimationFrame(() => {
      rafId = 0
      applyScroll()
    })
  }

  const onPointerDown = (event: PointerEvent | MouseEvent) => {
    if (reduced || container.scrollTop > 0) return
    if ('button' in event && event.button !== 0) return
    pulling = true
    axis = 'none'
    startX = event.clientX
    startY = event.clientY
  }

  const onPointerMove = (event: PointerEvent | MouseEvent) => {
    if (!pulling) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (axis === 'none') {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      if (axis === 'x') {
        pulling = false // 가로 제스처(캐러셀 등)다 — 이 드래그는 포기한다
        return
      }
      image.dataset.stretch = 'pulling' // CSS: transition 없음 → 손가락에 붙는다
    }
    if (dy <= 0) {
      // 위로 끌면 늘어남 없음 — 스크롤은 브라우저(pan-y)가 처리한다
      image.style.transform = ''
      return
    }
    const { scale, translateY } = stretchFrame({ pull: dy, headerHeight: height, maxPull })
    image.style.transform = `translateY(${translateY}px) scale(${scale})`
  }

  const onPointerUp = () => {
    if (!pulling) return
    pulling = false
    if (axis !== 'y') return
    image.dataset.stretch = 'release' // CSS transition이 scale 1로 되돌린다
    image.style.transform = ''
  }

  container.addEventListener('scroll', onScroll, { passive: true })
  container.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  applyScroll() // 스크롤된 채로 마운트돼도 첫 프레임이 맞도록

  return () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    container.removeEventListener('scroll', onScroll)
    container.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    image.style.transform = ''
    image.style.opacity = ''
    delete image.dataset.stretch
  }
}
