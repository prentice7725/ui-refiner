/**
 * 프레임워크 무관 무한 스크롤 코어 (의존성 0).
 *
 * 목록 끝에 놓인 감시 요소(sentinel)가 화면에 다가오면 다음 페이지를 부른다.
 * 스크롤 이벤트를 듣지 않는다 — IntersectionObserver는 스크롤마다 깨어나지 않고
 * "보이기 시작함"만 알려주므로 위치 계산도, 스로틀도 필요 없다.
 *
 * 이 코어가 실제로 막아 주는 것들:
 *  - 중복 호출: 로딩 중에는 다시 부르지 않는다(같은 페이지를 두 번 붙이는 사고)
 *  - 연쇄 로딩: 한 페이지를 붙여도 sentinel이 여전히 보이면 다음 페이지를 이어서 부른다
 *    (IntersectionObserver는 "계속 보이는 중"을 다시 알려주지 않기 때문에 관찰을 새로 건다)
 *  - 실패 폭주: 실패하면 멈춘다. 자동 재시도는 하지 않고 retry()를 기다린다
 */

export type InfiniteScrollStatus = 'idle' | 'loading' | 'error' | 'done'

type CreateInfiniteScrollOptions = {
  /** 목록 끝에 두는 빈 감시 요소 — 마지막 항목이 아니라 별도 요소여야 한다 */
  sentinel: HTMLElement
  /** 더 불러올 것이 남았는지 — 매 로드 전후로 다시 묻는다 */
  hasMore: () => boolean
  /** 다음 페이지를 불러와 목록에 붙인다. 예외를 던지면 error 상태가 된다 */
  loadMore: () => Promise<void> | void
  /** 화면 밖 이만큼 미리 부른다 (px, 기본 400) — 사용자가 로딩을 거의 보지 않게 */
  rootMarginPx?: number
  /** 스크롤 컨테이너. 기본은 뷰포트(null) */
  root?: Element | null
  onStatusChange?: (status: InfiniteScrollStatus) => void
  /** 실패 원인 — 문구로 보여주고 싶을 때 */
  onError?: (error: unknown) => void
}

export const createInfiniteScroll = ({
  sentinel,
  hasMore,
  loadMore,
  rootMarginPx = 400,
  root = null,
  onStatusChange,
  onError,
}: CreateInfiniteScrollOptions) => {
  let status: InfiniteScrollStatus = 'idle'
  let destroyed = false
  let observer: IntersectionObserver | null = null

  const setStatus = (next: InfiniteScrollStatus) => {
    if (destroyed || next === status) return
    status = next
    onStatusChange?.(next)
  }

  const stopObserving = () => {
    observer?.disconnect()
    observer = null
  }

  const load = async () => {
    if (destroyed || status !== 'idle') return
    if (!hasMore()) {
      setStatus('done')
      stopObserving()
      return
    }

    setStatus('loading')
    try {
      await loadMore()
      if (destroyed) return
      if (!hasMore()) {
        setStatus('done')
        stopObserving()
        return
      }
      setStatus('idle')
      // sentinel이 아직 화면에 남아 있으면(한 페이지로 화면이 안 찼다) 다시 알림을 받아야 한다.
      // 관찰을 새로 걸면 브라우저가 현재 교차 상태를 처음부터 다시 통지한다.
      rearm()
    } catch (error) {
      if (destroyed) return
      setStatus('error')
      stopObserving()
      onError?.(error)
    }
  }

  const rearm = () => {
    if (destroyed || typeof IntersectionObserver === 'undefined') return
    stopObserving()
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void load()
      },
      { root, rootMargin: `${rootMarginPx}px` },
    )
    observer.observe(sentinel)
  }

  rearm()

  return {
    current: () => status,
    /** 실패 후 다시 시도 — 버튼에 연결한다(자동 재시도는 하지 않는다) */
    retry: () => {
      if (status !== 'error') return
      setStatus('idle')
      rearm()
    },
    /** 버튼("더 보기")이나 초기 로딩에서 직접 부를 때 — IntersectionObserver가 없는 환경의 유일한 경로 */
    loadNow: () => load(),
    destroy: () => {
      destroyed = true
      stopObserving()
    },
  }
}
