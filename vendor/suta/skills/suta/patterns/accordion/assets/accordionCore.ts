/**
 * 아코디언 열림 목록의 순수 판정 (의존성 0, DOM 무관).
 *
 * "이 항목을 누르면 열림 목록이 어떻게 되는가"만 답한다.
 * single 모드는 목록을 통째로 갈아치우고(하나만 열림), multiple은 넣고 뺀다.
 */

type ToggleOpenOptions = {
  /** 현재 열려 있는 항목 id 목록 */
  openIds: string[]
  /** 눌린 항목 id */
  id: string
  /** true면 한 번에 하나만 열림 (기본 false) */
  single?: boolean
}

export const toggleOpen = ({ openIds, id, single = false }: ToggleOpenOptions): string[] => {
  const isOpen = openIds.includes(id)
  if (single) return isOpen ? [] : [id]
  return isOpen ? openIds.filter((openId) => openId !== id) : [...openIds, id]
}
