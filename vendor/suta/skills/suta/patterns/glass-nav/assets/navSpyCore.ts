/**
 * glass-nav 섹션 추적(scroll spy) 순수 계산 (의존성 0, DOM 없음).
 *
 * GNB 링크 하나가 화면의 섹션 하나를 가리킬 때:
 *  - 스크롤 위치로 "지금 어느 섹션인가"를 정한다 → 활성 링크·알약 위치·compact의 현재 메뉴 텍스트
 *  - 링크를 누르면 그 섹션의 시작이 GNB 바로 아래에 오도록 스크롤 목표를 계산한다
 *
 * 활성 판정 규칙: 섹션 시작점(top)에서 GNB 높이와 여유(offset)를 뺀 값이 scrollTop 이하인 마지막 섹션.
 * 맨 아래에 닿았는데 마지막 섹션이 짧아 시작점이 못 넘어오는 경우를 위해, 스크롤이 끝(maxScroll)에 닿으면 마지막 섹션을 활성으로 본다.
 */

export type SectionOffset = { id: string; top: number }

export const activeSectionFor = ({
  scrollTop,
  sections,
  navHeight,
  offsetPx = 8,
  maxScrollTop,
}: {
  scrollTop: number
  /** 컨테이너 기준 섹션 시작 위치. 위에서 아래 순서 */
  sections: SectionOffset[]
  navHeight: number
  offsetPx?: number
  /** 컨테이너의 최대 scrollTop(scrollHeight − clientHeight). 끝에 닿으면 마지막 섹션 */
  maxScrollTop?: number
}): string | null => {
  if (sections.length === 0) return null
  if (maxScrollTop != null && scrollTop >= maxScrollTop - 1) return sections[sections.length - 1].id
  let active: string | null = sections[0].id
  for (const section of sections) {
    if (section.top - navHeight - offsetPx <= scrollTop) active = section.id
    else break
  }
  return active
}

/** 링크를 눌렀을 때 스크롤 목표 — 섹션 시작이 GNB 바로 아래(여유 offset)에 오게. 0 아래로는 내려가지 않는다.
 * 올림(ceil)인 이유: 내림하면 도착 위치가 섹션 시작보다 1px 위라 활성 판정이 이전 섹션으로 떨어진다 */
export const scrollTargetFor = ({ sectionTop, navHeight, offsetPx = 8 }: { sectionTop: number; navHeight: number; offsetPx?: number }) =>
  Math.max(0, Math.ceil(sectionTop - navHeight - offsetPx))

/** 알약(활성 표시)을 활성 링크 위치로 — translateX + width. 링크는 흐름 안에 있고 알약은 absolute라 자기만 레이아웃한다 */
export const pillFrame = ({ offsetLeft, offsetWidth }: { offsetLeft: number; offsetWidth: number }) => ({
  transform: `translateX(${offsetLeft}px)`,
  width: `${offsetWidth}px`,
})
