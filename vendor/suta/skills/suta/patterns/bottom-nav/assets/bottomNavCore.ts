/**
 * bottom-nav 코어 — 하단 탭 바(GNB)의 판정만 모은 순수 함수와 초점 감시(의존성 0, 프레임워크 무관).
 *
 * 왜 따로 두는가: 탭 바의 모양은 CSS가 다 하지만, "지금 탭이 무엇인가·이 화면에 탭 바를 보이는가·
 * 키보드가 올라왔는가"는 라우터마다 다시 짜다 틀리기 쉽다(홈 '/'이 모든 경로의 앞부분이라 늘 켜진다 등).
 */

export type TabBadge = number | 'dot' | undefined

/** 쿼리·해시·끝 슬래시를 뗀 경로 — '/my/?tab=orders#top' → '/my' */
const normalize = (path: string) => {
  const bare = path.split(/[?#]/)[0] || '/'
  return bare.length > 1 ? bare.replace(/\/+$/, '') || '/' : bare
}

/** 이 탭이 지금 화면인가 — 홈('/')은 정확히 같을 때만, 나머지는 하위 경로까지 */
export const isCurrentTab = ({ href, path }: { href: string; path: string }) => {
  const target = normalize(href)
  const current = normalize(path)
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}

/**
 * 이 화면에 탭 바를 보이는가 — 잘 만든 앱은 탭의 첫 화면(홈·카테고리·찜·마이)에만 탭 바를 두고,
 * 상세·장바구니·주문·검색·폼에서는 숨긴 채 머리에 뒤로를 둔다. 카테고리 → 상품 목록처럼
 * 탭 안에서 이어지는 화면에도 보이려면 그 앞부분을 alsoOn에 적는다.
 */
export const shouldShowBottomNav = ({ path, tabs, alsoOn = [] }: { path: string; tabs: string[]; alsoOn?: string[] }) => {
  const current = normalize(path)
  if (tabs.some((tab) => normalize(tab) === current)) return true
  return alsoOn.some((prefix) => {
    const base = normalize(prefix)
    return current === base || current.startsWith(`${base}/`)
  })
}

/** 배지에 그릴 글자 — 없으면 null, 점은 빈 글자, 99를 넘으면 99+ */
export const formatBadge = (badge: TabBadge): string | null => {
  if (badge === 'dot') return ''
  if (badge == null || badge <= 0) return null
  return badge > 99 ? '99+' : String(badge)
}

export type BadgeLabels = {
  /** 숫자 배지 — "새 항목 3개" */
  count: (n: number) => string
  /** 99를 넘을 때 */
  overflow: string
  /** 점 배지 */
  dot: string
}

export const DEFAULT_BADGE_LABELS: BadgeLabels = {
  count: (n) => `새 항목 ${n}개`,
  overflow: '새 항목 99개 이상',
  dot: '새 소식 있음',
}

/** 화면 낭독기에 읽힐 배지 문구 — 숫자만 읽으면 무슨 수인지 모른다. 다른 언어면 labels를 넘긴다 */
export const badgeLabel = ({ badge, labels = DEFAULT_BADGE_LABELS }: { badge: TabBadge; labels?: BadgeLabels }): string | null => {
  if (badge === 'dot') return labels.dot
  if (badge == null || badge <= 0) return null
  return badge > 99 ? labels.overflow : labels.count(badge)
}

// 글자를 받지 않는 입력 — 초점이 가도 화면 키보드가 올라오지 않는다
const NON_TEXT_INPUT = /^(?:checkbox|radio|range|color|file|submit|button|reset|image|hidden)$/i

/** 화면 키보드를 올리는 요소인가 */
export const isEditable = (element: Element | null) => {
  if (!element) return false
  const tag = element.tagName.toLowerCase()
  if (tag === 'textarea' || tag === 'select') return true
  if (tag === 'input') return !NON_TEXT_INPUT.test(element.getAttribute('type') ?? 'text')
  const editable = element.getAttribute('contenteditable')
  return editable === '' || editable === 'true' || editable === 'plaintext-only'
}

/**
 * 키보드가 올라온 동안을 알린다 — 입력칸에 초점이 있는 동안 탭 바를 숨겨야 한다.
 * 안드로이드 웹뷰는 키보드가 올라오면 화면 높이를 줄여 position: fixed 탭 바가 키보드 바로 위로 따라 올라와
 * 입력칸과 제안 목록을 가린다. 화면 크기 변화(visualViewport)는 기기마다 달라 초점으로 판정한다.
 */
export const watchKeyboard = ({ onChange, root = document }: { onChange: (open: boolean) => void; root?: Document | HTMLElement }) => {
  // 바뀔 때만 알린다 — 초점이 옮겨 갈 때 focusout·focusin이 같은 값을 두 번 내지 않게
  let open = false
  const update = (next: boolean) => {
    if (next === open) return
    open = next
    onChange(next)
  }
  const handleIn = (event: Event) => update(isEditable(event.target as Element | null))
  // 빠져나갈 때는 다음 초점 대상으로 판정한다 — 입력칸 사이를 옮겨 다니는 동안 탭 바가 깜박이지 않게
  const handleOut = (event: Event) => update(isEditable((event as FocusEvent).relatedTarget as Element | null))
  root.addEventListener('focusin', handleIn)
  root.addEventListener('focusout', handleOut)
  return () => {
    root.removeEventListener('focusin', handleIn)
    root.removeEventListener('focusout', handleOut)
  }
}
