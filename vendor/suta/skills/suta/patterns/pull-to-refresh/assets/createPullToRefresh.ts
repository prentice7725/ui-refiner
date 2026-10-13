/**
 * 프레임워크 무관 당겨서 새로고침 코어 (의존성 0).
 *
 * 스크롤 최상단에서 아래로 당기면 콘텐츠가 저항(고무줄)과 함께 따라 내려오고,
 * 임계를 넘겨 놓으면 onRefresh를 부른다. 스냅백·복귀 이동은 CSS transition이
 * 담당한다(드래그 중에만 transition을 끈다 — bottom-sheet와 같은 분업).
 *
 * 진행률은 컨테이너의 --pull-progress(0~1)와 data-refreshing으로 노출된다 —
 * 인디케이터(스피너·화살표)는 CSS가 그린다(pull-to-refresh.css).
 */

type CreatePullToRefreshOptions = {
  /** 스크롤 컨테이너 — scrollTop 0에서만 당김이 시작된다 */
  container: HTMLElement
  /** 당김에 따라 내려올 콘텐츠 요소 */
  content: HTMLElement
  /** 임계를 넘겨 놓았을 때 — 작업이 끝나면 반드시 done()을 호출한다 */
  onRefresh: (done: () => void) => void
  /** 새로고침 판정 당김 거리 (기본 70px) */
  thresholdPx?: number
  /** 최대 당김 거리 (기본 threshold의 2배) */
  maxPx?: number
}

export const createPullToRefresh = ({
  container,
  content,
  onRefresh,
  thresholdPx = 70,
  maxPx = thresholdPx * 2,
}: CreatePullToRefreshOptions) => {
  let startY = 0
  let pulling = false
  let refreshing = false
  let pulled = 0

  const setProgress = (value: number) => {
    container.style.setProperty('--pull-progress', String(Math.min(value / thresholdPx, 1)))
  }

  // 고무줄 저항 — 당길수록 무거워지고 maxPx에 점근한다
  const resist = (raw: number) => maxPx * (1 - Math.exp(-raw / maxPx))

  const onPointerDown = (event: PointerEvent | MouseEvent) => {
    if (refreshing || container.scrollTop > 0) return
    if ('button' in event && event.button !== 0) return
    pulling = true
    pulled = 0
    startY = event.clientY
    content.style.transition = 'none'
  }

  const onPointerMove = (event: PointerEvent | MouseEvent) => {
    if (!pulling || refreshing) return
    const raw = event.clientY - startY
    if (raw <= 0) {
      pulled = 0
      content.style.transform = ''
      setProgress(0)
      return
    }
    pulled = resist(raw)
    content.style.transform = `translateY(${pulled}px)`
    setProgress(pulled)
  }

  const finishRefresh = () => {
    refreshing = false
    container.dataset.refreshing = 'false'
    content.style.transform = ''
    setProgress(0)
  }

  const onPointerUp = () => {
    if (!pulling) return
    pulling = false
    content.style.transition = '' // 이후 이동은 CSS transition 몫
    if (pulled >= thresholdPx) {
      refreshing = true
      container.dataset.refreshing = 'true'
      content.style.transform = `translateY(${thresholdPx}px)` // 스피너 자리만큼 걸쳐 둔다
      onRefresh(finishRefresh)
      return
    }
    content.style.transform = ''
    setProgress(0)
  }

  container.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  return () => {
    container.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }
}
