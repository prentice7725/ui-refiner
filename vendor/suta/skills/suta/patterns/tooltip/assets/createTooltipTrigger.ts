/**
 * 프레임워크 무관 툴팁 트리거 코어 (의존성 0).
 *
 * 앵커에 이벤트를 걸어 툴팁의 data-open만 토글한다 — 뜨고 지는 모션은 tooltip.css 담당.
 * 규칙은 툴팁 관례 그대로: 호버는 지연 후 열림(스치는 커서에 반응하지 않게),
 * 키보드 포커스는 즉시 열림(기다릴 이유가 없다), Escape는 언제든 닫는다(WAI-ARIA 요구).
 *
 * 바닐라 사용: createTooltipTrigger({ anchor, tooltip }) — 반환값이 해제 함수.
 * React 사용: Tooltip.tsx가 이 코어를 감싼다.
 */

type CreateTooltipTriggerOptions = {
  /** 이벤트를 받을 앵커 — 버튼·아이콘, 또는 그것을 감싼 래퍼(focusin/focusout은 버블링된다) */
  anchor: HTMLElement
  /** data-open을 받을 툴팁 요소 (tooltip.css의 .tooltip) */
  tooltip: HTMLElement
  /** 호버 열림 지연 (기본 400ms) — 포커스 열림에는 적용되지 않는다 */
  showDelayMs?: number
}

export const createTooltipTrigger = ({ anchor, tooltip, showDelayMs = 400 }: CreateTooltipTriggerOptions) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  tooltip.dataset.open = 'false'

  const open = () => {
    tooltip.dataset.open = 'true'
  }
  const close = () => {
    clearTimeout(timer)
    timer = undefined
    tooltip.dataset.open = 'false'
  }
  const openAfterDelay = () => {
    clearTimeout(timer)
    timer = setTimeout(open, showDelayMs)
  }
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close()
  }

  anchor.addEventListener('mouseenter', openAfterDelay)
  anchor.addEventListener('mouseleave', close)
  anchor.addEventListener('focusin', open)
  anchor.addEventListener('focusout', close)
  window.addEventListener('keydown', closeOnEscape)

  return () => {
    clearTimeout(timer)
    anchor.removeEventListener('mouseenter', openAfterDelay)
    anchor.removeEventListener('mouseleave', close)
    anchor.removeEventListener('focusin', open)
    anchor.removeEventListener('focusout', close)
    window.removeEventListener('keydown', closeOnEscape)
  }
}
