import { useEffect, useRef, useState } from 'react'
import { createDragReorder } from './createDragReorder'
import './drag-to-reorder.css'

type ReorderDetail = { id: string; from: number; to: number; total: number }

type UseDragReorderOptions = {
  /** 순서가 확정됐을 때 — 여기서 배열을 실제로 옮긴다 */
  onReorder: (detail: ReorderDetail) => void
  /** 손잡이 없이 항목 전체를 끌 때 눌러야 하는 시간 (ms). 0(기본)이면 손잡이로만 끈다 */
  longPressMs?: number
  liftScale?: number
  settleMs?: number
  /** 안내 문구에 쓸 항목 이름 — 없으면 번호만 읽힌다 */
  describe?: (id: string) => string
  /** 화면 낭독 문구 — 이동 알림과 손잡이 이름. 기본은 한국어. to는 1부터 센다 */
  messages?: ReorderMessages
}

type ReorderMessages = {
  moved: ({ name, to, total }: { name?: string; to: number; total: number }) => string
  handle: (label: string) => string
}

const DEFAULT_MESSAGES: ReorderMessages = {
  moved: ({ name, to, total }) => `${name ? `${name} — ` : ''}${total}개 중 ${to}번째로 이동`,
  handle: (label) => `${label} 순서 바꾸기 — 위아래 방향키로 이동`,
}

/**
 * createDragReorder 코어의 React 래퍼.
 *
 * containerRef를 목록에 달고, 각 항목에 고유한 data-reorder-id를,
 * 손잡이 버튼에 getHandleProps()를 펼쳐 준다. announcement는 role="status" 영역에 넣는다 —
 * 키보드로 순서를 바꾸는 사람에게는 그것이 유일한 피드백이다.
 */
export const useDragReorder = <T extends HTMLElement = HTMLElement>({
  onReorder,
  longPressMs,
  liftScale,
  settleMs,
  describe,
  messages = DEFAULT_MESSAGES,
}: UseDragReorderOptions) => {
  const containerRef = useRef<T | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder
  const describeRef = useRef(describe)
  describeRef.current = describe
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(
    function bindReorder() {
      const container = containerRef.current
      if (!container) return
      const controller = createDragReorder({
        container,
        longPressMs,
        liftScale,
        settleMs,
        onDragChange: setDraggingId,
        onReorder: (detail) => {
          onReorderRef.current(detail)
          const name = describeRef.current?.(detail.id)
          setAnnouncement(messagesRef.current.moved({ name, to: detail.to + 1, total: detail.total }))
        },
      })
      return controller.destroy
    },
    [longPressMs, liftScale, settleMs],
  )

  return {
    containerRef,
    draggingId,
    announcement,
    /** 손잡이 버튼에 펼친다 — label은 어느 항목의 손잡이인지 읽어 주기 위한 것 */
    getHandleProps: ({ label }: { label: string }) => ({
      type: 'button' as const,
      'data-reorder-handle': '',
      'aria-label': messages.handle(label),
    }),
  }
}
