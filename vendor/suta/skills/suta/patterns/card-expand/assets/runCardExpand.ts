/**
 * 프레임워크 무관 카드 확장(공유 요소) 전환 코어 (의존성 0).
 *
 * 목록의 카드를 누르면 **그 카드가 제자리에서 자라나** 상세 화면이 되고, 닫으면 다시 그 자리로
 * 줄어든다. 방법은 View Transitions API의 "이름 짝짓기"다 — 바뀌기 전 화면에서 이름을 가진
 * 사각형과 바뀐 뒤 화면에서 같은 이름을 가진 사각형을 브라우저가 찾아, 둘 사이의 위치·크기를
 * 알아서 보간한다(그룹 애니메이션). 카드 안의 그림·제목에도 각각 이름을 주면 그 부위는
 * 따로 움직인다.
 *
 * 규칙 하나가 전부를 좌우한다: **같은 이름은 한 순간에 한 요소에만** 있어야 한다.
 * 목록의 카드마다 이름을 미리 박아 두면 안 된다 — 누른 순간 그 카드에만 붙이고, 화면이 바뀐 뒤엔
 * 도착 요소(상세 루트)로 옮기고, 전환이 끝나면 전부 지운다. 이 코어가 하는 일이 그 순서 관리다.
 *
 * 애니메이션 정의(시간·이징·방향별 겹침 순서)는 CSS 몫이다(card-expand.css).
 */

export type CardExpandDirection = 'open' | 'close'

export type CardExpandNames = {
  /** 루트(카드 ↔ 상세 화면) 이름. 부위 이름은 `{root}-media`·`{root}-title`로 파생된다 */
  root?: string
}

type ViewTransition = { finished: Promise<void> }
type StartViewTransition = (callback: () => void | Promise<void>) => ViewTransition

/** 카드 안에서 따로 움직일 부위 — `data-card-expand-part="media" | "title"` */
const PARTS = ['media', 'title'] as const

const DEFAULT_ROOT_NAME = 'card-expand'

const partElements = (element: HTMLElement) =>
  PARTS.map((part) => ({ part, node: element.querySelector<HTMLElement>(`[data-card-expand-part="${part}"]`) }))

/**
 * 요소(루트)와 그 안의 그림·제목 부위에 view-transition-name을 붙인다.
 * 인라인 style로 붙이는 이유: 이름은 "지금 이 순간 이 요소"에만 있어야 하므로 클래스처럼
 * 여러 요소가 공유하는 규칙에 두면 안 된다.
 */
export const assignTransitionNames = ({ element, names }: { element: HTMLElement; names?: CardExpandNames }) => {
  const root = names?.root ?? DEFAULT_ROOT_NAME
  element.style.viewTransitionName = root
  for (const { part, node } of partElements(element)) {
    if (node) node.style.viewTransitionName = `${root}-${part}`
  }
}

/** assignTransitionNames의 반대 — 루트와 부위 전부에서 이름을 뗀다 */
export const clearTransitionNames = ({ element }: { element: HTMLElement }) => {
  element.style.viewTransitionName = ''
  for (const { node } of partElements(element)) {
    if (node) node.style.viewTransitionName = ''
  }
}

type RunCardExpandOptions = {
  /** open = 카드 → 상세, close = 상세 → 카드. CSS가 이 값으로 방향별 겹침 순서·페이드를 정한다 */
  direction: CardExpandDirection
  /** 출발 요소 — 열 때는 누른 카드, 닫을 때는 상세 루트. 사진을 찍기 전에 이름이 붙는다 */
  from: HTMLElement | null
  /**
   * 화면을 실제로 바꾸는 함수. 이 안에서 DOM이 **동기적으로** 바뀌어야 한다 —
   * React라면 flushSync로 감싼다(그냥 setState하면 콜백이 끝난 뒤에 바뀌어 새 사진이 옛 화면이 된다).
   */
  update: () => void
  /**
   * 도착 요소를 찾는 함수 — update 뒤에 불린다. 열 때는 방금 렌더된 상세 루트, 닫을 때는 목록의
   * 그 카드(`[data-card-id=…]`). 닫을 때 카드로 "돌아가는" 것처럼 보이려면 새 사진을 찍는 시점에
   * 그 카드가 이름을 갖고 있어야 하기 때문에, update 뒤에 붙이고 전환이 끝나면 뗀다.
   */
  to?: () => HTMLElement | null
  names?: CardExpandNames
}

export const runCardExpand = async ({ direction, from, update, to, names }: RunCardExpandOptions): Promise<void> => {
  const host = document.documentElement
  const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition

  host.dataset.cardExpand = direction

  if (typeof start !== 'function') {
    // 미지원 브라우저: 전환 없이 즉시 바뀐다. 기능은 그대로고 연출만 없다
    try {
      update()
    } finally {
      delete host.dataset.cardExpand
    }
    return
  }

  // 페이지 전체(root)를 전환에서 뺀다 — 안 빼면 화면 전체가 250ms 크로스페이드되면서
  // 상세가 자라나기도 전에 완성된 모습으로 스며 나온다. 그 순간만 끄고 원래 값으로 되돌린다
  const savedRootName = host.style.viewTransitionName
  host.style.viewTransitionName = 'none'
  if (from) assignTransitionNames({ element: from, names })

  let target: HTMLElement | null = null

  try {
    await start.call(document, () => {
      update()
      // old 사진은 이미 찍혔다. 열 때 카드는 목록에 그대로 남아 있으므로 여기서 이름을 떼지 않으면
      // 새 화면에 같은 이름이 둘(카드+상세) — 브라우저는 그 전환을 통째로 건너뛴다
      if (from) clearTransitionNames({ element: from })
      target = to?.() ?? null
      if (target) assignTransitionNames({ element: target, names })
    }).finished
  } finally {
    if (from) clearTransitionNames({ element: from })
    if (target) clearTransitionNames({ element: target })
    host.style.viewTransitionName = savedRootName
    delete host.dataset.cardExpand
  }
}
