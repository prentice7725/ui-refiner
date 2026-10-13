/* @shared-core layoutTokens.ts origin: layout-principles — 다른 패턴 assets에 복사될 때 이 헤더를 유지한다(저장소 검사가 원본과 해시 비교) */
/**
 * layout-principles — 레이아웃 토큰의 JS 쪽 정본 (의존성 0). layout-tokens.css와 같은 값이다.
 * 레이아웃 검사기(layout-audit)가 같은 척도로 판정하고, 데모·JS 계산(가상 목록 행 높이 등)이 같은 값을 쓰기 위한 것.
 *
 * 두 파일의 값이 어긋나면 검사기와 화면이 다른 척도를 쓰므로, 값을 바꿀 때는 둘 다 바꾼다(테스트가 비교한다).
 */

/** 간격 척도(px) — 키의 숫자 × 4 = px. --space-{키} */
export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 } as const

/** 간격의 역할(px) — 묶음 안 ≤ 묶음 사이의 1/2, 구역 사이는 그보다 넓게. sectionWide는 768px 이상, band는 구역 사이 옅은 띠 높이 */
export const GAP = { item: 8, group: 24, section: 32, sectionWide: 48, band: 8 } as const

/** 글자 크기(px) — 역할로 고른다. 한 화면에는 역할 수만큼(보통 4~5종)만 */
export const TEXT = { caption: 12, small: 14, body: 16, heading: 20, title: 24, display: 32, hero: 40 } as const

export const LEADING = { tight: 1.3, body: 1.5 } as const

/** 굵기 3종 */
export const WEIGHT = { regular: 400, semibold: 600, bold: 700 } as const

/** 모서리 반경(px) — 역할로 3종 + 완전 둥근 것(full) */
export const RADIUS = { control: 8, card: 12, sheet: 24, full: 999 } as const

/** 이미지 비율 — 사이트 전체에서 2~3개만 */
export const RATIO = { square: '1 / 1', photo: '4 / 3', wide: '16 / 9' } as const

/** 색 역할 — 글자 3단계·면 2단계·선·강조색·상태 색. --color-{이름}(camelCase는 하이픈으로) */
export const COLOR = {
  text: '#1b1e24',
  textSecondary: '#4b5260',
  textTertiary: '#646b77',
  line: '#e4e6ea',
  surface: '#ffffff',
  canvas: '#f2f3f5',
  accent: '#1b1e24',
  onAccent: '#ffffff',
  danger: '#c8341f',
  success: '#13795b',
  rise: '#d0262d',
  fall: '#1b64da',
  reward: '#b07d00',
  rewardSilver: '#7b8088',
  rewardBronze: '#a8662b',
} as const

/** 크기의 하한·상한 */
export const LIMITS = {
  /** 글자 크기 하한 — 보조 글자도 이 아래로 줄이지 않는다 */
  minTextPx: 12,
  /** 모바일 본문 하한 */
  bodyMinPx: 14,
  /** 누르는 영역의 최소 크기 */
  tapMinPx: 44,
  /** 글 덩어리 최대 폭(ch) */
  measureCh: 65,
  /** 입력칸·주 버튼 높이 */
  controlHeightPx: 48,
  /** 구역 컨테이너 최대 폭 */
  contentMaxPx: 1120,
} as const

const SPACE_SCALE: number[] = Object.values(SPACE)

/** CSS 길이 → px. px·rem·em(문서 기본 16px 기준)과 0만 안다. %·vw·var()·calc()는 렌더 없이 알 수 없어 null */
export const toPx = (value: string) => {
  const match = value.trim().match(/^(-?\d*\.?\d+)(px|rem|em)?$/i)
  if (!match) return null
  const amount = Number(match[1])
  const unit = (match[2] ?? '').toLowerCase()
  if (unit === '') return amount === 0 ? 0 : null
  return unit === 'px' ? amount : amount * 16
}

/** 4px 격자 위의 값인가 — 1·2px은 선 두께·미세 조정으로 허용한다. 음수(겹치기 margin)는 크기로 판정 */
export const isOnGrid = (px: number) => {
  const size = Math.abs(px)
  return size <= 2 ? Number.isInteger(size) : size % 4 === 0
}

/** 척도에서 가장 가까운 간격 — 척도 밖 값을 고칠 때 제안한다. 같은 거리면 작은 쪽(빈 곳은 넓히기보다 좁히기가 안전) */
export const nearestSpace = (px: number) => {
  const size = Math.abs(px)
  const nearest = SPACE_SCALE.reduce((best, step) => (Math.abs(step - size) < Math.abs(best - size) ? step : best))
  return px < 0 ? -nearest : nearest
}

/** 묶음이 간격만으로 읽히는가 — 묶음 안 간격이 묶음 사이 간격의 절반 이하일 때 */
export const groupGapOk = ({ inside, between }: { inside: number; between: number }) => inside * 2 <= between

/** #rgb·#rrggbb → 상대 휘도(WCAG 2.x) */
const luminance = (hex: string) => {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? [...raw].map((digit) => digit + digit).join('') : raw
  const [r, g, b] = [0, 2, 4].map((start) => {
    const channel = parseInt(full.slice(start, start + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 두 색의 명암비(1~21) — 보통 글자는 4.5 이상, 큰 글자(24px, 굵으면 19px 이상)는 3 이상이 기준이다 */
export const contrastRatio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}
