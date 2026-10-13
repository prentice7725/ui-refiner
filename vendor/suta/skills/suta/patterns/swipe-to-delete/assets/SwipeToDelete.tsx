import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createSwipeDelete } from './createSwipeDelete'
import './swipe-to-delete.css'

export type SwipeActionTone = 'default' | 'danger' | 'accent'

export type SwipeAction = {
  /** 버튼 문구·접근성 이름 */
  label: string
  /** 눌렀을 때 — 마지막 액션은 접힘 애니메이션이 끝난 뒤, 나머지는 즉시 불린다 */
  onClick: () => void
  /** 배경색 계열 (기본 'default' — CSS 변수 --swipe-action-default-bg / -accent-bg / --swipe-action-bg) */
  tone?: SwipeActionTone
}

type SwipeToDeleteProps = {
  children: ReactNode
  /** 접힘 애니메이션이 끝난 뒤 호출 — 여기서 목록에서 항목을 제거한다. actions를 쓰면 생략 가능(마지막 액션의 onClick이 같은 시점에 불린다) */
  onDelete?: () => void
  /** 액션 버튼 문구·접근성 이름 (기본 '삭제') — actions가 있으면 무시된다 */
  actionLabel?: string
  /** 액션 버튼 하나의 폭(px, 기본 88) — CSS 변수 --swipe-action-width와 함께 바뀐다. 열림 폭은 이 값 × 액션 수 */
  actionWidth?: number
  /**
   * 여러 액션(iOS 메일의 "보관 / 플래그 / 삭제") — 왼쪽부터 순서대로 놓인다.
   * 마지막(가장 오른쪽) 액션이 기본 액션이다: 끝까지 밀거나 버튼을 누르면 행이 빠지고 접힌 뒤 onClick이 불린다.
   * 없으면 actionLabel 하나짜리 삭제 버튼(기존 동작)이다.
   */
  actions?: SwipeAction[]
  /** 끝까지 밀어 삭제 임계 거리(px) — 기본은 단일 액션이면 폭×2.5, 여러 액션이면 열림 폭 + 폭×0.75. Infinity면 끝까지 밀기 비활성 */
  swipeOutThresholdPx?: number
  className?: string
}

/** 접힘 transitionend가 오지 않는 환경(jsdom·transition 미지원)을 위한 상한 */
const COLLAPSE_FALLBACK_MS = 600

/**
 * 스와이프 삭제 행 — 제스처 판정은 createSwipeDelete가, 정착·접힘 모션은 CSS가 담당한다.
 * 삭제는 두 단계다: 내용이 왼쪽으로 빠진 뒤 행 높이를 측정값→0으로 접고, 끝나면 onDelete를 부른다.
 * 삭제 버튼은 항상 DOM에 있어 Tab으로 닿을 수 있다 — 포커스되면 행을 열어 버튼을 보여준다.
 * 여러 액션을 주면 버튼이 나란히 놓이고 코어에는 "열림 정착 거리"(폭 × 개수)만 넘긴다 — 코어는 액션 개수를 모른다.
 */
export const SwipeToDelete = ({
  children,
  onDelete,
  actionLabel = '삭제',
  actionWidth = 88,
  actions,
  swipeOutThresholdPx,
  className,
}: SwipeToDeleteProps) => {
  const itemRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<ReturnType<typeof createSwipeDelete> | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // actions가 없으면 기존 단일 삭제 버튼 — 렌더·열림 폭·임계값 모두 이전과 같다
  const hasActions = Boolean(actions && actions.length > 0)
  const resolvedActions: SwipeAction[] = hasActions
    ? actions!
    : [{ label: actionLabel, onClick: () => {}, tone: 'danger' }]
  const lastIndex = resolvedActions.length - 1
  const openWidth = actionWidth * resolvedActions.length
  // 여러 액션일 때 폭×2.5를 그대로 쓰면 3개 기준 660px — 폰 화면보다 넓어 거리로는 닿을 수 없다.
  // 열림 폭에서 버튼 하나의 3/4만 더 밀면 삭제로 판정한다(단일 액션은 기존 2.5배 유지)
  const resolvedThreshold = swipeOutThresholdPx ?? (hasActions ? openWidth + actionWidth * 0.75 : actionWidth * 2.5)

  // 접힘이 끝난 뒤 부를 것 — 마지막 액션의 onClick과 onDelete. 렌더마다 갱신해 최신 콜백을 읽는다
  const finishRef = useRef<() => void>(() => {})
  finishRef.current = () => {
    if (hasActions) resolvedActions[lastIndex].onClick()
    onDelete?.()
  }

  const collapse = () => {
    const item = itemRef.current
    if (!item) return
    // 접힘은 CSS가 grid-template-rows 1fr→0fr로 전이한다 — 높이를 재서 인라인으로 줄 필요가 없다
    setDeleting(true)

    let done = false
    const finish = () => {
      if (done) return
      done = true
      finishRef.current()
    }
    item.addEventListener('transitionend', (event) => {
      if (event.propertyName === 'grid-template-rows') finish()
    })
    window.setTimeout(finish, COLLAPSE_FALLBACK_MS)
  }

  useEffect(
    function bindGesture() {
      const content = contentRef.current
      if (!content) return
      const controller = createSwipeDelete({
        content,
        actionWidth: openWidth,
        swipeOutThresholdPx: resolvedThreshold,
        onOpenChange: setOpen,
        onSwipeOut: collapse,
      })
      controllerRef.current = controller
      return controller.destroy
    },
    // collapse는 ref만 읽는 안정 함수라 의존성에 넣지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openWidth, resolvedThreshold],
  )

  const handleAction = (index: number) => {
    if (index === lastIndex) {
      // 마지막 액션 = 끝까지 밀기와 같은 경로 — 행이 빠지고 접힌 뒤 onClick이 불린다
      controllerRef.current?.swipeOut()
      return
    }
    resolvedActions[index].onClick()
    controllerRef.current?.close()
  }

  return (
    <div
      ref={itemRef}
      className={className ? `swipe-item ${className}` : 'swipe-item'}
      data-open={open ? 'true' : 'false'}
      data-state={deleting ? 'deleting' : 'idle'}
      style={{ '--swipe-action-width': `${actionWidth}px` } as CSSProperties}
    >
      <div ref={contentRef} className="swipe-content">
        {children}
        {/* 액션은 내용의 오른쪽 바깥에 붙어 함께 미끄러진다 — DOM에 항상 있어 Tab으로 닿는다.
            영역의 data-tone은 마지막 액션 색 — 끝까지 밀렸을 때 남는 여백을 그 색으로 채운다 */}
        <div className="swipe-actions" data-tone={resolvedActions[lastIndex].tone ?? 'default'}>
          {resolvedActions.map((action, index) => (
            <button
              key={`${index}-${action.label}`}
              type="button"
              className="swipe-action"
              data-tone={action.tone ?? 'default'}
              onClick={() => handleAction(index)}
              onFocus={() => controllerRef.current?.open()}
              onBlur={() => {
                if (!deleting) controllerRef.current?.close()
              }}
              tabIndex={deleting ? -1 : 0}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
