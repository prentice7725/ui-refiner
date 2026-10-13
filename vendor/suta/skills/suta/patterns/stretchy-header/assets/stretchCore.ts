/**
 * stretchy-header 순수 계산 (DOM 없음, 의존성 0).
 *
 * 스크롤값·당김 거리를 받아 이미지에 줄 transform 수치만 돌려준다 —
 * 측정(scrollTop·헤더 높이)은 호출자 몫이라 jsdom에서도 그대로 테스트된다.
 * 두 계산 모두 "이미지 위 가장자리는 컨테이너 상단에 붙어 있다"를 불변으로 삼는다
 * (transform-origin: top center 전제).
 */

type ParallaxInput = {
  /** 스크롤 컨테이너의 scrollTop (0 이상일 때만 의미 있다) */
  scrollTop: number
  headerHeight: number
  /** 0 = 콘텐츠와 같이 움직임, 1 = 화면에 고정. 기본 0.5 = 절반 속도 */
  parallaxRatio?: number
}

/**
 * 위로 스크롤할 때: 콘텐츠는 scrollTop만큼 올라가는데 이미지는 그중 ratio만큼을
 * 되돌려 놓는다 → 이미지는 (1 - ratio) 속도로 느리게 올라간다.
 * 동시에 불투명도를 1 → 0.3으로 낮춰 헤더 배경(어두운 색)이 비치게 한다.
 *   translateY = min(scrollTop, headerHeight) × ratio
 *   opacity    = 1 - 0.7 × (min(scrollTop, headerHeight) / headerHeight)
 * headerHeight를 넘긴 뒤는 헤더가 화면 밖이므로 클램프한다.
 */
export const parallaxFrame = ({ scrollTop, headerHeight, parallaxRatio = 0.5 }: ParallaxInput) => {
  if (headerHeight <= 0) return { translateY: 0, opacity: 1 }
  const scrolled = Math.min(Math.max(scrollTop, 0), headerHeight)
  const progress = scrolled / headerHeight
  return {
    translateY: scrolled * parallaxRatio,
    opacity: 1 - 0.7 * progress,
  }
}

type StretchInput = {
  /** 아래로 당긴 거리(px). 포인터 모드에서는 손가락 이동량, native 모드에서는 -scrollTop */
  pull: number
  headerHeight: number
  /** 저항이 점근하는 최대 늘어남(px). 기본 headerHeight → scale 상한 2 */
  maxPull?: number
  /**
   * true면 브라우저가 이미 바운스(고무줄)를 적용해 헤더 박스 자체가 pull만큼 내려간 상태(iOS 사파리).
   * 이때는 저항을 다시 걸지 않고 이미지를 pull만큼 올려 상단에 붙인 뒤 scale로 빈 띠를 채운다.
   */
  native?: boolean
}

/**
 * 맨 위에서 아래로 당길 때 — 위 가장자리 고정, 아래로 커진다.
 *
 * 포인터 모드(native=false, 박스는 제자리):
 *   resisted   = maxPull × (1 - 1 / (1 + pull / maxPull))   ← 고무줄 저항: 단조증가, maxPull에 점근
 *   scale      = 1 + resisted / headerHeight                 ← 아래로 resisted만큼 커진다
 *   translateY = 0                                            ← origin이 top이므로 위 가장자리는 그대로
 *
 * native 모드(박스가 이미 pull만큼 내려감):
 *   translateY = -pull                                        ← 컨테이너 상단에 다시 붙인다
 *   scale      = 1 + pull / headerHeight                      ← -pull + headerHeight × scale = headerHeight → 아래 가장자리는 박스 바닥 그대로
 */
export const stretchFrame = ({ pull, headerHeight, maxPull = headerHeight, native = false }: StretchInput) => {
  if (pull <= 0 || headerHeight <= 0) return { scale: 1, translateY: 0 }
  if (native) return { scale: 1 + pull / headerHeight, translateY: -pull }
  const resisted = maxPull * (1 - 1 / (1 + pull / maxPull))
  return { scale: 1 + resisted / headerHeight, translateY: 0 }
}
