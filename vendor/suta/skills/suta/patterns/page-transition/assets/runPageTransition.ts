/**
 * 프레임워크 무관 화면 전환 코어 (의존성 0).
 *
 * View Transitions API(document.startViewTransition)에 방향만 얹은 얇은 층이다.
 * 이 API는 "DOM을 바꾸기 직전 화면을 사진으로 찍고, 바꾼 뒤 새 화면과 교차 애니메이션"을
 * 브라우저가 대신 해 준다 — 두 화면을 동시에 렌더링하려고 이전 화면을 복제해 두는
 * 재주를 부릴 필요가 없다.
 *
 * 코어가 하는 일은 두 가지뿐이다:
 *  1. <html>에 data-nav-direction(forward|back)을 붙인다 — CSS가 이 값으로 밀려나는 방향을 정한다
 *  2. 지원하지 않는 브라우저에서는 그냥 화면을 바꾼다 (전환만 없고 기능은 그대로)
 *
 * 애니메이션 정의는 전적으로 CSS 몫이다(page-transition.css).
 */

export type NavDirection = 'forward' | 'back'

type ViewTransition = { finished: Promise<void> }
type StartViewTransition = (callback: () => void | Promise<void>) => ViewTransition

type RunPageTransitionOptions = {
  /** forward = 더 깊이 들어간다(오른쪽에서 들어옴), back = 돌아 나온다(왼쪽에서 들어옴) */
  direction: NavDirection
  /**
   * 화면을 실제로 바꾸는 함수. 이 안에서 DOM이 **동기적으로** 바뀌어야 한다 —
   * React라면 flushSync로 감싼다(그냥 setState하면 콜백이 끝난 뒤에 바뀌어 사진이 어긋난다).
   */
  update: () => void
  /** data-nav-direction을 붙일 요소 (기본 <html>) */
  root?: HTMLElement
}

export const runPageTransition = async ({ direction, update, root }: RunPageTransitionOptions): Promise<void> => {
  const host = root ?? document.documentElement
  const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition

  host.dataset.navDirection = direction

  if (typeof start !== 'function') {
    // 미지원 브라우저(구형 사파리·파이어폭스 일부): 전환 없이 즉시 바뀐다. 화면은 멀쩡하다
    try {
      update()
    } finally {
      delete host.dataset.navDirection
    }
    return
  }

  try {
    await start.call(document, update).finished
  } finally {
    delete host.dataset.navDirection
  }
}
