/**
 * 프레임워크 무관 스티키 헤더 상태 전환 코어 (의존성 0).
 *
 * 큰 제목(센티널)이 스크롤에 밀려 뷰포트를 벗어나는 순간을 IntersectionObserver로
 * 감지해 헤더의 data-collapsed를 전환한다. scroll 이벤트를 쓰지 않아 비용이 없고,
 * 높이를 애니메이션하지 않으므로(컴팩트 헤더는 고정 높이) 레이아웃 회귀도 없다.
 * 애니메이션 정의는 전적으로 CSS 몫(sticky-header.css).
 */

type ObserveHeaderCollapseOptions = {
  /** 고정 높이의 컴팩트 헤더 — data-collapsed가 여기에 걸린다 */
  header: HTMLElement
  /** 스크롤에 밀려 나가는 기준 요소(보통 큰 제목 블록) */
  sentinel: HTMLElement
  onChange?: (collapsed: boolean) => void
}

export const observeHeaderCollapse = ({ header, sentinel, onChange }: ObserveHeaderCollapseOptions) => {
  const apply = (collapsed: boolean) => {
    header.dataset.collapsed = collapsed ? 'true' : 'false'
    onChange?.(collapsed)
  }

  if (typeof IntersectionObserver === 'undefined') {
    // 폴백: 항상 펼침 — 컴팩트 제목이 안 뜰 뿐 콘텐츠는 멀쩡하다
    header.dataset.collapsed = 'false'
    return () => {}
  }

  header.dataset.collapsed = 'false'

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      apply(!entry.isIntersecting)
    }
  })
  observer.observe(sentinel)
  return () => observer.disconnect()
}
