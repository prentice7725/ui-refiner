/**
 * 휠(드럼) 피커 순수 계산 코어 (의존성 0, DOM 없음).
 *
 * 스크롤 위치↔인덱스 변환, 가운데로부터의 거리→3D 항목 스타일, 키보드 이동 판정.
 * DOM을 만지는 createWheel.ts가 이 함수들을 조합한다 — jsdom에 레이아웃이 없으므로
 * 측정값(scrollTop·itemHeight)은 전부 인자로 받아 여기서 테스트한다.
 */

/** 거리(항목 단위) 1당 기울기 — 원통이 보이면서도 글자가 읽히는 범위(18~22도)의 중간값 */
export const DEFAULT_DEG_PER_ITEM = 20

type IndexFromScrollTopOptions = {
  scrollTop: number
  itemHeight: number
  /** 항목 수 — 0이면 항상 0 */
  count: number
}

/** 스크롤 위치에서 가운데 칸에 온 항목 인덱스 — 반올림 후 0~count-1로 클램프(고무줄·오버슈트 대비) */
export const indexFromScrollTop = ({ scrollTop, itemHeight, count }: IndexFromScrollTopOptions) => {
  if (count <= 0 || itemHeight <= 0) return 0
  const raw = Math.round(scrollTop / itemHeight)
  return Math.max(0, Math.min(raw, count - 1))
}

/** 인덱스가 가운데 칸에 오는 scrollTop — 상하 패딩을 CSS가 (높이−항목)/2로 잡아 두었기에 곱셈 한 번이면 된다 */
export const scrollTopForIndex = ({ index, itemHeight }: { index: number; itemHeight: number }) => index * itemHeight

type ItemStyleAtOptions = {
  /** 가운데로부터의 거리(항목 단위, 위가 음수). 스크롤 중엔 소수 */
  distance: number
  /** 가운데 위·아래로 보이는 항목 수 — 이 밖은 숨긴다 */
  maxVisible: number
  /** 거리 1당 각도(도). 기본 20 */
  degPerItem?: number
  /** 원통 반지름(px) — translateZ 계산용. 기본은 각도 20도·항목 36px에 맞는 값 */
  radius?: number
}

export type WheelItemStyle = {
  /** 도(deg). 위 항목은 양수(윗변이 뒤로), 아래 항목은 음수 */
  rotateX: number
  /** 0~1. 거리 0에서 1, maxVisible 밖에서 0 */
  opacity: number
  /** px. 원통 뒤쪽으로 물러나는 양(0 이하) */
  translateZ: number
}

/**
 * 가운데로부터의 거리로 항목의 3D 자세를 정한다.
 * rotateX: CSS의 양의 rotateX는 윗변이 화면 안쪽으로 눕는다 → 가운데 위 항목(음의 거리)은 양의 각.
 * translateZ: 반지름 r인 원통 위 점은 정면보다 r(1−cosθ)만큼 뒤에 있다.
 */
export const itemStyleAt = ({ distance, maxVisible, degPerItem = DEFAULT_DEG_PER_ITEM, radius }: ItemStyleAtOptions): WheelItemStyle => {
  const abs = Math.abs(distance)
  if (abs > maxVisible) return { rotateX: 0, opacity: 0, translateZ: 0 }
  const rotateX = -distance * degPerItem
  const theta = (Math.abs(rotateX) * Math.PI) / 180
  // 항목 하나가 원통 둘레에서 차지하는 호 길이 ≈ 항목 높이(36px)가 되는 반지름
  const r = radius ?? 36 / ((degPerItem * Math.PI) / 180)
  const translateZ = -r * (1 - Math.cos(theta))
  // 한 칸 밖(maxVisible+1)에서 0이 되도록 선형 감쇠 — 마지막으로 보이는 항목도 아주 흐리게는 남는다
  const opacity = 1 - abs / (maxVisible + 1)
  return {
    rotateX: Number(rotateX.toFixed(3)),
    opacity: Number(opacity.toFixed(3)),
    translateZ: Number(translateZ.toFixed(3)),
  }
}

type NextIndexForKeyOptions = {
  index: number
  count: number
  key: string
  /** PageUp/PageDown 한 번에 움직이는 칸 수 */
  page: number
}

/** 키보드 이동 판정 — 처리하는 키가 아니면 null(호출자는 preventDefault를 하지 않는다) */
export const nextIndexForKey = ({ index, count, key, page }: NextIndexForKeyOptions): number | null => {
  const last = Math.max(0, count - 1)
  const clamp = (value: number) => Math.max(0, Math.min(value, last))
  switch (key) {
    case 'ArrowDown':
      return clamp(index + 1)
    case 'ArrowUp':
      return clamp(index - 1)
    case 'PageDown':
      return clamp(index + page)
    case 'PageUp':
      return clamp(index - page)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}
