import { useEffect, useRef, type RefObject } from 'react'
import { createSwipeDismiss } from './createSwipeDismiss'
import './swipe-dismiss-viewer.css'

type SwipeDismissViewerProps = {
  src: string
  alt: string
  /** 열 때 출발하고 닫을 때 돌아갈 썸네일 */
  returnTo?: RefObject<HTMLElement | null>
  /** 복귀 애니메이션이 끝난 뒤 — 여기서 뷰어를 언마운트한다 */
  onClose: () => void
  /** 닫기 버튼의 이름 — 기본 '닫기' */
  closeLabel?: string
  className?: string
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * createSwipeDismiss의 React 래퍼 — 마운트되면 썸네일에서 열리고, 끌어내리거나 Esc·닫기 버튼으로 닫힌다.
 * open 상태는 부모가 소유한다: 열려면 마운트, onClose가 오면 언마운트.
 */
export const SwipeDismissViewer = ({ src, alt, returnTo, onClose, closeLabel = '닫기', className }: SwipeDismissViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const controllerRef = useRef<ReturnType<typeof createSwipeDismiss> | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(
    function bindViewer() {
      const viewer = viewerRef.current
      const image = imageRef.current
      if (!viewer || !image) return
      const controller = createSwipeDismiss({
        viewer,
        image,
        returnTo: () => returnTo?.current ?? null,
        onDismiss: () => onCloseRef.current(),
        spring: prefersReducedMotion() ? { stiffness: 600, damping: 50 } : undefined,
      })
      controllerRef.current = controller
      controller.open()

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') controller.close()
      }
      window.addEventListener('keydown', onKeydown)
      return () => {
        window.removeEventListener('keydown', onKeydown)
        controller.destroy()
      }
    },
    // returnTo는 ref 객체라 안정적이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div ref={viewerRef} className={className ? `viewer ${className}` : 'viewer'} role="dialog" aria-modal="true" aria-label={alt}>
      <div className="viewer-backdrop" />
      <img ref={imageRef} src={src} alt={alt} className="viewer-image" draggable={false} />
      <button type="button" className="viewer-chrome viewer-close" aria-label={closeLabel} onClick={() => controllerRef.current?.close()}>
        ✕
      </button>
    </div>
  )
}
