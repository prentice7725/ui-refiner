/**
 * 프레임워크 무관 확대 전환(공유 요소) 코어 (의존성 0).
 *
 * 썸네일의 복제(고스트)를 제자리에 띄운 뒤 화면 중앙 확대 크기로 transform 전환한다 —
 * 사용자에게는 "그 썸네일이 커진 것"으로 보인다(공유 요소 전환의 최소형).
 * 닫으면 역방향으로 제자리에 돌아가 정리된다. transform·opacity만 사용(GPU).
 */

type OpenZoomOptions = {
  /** 확대할 요소 (보통 이미지·카드) — 복제되어 고스트가 된다 */
  source: HTMLElement
  durationMs?: number
  /** 화면 대비 최대 비율 (기본 0.9) */
  maxViewportRatio?: number
  onClose?: () => void
}

/** 열고 나서 돌려받는 함수를 호출하면 닫힌다 (백드롭 클릭·Esc로도 닫힘) */
export const openZoom = ({ source, durationMs = 350, maxViewportRatio = 0.9, onClose }: OpenZoomOptions) => {
  const from = source.getBoundingClientRect()

  const backdrop = document.createElement('div')
  backdrop.className = 'zoom-backdrop'
  backdrop.dataset.open = 'false'

  const ghost = source.cloneNode(true) as HTMLElement
  ghost.classList.add('zoom-ghost')
  ghost.style.cssText += `;position: fixed; left: ${from.left}px; top: ${from.top}px; width: ${from.width}px; height: ${from.height}px; margin: 0; transform-origin: top left; transition: transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1); z-index: 91;`

  document.body.append(backdrop, ghost)
  const previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  // 중앙 확대 목표: 비율 유지 최대 확대(뷰포트의 maxViewportRatio 이내)
  const scale = Math.min(
    (window.innerWidth * maxViewportRatio) / from.width,
    (window.innerHeight * maxViewportRatio) / from.height,
  )
  const targetLeft = (window.innerWidth - from.width * scale) / 2
  const targetTop = (window.innerHeight - from.height * scale) / 2
  const dx = targetLeft - from.left
  const dy = targetTop - from.top

  let closing = false
  let opened = false

  const cleanup = () => {
    backdrop.remove()
    ghost.remove()
    document.body.style.overflow = previousOverflow
    window.removeEventListener('keydown', onKeydown)
    onClose?.()
  }

  const close = () => {
    if (closing) return
    closing = true
    backdrop.dataset.open = 'false'
    ghost.style.transform = '' // 제자리로 — 역방향 전환
    let done = false
    const finish = () => {
      if (done) return
      done = true
      cleanup()
    }
    ghost.addEventListener('transitionend', finish, { once: true })
    setTimeout(finish, durationMs + 200) // transitionend 유실 폴백
    // 아직 열리는 중이었다면 전환이 즉시 끝날 수 있다 — 폴백이 정리를 보장한다
    if (!opened) requestAnimationFrame(finish)
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close()
  }

  backdrop.addEventListener('click', close)
  window.addEventListener('keydown', onKeydown)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (closing) return
      opened = true
      backdrop.dataset.open = 'true'
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
    })
  })

  return close
}
