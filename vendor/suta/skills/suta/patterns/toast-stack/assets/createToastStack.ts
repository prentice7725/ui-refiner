/**
 * 프레임워크 무관 토스트 스택 코어 (의존성 0).
 *
 * 화면 구석의 라이브 영역에 토스트를 쌓는다: 새 토스트가 오면 기존 것이
 * transform으로 밀려나고(레이아웃 애니메이션 없음), 시간이 지나면
 * 스스로 exiting을 거쳐 사라진다. 등장/퇴장은 enter-exit 패턴과 같은
 * data-state 규약으로 CSS(toast-stack.css)가 그린다.
 * position이 'bottom'(기본)이면 최신이 아래에 오고 오래된 것이 위로 밀리며,
 * 'top'(iOS 푸시 배너처럼 위에서 내려옴)이면 최신이 위에 오고 오래된 것이 아래로 밀린다.
 */

type CreateToastStackOptions = {
  /** 토스트 자동 소멸 시간 (기본 3500ms) */
  durationMs?: number
  /** 동시에 보이는 최대 개수 — 넘치면 가장 오래된 것부터 밀려난다 (기본 3) */
  maxVisible?: number
  /** 토스트 사이 간격 px (기본 10) */
  gapPx?: number
  /** 라이브 영역을 붙일 부모 (기본 document.body) */
  parent?: HTMLElement
  /** 스택 위치 — 'bottom'(기본, 위로 쌓임) 또는 'top'(상단 배너, 아래로 쌓임) */
  position?: 'bottom' | 'top'
}

type ToastRecord = {
  element: HTMLElement
  autoTimer: ReturnType<typeof setTimeout>
}

export const createToastStack = ({
  durationMs = 3500,
  maxVisible = 3,
  gapPx = 10,
  parent = document.body,
  position = 'bottom',
}: CreateToastStackOptions = {}) => {
  const region = document.createElement('div')
  region.className = 'toast-region'
  // CSS가 고정 위치와 등장 방향을 이 속성으로 고른다
  region.dataset.position = position
  // 스크린 리더에 방해 없이 알린다 — 토스트는 본질적으로 상태 알림이다
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', 'polite')
  parent.appendChild(region)

  let alive: ToastRecord[] = [] // 오래된 것 → 최신 순

  // 최신이 기준점(0)에 오고, 오래된 것일수록 누적 높이+간격만큼 밀린다.
  // 하단은 위로(-), 상단은 아래로(+) — 부호만 다르다
  const direction = position === 'top' ? 1 : -1

  const reposition = () => {
    let offset = 0
    for (let i = alive.length - 1; i >= 0; i -= 1) {
      alive[i].element.style.transform = `translateY(${direction * offset}px)`
      offset += alive[i].element.offsetHeight + gapPx
    }
  }

  const dismiss = (record: ToastRecord) => {
    if (!alive.includes(record)) return
    alive = alive.filter((item) => item !== record)
    clearTimeout(record.autoTimer)
    const { element } = record
    element.dataset.state = 'exiting'
    const remove = () => {
      element.remove()
      reposition()
    }
    element.addEventListener('transitionend', remove, { once: true })
    setTimeout(remove, 600) // transitionend 유실 폴백
    reposition()
  }

  const show = (message: string) => {
    const element = document.createElement('div')
    element.className = 'toast-item'
    element.textContent = message
    element.dataset.state = 'entering'
    region.appendChild(element)

    const record: ToastRecord = {
      element,
      autoTimer: setTimeout(() => dismiss(record), durationMs),
    }
    alive.push(record)

    // 넘치는 만큼 가장 오래된 것부터 내보낸다
    while (alive.length > maxVisible) dismiss(alive[0])

    reposition()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.dataset.state = 'entered'
      })
    })
    return () => dismiss(record)
  }

  // 화면(라우트)이 바뀔 때 부른다 — 앞 화면의 알림("담았어요")이 다음 화면까지 따라오지 않게 모두 내보낸다
  const clear = () => {
    for (const record of [...alive]) dismiss(record)
  }

  const destroy = () => {
    alive.forEach((record) => clearTimeout(record.autoTimer))
    alive = []
    region.remove()
  }

  return { show, clear, destroy }
}
