import { useEffect, useId, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { burstPieces, prefersReducedMotion } from './createCelebration'
import './celebration.css'

type CelebrationProps = {
  open: boolean
  onClose: () => void
  /** 한 줄 제목 — 대화상자의 이름으로 읽힌다("오늘 목표 달성!") */
  title: string
  /** 큰 보상 글자("+100P") — 설명과 함께 읽힌다 */
  reward?: ReactNode
  /** 한 줄 설명("8,000걸음을 걸었어요") */
  description?: ReactNode
  /** 보상 그림 — 메달·트로피 아이콘이나 그림. 장식이라 낭독하지 않는다(제목이 뜻을 전한다) */
  figure?: ReactNode
  /** 버튼은 하나다. 기본 "확인" */
  actionLabel?: string
  /** 버튼을 눌렀을 때 — 없으면 onClose */
  onAction?: () => void
  /** 한 번 터지는 조각 수(기본 14). 0이면 조각 없이 */
  pieces?: number
  /** 조각 궤적의 seed — 같은 값이면 같은 모양 */
  seed?: number
  className?: string
}

/** 닫힘 애니메이션이 끝나지 않는 환경(animation 미지원·jsdom)을 위한 상한 */
const CLOSE_FALLBACK_MS = 400

/**
 * 축하 오버레이 — 지금 화면 위에 어둡게 깔고 큰 보상 그림 하나·한 줄 제목·보상·버튼 하나를 띄운다.
 * 네이티브 <dialog>.showModal()이라 포커스 가두기·뒤 화면 잠금·Esc는 브라우저가 맡는다.
 * 조각은 열릴 때 한 번 위로 퍼져 그림 둘레에 남고(무한 반복 없음), 동작 줄이기면 날지 않고 제자리에 놓인다.
 * 이룬 순간(목표 달성·레벨 업·배지·하루 한 번 출석)에만 쓴다. 자주 생기는 작은 적립은 토스트 한 줄로 알린다.
 * open 상태는 부모가 소유한다 — Esc·바깥 누름은 onClose를 부를 뿐 스스로 닫지 않는다.
 */
export const Celebration = ({
  open,
  onClose,
  title,
  reward,
  description,
  figure,
  actionLabel = '확인',
  onAction,
  pieces = 14,
  seed = 1,
  className,
}: CelebrationProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const actionRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const titleId = useId()
  const textId = useId()
  const hasText = reward !== undefined || description !== undefined

  useEffect(
    function syncOpenState() {
      const dialog = dialogRef.current
      if (!dialog) return
      if (open) {
        dialog.removeAttribute('data-closing')
        if (!dialog.open) dialog.showModal()
        // 버튼이 하나뿐이라 바로 그 버튼에 — Enter 한 번으로 이어 간다
        actionRef.current?.focus()
        return
      }
      if (!dialog.open) return
      let done = false
      const finish = () => {
        if (done) return
        done = true
        dialog.removeAttribute('data-closing')
        dialog.close()
      }
      dialog.setAttribute('data-closing', '')
      dialog.addEventListener('animationend', finish, { once: true })
      const timer = window.setTimeout(finish, CLOSE_FALLBACK_MS)
      return () => {
        dialog.removeEventListener('animationend', finish)
        window.clearTimeout(timer)
        if (!done) dialog.removeAttribute('data-closing')
      }
    },
    [open],
  )

  useEffect(function routeEscapeToParent() {
    const dialog = dialogRef.current
    if (!dialog) return
    // Esc — 브라우저가 바로 close()하려는 것을 막고 부모에게 닫기를 요청한다(닫힘 애니메이션 경유)
    const handleCancel = (event: Event) => {
      event.preventDefault()
      onCloseRef.current()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [])

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    // 패널 안쪽 클릭은 자식 요소가 target이고, ::backdrop 클릭만 dialog 자신이 target이다
    if (event.target === event.currentTarget) onCloseRef.current()
  }

  // 열려 있는 동안만 그린다 — 다시 열면 새로 붙어 한 번 더 터진다. 동작 줄이기면 날지 않고 그림 둘레 제자리에 놓인다
  const burst = open ? burstPieces({ count: pieces, seed }) : []
  const motion = prefersReducedMotion() ? 'still' : 'burst'

  return (
    <dialog
      ref={dialogRef}
      className={className ? `celebration ${className}` : 'celebration'}
      aria-labelledby={titleId}
      aria-describedby={hasText ? textId : undefined}
      onClick={handleBackdropClick}
    >
      <div className="celebration-stage">
        {burst.length > 0 && (
          <div className="celebration-burst" aria-hidden="true" data-motion={motion}>
            {burst.map((piece, index) => (
              <span
                key={index}
                className={`celebration-piece celebration-piece--${piece.shape}`}
                data-tone={piece.tone}
                style={{ '--x': `${piece.x}px`, '--y': `${piece.y}px`, '--r': `${piece.rotate}deg`, '--delay': `${piece.delayMs}ms` } as CSSProperties}
              />
            ))}
          </div>
        )}
        {figure && (
          <div className="celebration-figure" aria-hidden="true">
            {figure}
          </div>
        )}
      </div>
      <h2 id={titleId} className="celebration-title">
        {title}
      </h2>
      {hasText && (
        <div id={textId} className="celebration-text">
          {reward !== undefined && <p className="celebration-reward">{reward}</p>}
          {description !== undefined && <p className="celebration-description">{description}</p>}
        </div>
      )}
      <button ref={actionRef} type="button" className="celebration-action" onClick={() => (onAction ?? onCloseRef.current)()}>
        {actionLabel}
      </button>
    </dialog>
  )
}
