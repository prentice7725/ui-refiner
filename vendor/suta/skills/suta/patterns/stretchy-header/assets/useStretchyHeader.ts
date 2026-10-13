import { useEffect, useRef } from 'react'
import { createStretchyHeader } from './createStretchyHeader'
import './stretchy-header.css'

type UseStretchyHeaderOptions = {
  /** 헤더 높이(px) — CSS의 --stretch-height와 같은 값을 주면 측정이 필요 없다 */
  headerHeight?: number
  /** 패럴랙스 비율 0~1 (기본 0.5) */
  parallaxRatio?: number
  /** 포인터 당김의 최대 늘어남(px, 기본 headerHeight) */
  maxPull?: number
}

/**
 * createStretchyHeader 코어의 React 래퍼.
 * containerRef를 스크롤 컨테이너에, imageRef를 헤더 이미지(.stretchy-header-image)에 달면
 * 스크롤 패럴랙스와 당겨 늘리기가 붙는다. 옵션이 바뀌면 리스너를 다시 건다.
 */
export const useStretchyHeader = <
  ContainerT extends HTMLElement = HTMLDivElement,
  ImageT extends HTMLElement = HTMLElement,
>({ headerHeight, parallaxRatio, maxPull }: UseStretchyHeaderOptions = {}) => {
  const containerRef = useRef<ContainerT | null>(null)
  const imageRef = useRef<ImageT | null>(null)

  useEffect(
    function attachStretchyHeader() {
      const container = containerRef.current
      const image = imageRef.current
      if (!container || !image) return
      return createStretchyHeader({ container, image, headerHeight, parallaxRatio, maxPull })
    },
    [headerHeight, parallaxRatio, maxPull],
  )

  return { containerRef, imageRef }
}
