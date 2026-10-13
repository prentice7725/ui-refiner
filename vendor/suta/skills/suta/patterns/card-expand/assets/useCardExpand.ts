import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { runCardExpand, type CardExpandNames } from './runCardExpand'
import './card-expand.css'

type ElementRef<T extends HTMLElement> = { current: T | null }

type UseCardExpandOptions = {
  /** 목록과 상세를 함께 담는 컨테이너(.card-expand-container) — 닫을 때 돌아갈 카드를 여기서 찾는다 */
  containerRef: ElementRef<HTMLElement>
  /** 상세 화면의 루트(.card-expand-detail) — 열 때의 도착점, 닫을 때의 출발점 */
  detailRef: ElementRef<HTMLElement>
  names?: CardExpandNames
}

/**
 * 카드 확장 상태 훅 — expand로 열고 collapse로 닫는다.
 *
 * 컨테이너 안의 카드에는 `data-card-id`, 상세 루트에는 detailRef를 달아 두면 된다.
 * 열림/닫힘의 DOM 교체는 flushSync로 **동기적으로** 일어난다 — View Transitions가 "바뀐 뒤" 사진을
 * 찍을 때 실제로 바뀌어 있어야 하기 때문이다. Esc로 닫는 처리와 닫힌 뒤 원래 카드로 포커스를
 * 돌려주는 처리까지 포함한다(목록을 inert로 막는 것은 화면 쪽에서 `inert={expandedId !== null}`로).
 */
export const useCardExpand = ({ containerRef, detailRef, names }: UseCardExpandOptions) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // 전환이 도는 동안 겹쳐 들어온 요청은 무시한다 — 새 전환이 시작되면 진행 중이던 것이 건너뛰어져 화면이 툭 끊긴다
  const busy = useRef(false)

  const findCard = (id: string) =>
    containerRef.current?.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(id)}"]`) ?? null

  const expand = async ({ id, card }: { id: string; card: HTMLElement | null }) => {
    if (busy.current || expandedId === id) return
    busy.current = true
    try {
      await runCardExpand({
        direction: 'open',
        from: card ?? findCard(id),
        update: () => flushSync(() => setExpandedId(id)),
        to: () => detailRef.current,
        names,
      })
    } finally {
      busy.current = false
    }
  }

  const collapse = async () => {
    if (busy.current || expandedId === null) return
    const id = expandedId
    busy.current = true
    try {
      await runCardExpand({
        direction: 'close',
        from: detailRef.current,
        update: () => flushSync(() => setExpandedId(null)),
        // 새 사진을 찍는 시점에 목록의 그 카드가 이름을 가져야 "그 자리로 돌아간다"
        to: () => findCard(id),
        names,
      })
    } finally {
      busy.current = false
      // 키보드 사용자는 눌렀던 카드로 돌아와야 한다. 스크롤은 건드리지 않는다 — 카드는 이미 보이는 자리다
      findCard(id)?.focus({ preventScroll: true })
    }
  }

  const collapseRef = useRef(collapse)
  collapseRef.current = collapse

  useEffect(
    function closeOnEscape() {
      if (expandedId === null) return
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') void collapseRef.current()
      }
      window.addEventListener('keydown', handleKeydown)
      return () => window.removeEventListener('keydown', handleKeydown)
    },
    [expandedId],
  )

  return { expandedId, expand, collapse }
}
