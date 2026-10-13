import { useEffect, useRef, useState } from 'react'
import { createInfiniteScroll, type InfiniteScrollStatus } from './createInfiniteScroll'

type UseInfiniteScrollOptions = {
  /** 더 불러올 것이 남았는지 */
  hasMore: boolean
  /** 다음 페이지를 불러와 상태에 붙인다 */
  loadMore: () => Promise<void> | void
  rootMarginPx?: number
  /** 스크롤 컨테이너 ref — 없으면 뷰포트 기준 */
  rootRef?: { current: Element | null }
}

/**
 * createInfiniteScroll 코어의 React 래퍼.
 * sentinelRef를 목록 끝의 빈 요소에 달면, 그 요소가 화면에 다가올 때 loadMore가 불린다.
 *
 * hasMore·loadMore는 ref로 최신값을 읽는다 — 페이지를 붙일 때마다 관찰을 새로 걸면
 * 다시 로드가 걸려 무한 루프가 되기 때문이다(관찰은 마운트 때 한 번만 건다).
 */
export const useInfiniteScroll = ({ hasMore, loadMore, rootMarginPx, rootRef }: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const controllerRef = useRef<ReturnType<typeof createInfiniteScroll> | null>(null)
  const [status, setStatus] = useState<InfiniteScrollStatus>('idle')

  const hasMoreRef = useRef(hasMore)
  hasMoreRef.current = hasMore
  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore

  useEffect(
    function observeSentinel() {
      const sentinel = sentinelRef.current
      if (!sentinel) return
      const controller = createInfiniteScroll({
        sentinel,
        root: rootRef?.current ?? null,
        rootMarginPx,
        hasMore: () => hasMoreRef.current,
        loadMore: () => loadMoreRef.current(),
        onStatusChange: setStatus,
      })
      controllerRef.current = controller
      return () => {
        controller.destroy()
        controllerRef.current = null
      }
    },
    [rootMarginPx, rootRef],
  )

  return {
    sentinelRef,
    status,
    isLoading: status === 'loading',
    /** 실패 후 재시도 버튼에 연결한다 */
    retry: () => controllerRef.current?.retry(),
    /** "더 보기" 버튼에 연결한다 — 자동 로딩이 막힌 환경의 대비책 */
    loadNow: () => controllerRef.current?.loadNow(),
  }
}
