/**
 * layout-audit 코어 — CSS·JSX·HTML 소스 텍스트를 훑어 레이아웃 원칙(layout-principles) 위반을 `file:line`으로 찾는다
 * (의존성 0, DOM 없음). 브라우저 데모와 CLI가 같은 함수를 쓴다.
 *
 * 왜 스크립트인가: "레이아웃이 AI 같다"는 대부분 사람이 판단하지만, 아래 규칙들은 코드만 읽고 결정적으로 판정된다.
 * 에이전트가 파일마다 눈으로 훑는 것보다 빠르고 빠뜨리지 않는다. 렌더가 필요한 것(대비·터치 영역·좁은 폭 넘침)은 범위 밖이다.
 *
 * 규칙 (id — 심각도 — 무엇을 잡는가 — 원칙):
 *  tiny-text           error·warn — 11px 미만 글자는 error, 11px대는 warn                                   P7
 *  nested-card         warn — 둥근 모서리 + 테두리·그림자·배경을 가진 상자 안의 같은 상자(JSX·HTML·CSS 선택자)  P5
 *  effect-overuse      warn — 색 그라데이션·backdrop-filter·큰 그림자가 한 파일에 3곳 이상(blur(0)·투명 그림자 같은 시작 상태는 뺀다)   P3
 *  gradient-text       warn — background-clip: text·bg-clip-text                                            P3
 *  font-size-variety   warn — 한 파일의 글자 크기 7종 이상                                                  P2·P10
 *  font-weight-variety warn — 굵기 4종 이상                                                                 P2
 *  radius-variety      warn — 모서리 반경 4종 이상(0·원·알약 제외)                                          P10
 *  spacing-off-scale   warn — 4px 격자 밖 margin·padding·gap. 파일마다 한 번 요약                           P4·P10
 *  centered-text-block warn — 문단(여러 줄 글)의 가운데 정렬                                                P6
 *  image-distort       warn — object-fit: fill·object-fill (사진이 늘어난다)                                 P9
 *  tinted-surface      warn — 연노랑·살구·연파랑 같은 옅은 유채색 바탕(변수 정의 포함). 파일마다 한 번 요약          P5·tone
 *  hue-count           warn — 한 파일에 유채색 계열 3종 이상(강조색 + 오류 빨강을 넘는다). 등락 색 변수(--*-rise·fall 등)와 보상 색 변수(--*-reward·gold 등)는 뺀다   tone
 *  emoji-icon          warn — 아이콘·사진 자리의 이모지(그림 문자). 글자 기호(★ ✓ ×)와 주석은 뺀다. 파일마다 한 번 요약       tone
 *  viewport-height     warn — 100vh·h-screen에 dvh·svh 짝이 없다(모바일 브라우저·웹뷰에서 아래가 잘린다)          웹뷰
 *  input-zoom          warn — 16px 미만 글자 입력칸(iOS가 초점을 받을 때 화면을 확대한다)                       웹뷰
 *  zoom-disabled       warn — viewport의 user-scalable=no·maximum-scale=1(확대를 막는다, WCAG 1.4.4)            접근성
 *
 * 의도적 예외: 그 줄(또는 바로 앞 줄)에 `layout-audit-ignore: {규칙} — {이유}` 주석을 두면 그 줄의 지적을 건너뛴다.
 * 파일 전체에서 한 규칙을 끄려면 `layout-audit-ignore-file: {규칙} — {이유}`. 예외에는 반드시 이유를 적는다.
 */

import { blank, blankComments, cssBlocks, declarationsOf, ignoredLines, lineOf, sortFindings, type CssBlock, type Finding, type Severity, type Source } from './auditCore.ts'
import { isOnGrid, nearestSpace, toPx } from './layoutTokens.ts'

// 결과 형식은 공통 코어(auditCore.ts)가 정본이다 — motion-audit와 결과를 합칠 수 있게 같은 형식을 쓴다
export type { Finding, Severity } from './auditCore.ts'
export { formatFindings, summarize } from './auditCore.ts'

const CSS_FILE = /\.(css|scss|less)$/i
const SFC_FILE = /\.(vue|svelte|html?)$/i
const JSX_FILE = /\.(tsx|jsx)$/i

const TINY_ERROR_PX = 11
const MIN_TEXT_PX = 12
const SIZE_VARIETY = 7
const WEIGHT_VARIETY = 4
const RADIUS_VARIETY = 4
const EFFECT_LIMIT = 3
const HUE_LIMIT = 3
const LARGE_SHADOW_BLUR_PX = 16
const LONG_TEXT_CHARS = 40
// iOS 사파리·WKWebView는 글자가 16px 미만인 입력칸에 초점이 가면 화면을 확대한다
const INPUT_ZOOM_PX = 16

// 그림 문자로 그려지는 이모지만 — ★ ✓ × → © ™ 같은 글자 기호는 뺀다(기본 표시가 글자인 문자는 변형 선택자 U+FE0F가 붙을 때만)
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu

/* ---------------- 파일을 CSS 부분과 마크업 부분으로 나눈다 (줄 번호 보존) ---------------- */

const STYLE_BLOCK = /(<style\b[^>]*>)([\s\S]*?)<\/style>/gi
const SCRIPT_BLOCK = /<script\b[^>]*>[\s\S]*?<\/script>/gi

/** style 블록 안만 남기고 나머지는 공백으로 */
const styleOnly = (text: string) => {
  let out = blank(text)
  for (const match of text.matchAll(STYLE_BLOCK)) {
    const start = (match.index ?? 0) + match[1].length
    out = out.slice(0, start) + match[2] + out.slice(start + match[2].length)
  }
  return out
}

/** 마크업으로 읽을 부분 — style·script 블록과 주석을 지운다(주석 속 태그에 속지 않게) */
const markupOf = (text: string) =>
  blankComments(text.replace(STYLE_BLOCK, blank).replace(SCRIPT_BLOCK, blank).replace(/<!--[\s\S]*?-->/g, blank))
    .split('\n')
    .map((line) => (/^\s*\/\//.test(line) ? blank(line) : line))
    .join('\n')

/** 여러 줄 템플릿 문자열 속 태그는 예시 코드·HTML 문자열이지 JSX가 아니다 — 지운다.
 * className={`…`}처럼 한 줄짜리 템플릿은 실제 클래스 값이라 남긴다 */
const blankMarkupStrings = (code: string) => code.replace(/`(?:\\.|[^`\\])*`/g, (literal) => (literal.includes('\n') && /<[A-Za-z]/.test(literal) ? blank(literal) : literal))

const partsOf = ({ file, text }: Source) => {
  if (CSS_FILE.test(file)) return { css: text, markup: '' }
  if (SFC_FILE.test(file)) return { css: styleOnly(text), markup: markupOf(text) }
  if (JSX_FILE.test(file)) return { css: '', markup: blankMarkupStrings(markupOf(text)) }
  return { css: '', markup: '' }
}

/* ---------------- 값 해석 ---------------- */

/** `var(--x, 16px)`은 대체값으로 — 패턴 CSS의 공개 변수 폴백이 실제로 쓰이는 값이다 */
const unwrapVar = (value: string): string => {
  const match = value.trim().match(/^var\(\s*--[\w-]+\s*,\s*([\s\S]+)\)$/)
  return match ? unwrapVar(match[1]) : value.trim()
}

/** 길이 하나 → px(아는 단위) 또는 정규화한 원문 — 종류 수를 셀 때 같은 값을 하나로 모은다 */
const lengthKey = (value: string) => {
  const raw = unwrapVar(value).toLowerCase()
  const px = toPx(raw)
  return px == null ? raw : `${+px.toFixed(2)}px`
}

const formatPx = (px: number) => `${+px.toFixed(1)}px`

/** 최상위에서만 나눈다 — rgba(0, 0, 0, 0.1)·calc(a - b) 괄호 안은 자르지 않는다 */
const splitTopLevel = (text: string, separator: RegExp = /,/) => {
  const parts: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '(' || ch === '[') depth += 1
    else if (ch === ')' || ch === ']') depth -= 1
    else if (depth === 0 && separator.test(ch)) {
      parts.push(text.slice(from, i))
      from = i + 1
    }
  }
  parts.push(text.slice(from))
  return parts.map((part) => part.trim()).filter(Boolean)
}

const splitValues = (value: string) => splitTopLevel(value, /[\s/]/)

/** 회색 계열(검정·흰색·투명 포함)이 아닌 색이 하나라도 있는가 — 검은 스크림·흰 반짝임은 장식 효과가 아니다 */
const hasChromaticColor = (text: string) => {
  // 회색 단계(gray·slate·zinc)는 채널 차이가 10 안팎이다. 옅은 파스텔(#ede9fe 등)도 장식 그라데이션이므로 12를 넘으면 색으로 본다
  const isChromaticRgb = (r: number, g: number, b: number) => Math.max(r, g, b) - Math.min(r, g, b) > 12
  let rest = text.toLowerCase()
  for (const match of rest.matchAll(/#([0-9a-f]{3,8})\b/g)) {
    const hex = match[1].length <= 4 ? [...match[1].slice(0, 3)].map((c) => c + c).join('') : match[1].slice(0, 6)
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
    if (isChromaticRgb(r, g, b)) return true
  }
  for (const match of rest.matchAll(/rgba?\(([^)]*)\)/g)) {
    const [r, g, b] = match[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map((n) => (n.endsWith('%') ? parseFloat(n) * 2.55 : parseFloat(n)))
    if (isChromaticRgb(r, g, b)) return true
  }
  for (const match of rest.matchAll(/hsla?\(([^)]*)\)/g)) {
    const [, s, l] = match[1].split(/[\s,/]+/).filter(Boolean).map((n) => parseFloat(n))
    if (s > 10 && l > 5 && l < 95) return true
  }
  if (/var\(|color-mix\(|oklch\(|oklab\(|lch\(|lab\(/.test(rest)) return true // 알 수 없는 색 — 브랜드 색일 가능성이 높다
  rest = rest.replace(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|-?\d*\.?\d+[a-z%]*/g, ' ')
  const NEUTRAL = /^(to|top|bottom|left|right|center|at|circle|ellipse|closest|farthest|side|corner|in|srgb|hue|longer|shorter|transparent|black|white|gray|grey|silver|currentcolor|from|repeating|linear|radial|conic|gradient)$/
  return rest.split(/[^a-z-]+/).some((word) => word.length > 2 && !word.split('-').every((part) => NEUTRAL.test(part)))
}

/* ---------------- 색 — 계열과 옅은 색 면 ---------------- */

type Rgba = { r: number; g: number; b: number; a: number }

const NAMED_COLORS: Record<string, string> = { red: '#ff0000', orange: '#ffa500', gold: '#ffd700', yellow: '#ffff00', green: '#008000', lime: '#00ff00', teal: '#008080', cyan: '#00ffff', blue: '#0000ff', navy: '#000080', purple: '#800080', violet: '#ee82ee', pink: '#ffc0cb', tomato: '#ff6347', coral: '#ff7f50' }

const hexToRgba = (hex: string): Rgba => {
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1
  return { r, g, b, a }
}

/** HSL → RGB(0~255) */
const hslToRgb = (h: number, s: number, l: number) => {
  const k = (n: number) => (n + h / 30) % 12
  const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 }
}

/** 값 안의 색 리터럴(hex·rgb·hsl·기본 색 이름) — url(…) 안은 이미지라 뺀다 */
const colorsIn = (value: string): Rgba[] => {
  const text = value.toLowerCase().replace(/url\([^)]*\)/g, ' ')
  const colors: Rgba[] = []
  for (const match of text.matchAll(/#([0-9a-f]{3,8})\b/g)) if ([3, 4, 6, 8].includes(match[1].length)) colors.push(hexToRgba(match[1]))
  for (const match of text.matchAll(/rgba?\(([^)]*)\)/g)) {
    const parts = match[1].split(/[\s,/]+/).filter(Boolean)
    const [r, g, b] = parts.slice(0, 3).map((n) => (n.endsWith('%') ? parseFloat(n) * 2.55 : parseFloat(n)))
    const alpha = parts[3] == null ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
    if ([r, g, b].every(Number.isFinite)) colors.push({ r, g, b, a: Number.isFinite(alpha) ? alpha : 1 })
  }
  for (const match of text.matchAll(/hsla?\(([^)]*)\)/g)) {
    const parts = match[1].split(/[\s,/]+/).filter(Boolean)
    const [h, s, l] = parts.slice(0, 3).map((n) => parseFloat(n))
    const alpha = parts[3] == null ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
    if ([h, s, l].every(Number.isFinite)) colors.push({ ...hslToRgb(h, s / 100, l / 100), a: Number.isFinite(alpha) ? alpha : 1 })
  }
  for (const word of text.replace(/#[0-9a-f]+|[a-z-]*\([^)]*\)/g, ' ').split(/[^a-z]+/)) if (NAMED_COLORS[word]) colors.push(hexToRgba(NAMED_COLORS[word].slice(1)))
  return colors
}

/** 색상각(도)·채도·명도(0~1) */
const hslOf = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const [rn, gn, bn] = [r, g, b].map((v) => v / 255)
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === rn ? ((gn - bn) / d + 6) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

/** OKLCH — 눈으로 본 밝기(L 0~1)·채도(C)·색상각(h). HSL 채도는 흰색 근처에서 부풀어 회색(slate-200)도 색으로 잡는다 */
const oklchOf = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 }
}

// 회색 단계는 유채색이 아니다. slate·zinc 같은 푸른 회색(색상각 200~280)은 C 0.05까지 회색으로 본다 —
// 디자인 시스템이 '회색'으로 쓰는 값이다. 나머지 계열은 C 0.02부터 색이다(옅은 살구 #fef2de는 C 0.03)
const isChromatic = (color: { r: number; g: number; b: number }) => {
  const { C, h } = oklchOf(color)
  return h >= 200 && h <= 280 ? C >= 0.05 : C >= 0.02
}

const HUE_FAMILIES: Array<[string, number]> = [['빨강', 15], ['주황', 40], ['노랑', 65], ['초록', 165], ['청록', 195], ['파랑', 250], ['보라', 290], ['분홍', 345], ['빨강', 361]]
const familyOf = (color: { r: number; g: number; b: number }) => {
  const { h } = hslOf(color)
  return HUE_FAMILIES.find(([, end]) => h < end)?.[0] ?? '빨강'
}

/** 흰 면 위에 얹었을 때의 색 — rgba(빨강, 0.08)도 옅은 분홍 면이다 */
const overWhite = ({ r, g, b, a }: Rgba) => ({ r: r * a + 255 * (1 - a), g: g * a + 255 * (1 - a), b: b * a + 255 * (1 - a) })

/** 옅은 유채색 면 — 연노랑·살구·연분홍·연민트·연파랑 바탕(밝기 0.9 이상). 옅은 색은 채도가 낮아 기준을 따로 둔다:
 * 회색(stone·zinc)은 C 0.005 이하, Tailwind의 -50 바탕은 C 0.013~0.03이다. slate-200(C 0.0126)은 회색으로 남긴다 */
const isTint = (color: Rgba) => {
  const { L, C, h } = oklchOf(overWhite(color))
  return L >= 0.9 && C >= (h >= 200 && h <= 280 ? 0.014 : 0.012)
}

const TW_HUES: Record<string, string> = { red: '빨강', rose: '빨강', orange: '주황', amber: '주황', yellow: '노랑', lime: '초록', green: '초록', emerald: '초록', teal: '청록', cyan: '청록', sky: '파랑', blue: '파랑', indigo: '파랑', violet: '보라', purple: '보라', fuchsia: '분홍', pink: '분홍' }
const TW_COLOR = /^(bg|text|border(?:-[xytrblse])?|ring|fill|stroke|from|via|to|outline|decoration|accent|caret|divide|shadow)-([a-z]+)-(\d{2,3})(?:\/\d+)?$/

const GRADIENT = /(?:repeating-)?(?:linear|radial|conic)-gradient\(/i

/** 큰 그림자 — 흐림 반경 16px 이상 */
/** 완전히 투명한 그림자 층 — 전이의 시작 상태(rgba(0,0,0,0)·transparent)라 보이지 않는다 */
const CLEAR_SHADOW = /\btransparent\b|rgba?\([^)]*[,/]\s*0(?:\.0+)?\s*\)|hsla?\([^)]*[,/]\s*0(?:\.0+)?\s*\)/i

const isLargeShadow = (value: string) =>
  !/^none$/i.test(value.trim()) &&
  splitTopLevel(value).some((shadow) => {
    if (CLEAR_SHADOW.test(shadow)) return false
    const lengths = shadow
      .replace(/(?:rgba?|hsla?|var|color-mix|oklch|oklab)\([^)]*\)/gi, ' ')
      .split(/\s+/)
      .filter((token) => /^-?\d*\.?\d+(px|rem|em)?$/i.test(token))
    const blur = lengths[2] == null ? 0 : (toPx(/^-?\d*\.?\d+$/.test(lengths[2]) ? `${lengths[2]}px` : lengths[2]) ?? 0)
    return blur >= LARGE_SHADOW_BLUR_PX
  })

const WEIGHT_NAMES: Record<string, number> = { normal: 400, bold: 700, thin: 100, extralight: 200, light: 300, medium: 500, semibold: 600, extrabold: 800, black: 900 }
const RESET_VALUES = /^(inherit|initial|unset|revert|revert-layer|1em|100%|smaller|larger)$/i

/* ---------------- 선택자 해석 ---------------- */

type Compound = { classes: string[]; tag: string | null }

const compoundOf = (text: string): Compound => ({
  classes: [...text.matchAll(/\.((?:\\.|[\w-])+)/g)].map((match) => match[1]),
  tag: text.match(/^([a-z][\w-]*)/i)?.[1].toLowerCase() ?? null,
})

/** 선택자 하나 → 마지막 요소와 그 조상들(형제 결합자 + ~ 앞의 요소는 조상이 아니다) */
const anatomyOf = (selector: string) => {
  const tokens = selector.replace(/\s*([>+~])\s*/g, ' $1 ').trim().split(/\s+/)
  const last = compoundOf(tokens[tokens.length - 1] ?? '')
  const ancestors: Compound[] = []
  let skipNext = false
  for (let i = tokens.length - 2; i >= 0; i -= 1) {
    const token = tokens[i]
    if (token === '+' || token === '~') skipNext = true
    else if (token === '>') continue
    else if (skipNext) skipNext = false
    else ancestors.push(compoundOf(token))
  }
  return { last, ancestors }
}

/** 상자로 판정할 때 빼는 요소 — 입력칸·버튼·링크·미디어·작은 표지(배지·칩·아바타)는 카드가 아니다 */
const EXCLUDED_NAME = /^(?:input|textarea|select|option|button|a|link|img|image|svg|video|picture|iframe|label|code|pre|kbd)$|(?:button|input|badge|chip|tag|pill|avatar|icon|switch|toggle|checkbox|radio|tooltip)$/i
const EXCLUDED_CLASS = /(?:^|[-_])(?:btn|button|badge|chip|tag|pill|avatar|icon|input|field|kbd|toggle|switch|thumb|track|indicator|knob|handle|highlight|segment|slider|progress|skeleton|dot|swatch|scrim|overlay|backdrop|tooltip|popover|dropdown|toast)(?:[-_]|$)/i

const keysOf = (compound: Compound) => [...compound.classes.map((c) => `.${c}`), ...(compound.tag ? [compound.tag] : [])]
const isExcludedCompound = (compound: Compound) => (compound.tag != null && EXCLUDED_NAME.test(compound.tag)) || compound.classes.some((c) => EXCLUDED_CLASS.test(c))

/* ---------------- CSS 블록 판정 ---------------- */

type BlockFacts = { block: CssBlock; decls: ReturnType<typeof declarationsOf>; isBox: boolean }

const isRoundedValue = (value: string) =>
  splitValues(value).some((part) => {
    const raw = unwrapVar(part).toLowerCase()
    if (raw === '0' || raw === '50%' || raw === '100%' || /full|pill|round|circle/.test(raw)) return false
    const px = toPx(raw)
    return px == null ? /var\(|calc\(/.test(raw) : px > 0 && px < 999
  })

const factsOf = (block: CssBlock): BlockFacts => {
  const decls = declarationsOf({ body: block.ownBody, line: block.line })
  const has = (pattern: RegExp, valueOk: (value: string) => boolean) => decls.some((d) => pattern.test(d.prop) && valueOk(d.value))
  const rounded = has(/^border(-(top|bottom)-(left|right)|-(start|end)-(start|end))?-radius$/, isRoundedValue)
  const bordered = has(/^border(-(top|right|bottom|left|inline|block)(-(start|end))?)?(-width)?$/, (v) => !/^(none|0|0px|hidden)$/i.test(v.trim()) && !/^none\b/i.test(v.trim()))
  const shadowed = has(/^box-shadow$/, (v) => !/^none$/i.test(v.trim()))
  const filled = has(/^background(-color|-image)?$/, (v) => !/^(none|transparent|inherit|initial|unset|currentcolor)$/i.test(unwrapVar(v)))
  return { block, decls, isBox: rounded && (bordered || shadowed || filled) }
}

const isVisuallyHidden = (facts: BlockFacts) =>
  /sr-only|visually-?hidden|screen-reader/i.test(facts.block.fullSelector) || facts.decls.some((d) => d.prop === 'clip' || (d.prop === 'clip-path' && /inset\(\s*50%/.test(d.value)))

// 문단으로 보이는 선택자 — p 요소이거나 설명·본문류 클래스. 제목·라벨·빈 상태처럼 짧은 한 줄은 뺀다
const PARAGRAPH_HINT = /^p(?=$|[.:#[])|desc|paragraph|summary|subtitle|lead|copy|bio\b|detail|(?:^|[.\-_])text(?=$|[-_:[.])/i
const NOT_PARAGRAPH = /empty|caption|label|title|heading|badge|btn|button|icon|count|number|price|tab|nav|logo|avatar|cta|stat|kpi/i

const isParagraphSelector = (selector: string) => {
  const last = selector.replace(/\s*([>+~])\s*/g, ' ').trim().split(/\s+/).pop() ?? ''
  return PARAGRAPH_HINT.test(last) && !NOT_PARAGRAPH.test(last)
}

/* ---------------- 마크업(JSX·HTML) 스캔 ---------------- */

type Tag = { name: string; start: number; attrs: string; closing: boolean; selfClosing: boolean; end: number }

const VOID = /^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i

/** 태그를 차례로 — 속성 안의 `{…}`·따옴표 속 `>`(화살표 함수 등)에 속지 않게 직접 센다 */
const scanTags = (code: string): Tag[] => {
  const tags: Tag[] = []
  const opener = /<(\/?)([A-Za-z][\w.:-]*)/g
  let match: RegExpExecArray | null
  while ((match = opener.exec(code))) {
    let depth = 0
    let quote: string | null = null
    let i = opener.lastIndex
    for (; i < code.length; i += 1) {
      const ch = code[i]
      if (quote) {
        if (ch === quote && code[i - 1] !== '\\') quote = null
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch
      else if (ch === '{') depth += 1
      else if (ch === '}') depth -= 1
      else if (ch === '>' && depth <= 0) break
    }
    const attrs = code.slice(opener.lastIndex, i)
    tags.push({ name: match[2], start: match.index, attrs, closing: match[1] === '/', selfClosing: /\/\s*$/.test(attrs) || VOID.test(match[2]), end: i + 1 })
  }
  return tags
}

/** 속성값 — "…", '…', {…}(중괄호 균형) 중 하나 */
const attrValue = ({ attrs, name }: { attrs: string; name: RegExp }) => {
  const match = name.exec(attrs)
  if (!match) return null
  let i = match.index + match[0].length
  const first = attrs[i]
  if (first === '"' || first === "'") {
    const close = attrs.indexOf(first, i + 1)
    return attrs.slice(i + 1, close < 0 ? attrs.length : close)
  }
  if (first !== '{') return null
  let depth = 0
  const from = i
  for (; i < attrs.length; i += 1) {
    if (attrs[i] === '{') depth += 1
    else if (attrs[i] === '}' && --depth === 0) break
  }
  return attrs.slice(from + 1, i)
}

/** class·className 속성의 클래스 토큰 — 문자열·cn()/clsx() 인자·템플릿 리터럴 안의 문자열을 모두 모은다 */
const classTokensOf = (attrs: string) => {
  const value = attrValue({ attrs, name: /(?:^|\s)(?:className|class|:class)\s*=\s*/ })
  if (value == null) return []
  const strings = /^\s*["'`]|[{(]/.test(value) && /["'`]/.test(value) ? [...value.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2].replace(/\$\{[^}]*\}/g, ' ')) : [value]
  return strings
    .join(' ')
    .split(/\s+/)
    .map((token) => token.replace(/^[{'"`(,!]+|[}'"`),:]+$/g, ''))
    .filter(Boolean)
}

/** 반응형·상태 접두사(md:·hover:)를 뗀 유틸리티 이름 */
const baseOf = (token: string) => token.slice(token.lastIndexOf(':') + 1).replace(/^!/, '')

const TW_SIZE: Record<string, number> = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 }
const TW_RADIUS: Record<string, number> = { '': 4, xs: 2, sm: 2, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24 }

const twArbitraryPx = (inner: string) => toPx(inner.replace(/_/g, ' '))

const twIsRounded = (base: string) => /^rounded(-|$)/.test(base) && !/-(none|full)$/.test(base)
const twIsBordered = (base: string) => /^border(-[xytrblse])?(-\d+|-\[[^\]]+\])?$/.test(base) && !/-0$/.test(base)
const twIsShadowed = (base: string) => /^shadow(-(xs|sm|md|lg|xl|2xl|inner|\[[^\]]+\]))?$/.test(base)
const twIsFilled = (base: string) => /^bg-/.test(base) && !/^bg-(transparent|none|inherit|current|clip-|origin-|blend-|repeat|no-repeat|fixed|local|scroll|auto|cover|contain|center|top|bottom|left|right|opacity-)/.test(base)

const CARD_COMPONENT = /^(?:[A-Z]\w*)?Card$|^(?:Paper|Panel|Tile)$/
const CARD_CLASS = /^(?:card|[\w-]+[-_]card|[A-Za-z]+Card)$/

/* ---------------- 검사 ---------------- */

type Push = (finding: Omit<Finding, 'file'>) => void

/** 파일 단위로 모으는 값 — 종류 수·척도 밖 간격·효과 개수는 파일마다 한 번 요약한다 */
type Tally = {
  sizes: Map<string, number[]>
  weights: Map<string, number[]>
  radii: Map<string, number[]>
  offScale: Array<{ line: number; px: number }>
  effects: number[]
  tints: number[]
  hues: Map<string, number[]>
  emoji: Map<string, number[]>
}

const newTally = (): Tally => ({ sizes: new Map(), weights: new Map(), radii: new Map(), offScale: [], effects: [], tints: [], hues: new Map(), emoji: new Map() })

/** 등락 색 짝을 정의하는 변수 — 시세·손익의 상승·하락 색은 강조색·오류 빨강과 따로 센다(tone.md 2절) */
const TREND_VAR = /^--(?:[\w-]*-)?(rise|fall|up|down|gain|loss|bull|bear)(?:-[\w-]*)?$/
/** 보상 색을 정의하는 변수 — 메달·트로피·코인·1~3위 표시 같은 보상 그림의 색도 따로 센다(tone.md 2절). 직접 쓴 값은 그대로 센다 */
const REWARD_VAR = /^--(?:[\w-]*-)?(reward|medal|trophy|coin|gold|silver|bronze)(?:-[\w-]*)?$/

/** 선언 하나의 색 — 계열은 모든 색 속성·변수에서(등락 색·보상 색 변수는 빼고), 옅은 면은 바탕과 변수 정의에서 센다 */
const tallyColors = ({ prop, value, line, tally }: { prop: string; value: string; line: number; tally: Tally }) => {
  const colors = colorsIn(value)
  if (colors.length === 0) return
  const ownFamily = TREND_VAR.test(prop) || REWARD_VAR.test(prop)
  for (const color of colors) if (!ownFamily && color.a >= 0.05 && isChromatic(color)) remember({ map: tally.hues, key: familyOf(color), line })
  const surface = /^background(-color|-image)?$/.test(prop) || prop.startsWith('--')
  if (surface && colors.some(isTint)) tally.tints.push(line)
}
/** 값마다 나온 줄을 모은다 — 요약 지적의 첫 줄과 관여 줄 전체(편집 후 훅용)를 함께 낸다 */
const remember = ({ map, key, line }: { map: Map<string, number[]>; key: string; line: number }) => {
  map.set(key, [...(map.get(key) ?? []), line])
}

const checkTinyText = ({ px, line, push }: { px: number; line: number; push: Push }) => {
  if (px <= 0 || px >= MIN_TEXT_PX) return
  const severity: Severity = px < TINY_ERROR_PX ? 'error' : 'warn'
  push({
    line,
    rule: 'tiny-text',
    severity,
    message: severity === 'error' ? `글자 ${formatPx(px)} — 읽히지 않는다(하한 12px)` : `글자 ${formatPx(px)} — 하한 12px 바로 아래`,
    fix: '보조 글자도 12px(--text-caption) 이상. 자리가 모자라면 글자가 아니라 요소·열을 줄인다(P7)',
  })
}

/** 길이 → px. rem은 이번 묶음의 html 기준 크기로 환산한다(62.5% = 10px 같은 설정을 쓰는 사이트가 흔하다) */
const pxOf = ({ value, remBase }: { value: string; remBase: number }) => {
  const raw = unwrapVar(value).trim()
  return /^-?\d*\.?\d+rem$/i.test(raw) ? parseFloat(raw) * remBase : toPx(raw)
}

/** font-size 값(px·rem만 판정 — em·%는 부모 크기를 몰라 건너뛴다) */
const sizePx = ({ value, remBase }: { value: string; remBase: number }) => {
  const raw = unwrapVar(value)
  return /(px|rem)$/i.test(raw) ? pxOf({ value: raw, remBase }) : null
}

/** html·:root의 font-size — 없으면 브라우저 기본 16px */
const remBaseOf = (facts: BlockFacts[]) => {
  for (const fact of facts) {
    if (!splitTopLevel(fact.block.fullSelector).some((part) => /^(html|:root)$/i.test(part.trim()))) continue
    const size = fact.decls.find((d) => d.prop === 'font-size')?.value.trim()
    if (!size) continue
    if (/%$/.test(size)) return (16 * parseFloat(size)) / 100
    const px = toPx(size)
    if (px) return px
  }
  return 16
}

/* ---------------- 모바일 웹뷰 — 높이 단위·입력칸 확대 ---------------- */

const FULL_VIEWPORT = /^100vh(\s*!important)?$/i
const DYNAMIC_VIEWPORT = /\d(?:dvh|svh|lvh)\b/i
const HEIGHT_PROP = /^(?:min-|max-)?(?:height|block-size)$/

const viewportHeightFinding = (line: number): Omit<Finding, 'file'> => ({
  line,
  rule: 'viewport-height',
  severity: 'warn',
  message: '100vh — 모바일 브라우저·웹뷰에서는 주소창·도구 막대 높이까지 포함해 아래가 잘리거나 넘친다',
  fix: '100dvh(지금 보이는 높이)나 100svh(가장 작은 높이)로. 옛 브라우저용 100vh는 앞 줄에 남긴다(min-height: 100vh; min-height: 100dvh;)',
})

const inputZoomFinding = ({ line, px }: { line: number; px: number }): Omit<Finding, 'file'> => ({
  line,
  rule: 'input-zoom',
  severity: 'warn',
  message: `입력칸 글자 ${formatPx(px)} — iOS 사파리·웹뷰는 16px 미만 입력칸에 초점이 가면 화면을 확대한다`,
  fix: '입력칸 글자는 16px(--text-body) 이상. 작아 보이게 하려면 칸 높이·여백을 줄인다. maximum-scale=1로 확대를 막지 않는다',
})

// 글자를 받지 않는 입력(체크·라디오·슬라이더·파일·버튼)은 확대와 관계없다
const NON_TEXT_INPUT = /^(?:checkbox|radio|range|color|file|submit|button|reset|image|hidden)$/i
const NON_TEXT_INPUT_ATTR = /\[type\s*=\s*["']?(?:checkbox|radio|range|color|file|submit|button|reset|image|hidden)\b/i
const INPUT_CLASS = /(?:^|[-_])(?:input|textarea|textfield|text-field)$/i

/** 마우스·넓은 화면에서만 적용되는 묶음(@media (pointer: fine)·(hover: hover)·(min-width: 768px 이상)) — 터치 기기의 확대와 관계없다 */
const isDesktopOnly = (selector: string) =>
  [...selector.matchAll(/@media[^{]*/gi)].some(([group]) => /pointer\s*:\s*fine|hover\s*:\s*hover/i.test(group) || Number(group.match(/min-width\s*:\s*(\d+)px/i)?.[1] ?? 0) >= 768)

/** 선택자가 글자 입력칸 자체를 가리키는가 — input·textarea·select 태그, 이름이 input·textarea로 끝나는 클래스. placeholder는 확대와 관계없다 */
const isInputSelector = (selector: string) => {
  const lastToken = selector.replace(/\s*([>+~])\s*/g, ' $1 ').trim().split(/\s+/).pop() ?? ''
  if (NON_TEXT_INPUT_ATTR.test(lastToken) || /::?(?:-webkit-input-)?placeholder/i.test(lastToken)) return false
  const { last } = anatomyOf(selector)
  return (last.tag != null && /^(?:input|textarea|select)$/.test(last.tag)) || last.classes.some((c) => INPUT_CLASS.test(c))
}

// 아이콘 글꼴의 font-size는 글자가 아니라 아이콘 크기다 — 작은 글자·글자 크기 종류에서 뺀다
const ICON_SELECTOR = /icon|glyph|(?:^|[\s.#>+~])fa(?:-|$|[\s.:#[])|material-(?:symbols|icons)|(?:^|[\s.])(?:bi|ri)-/i

/** CSS 부분 → 블록별 사실(선언·상자 여부). @keyframes 안은 모션의 일이라 뺀다 */
const factsFor = (css: string) =>
  cssBlocks(css)
    .filter((block) => !/@keyframes/i.test(block.selector) && !/@keyframes/i.test(block.fullSelector))
    .map(factsOf)

const auditCssFacts = ({ facts, boxKeys, tally, push, remBase }: { facts: BlockFacts[]; boxKeys: Set<string>; tally: Tally; push: Push; remBase: number }) => {
  for (const fact of facts) {
    const { block, decls } = fact
    const hidden = isVisuallyHidden(fact)
    const icon = ICON_SELECTOR.test(block.fullSelector)
    const input = !isDesktopOnly(block.selector) && splitTopLevel(block.fullSelector).some(isInputSelector)
    // 같은 블록에 dvh·svh 짝이 있으면 100vh는 옛 브라우저용 대비 값이다
    const dynamicHeights = new Set(decls.filter((d) => DYNAMIC_VIEWPORT.test(d.value)).map((d) => d.prop))
    let clipReported = false
    let backdropCounted = false

    for (const { prop, value, line } of decls) {
      if (prop === 'font-size') {
        if (icon) continue
        const px = sizePx({ value, remBase })
        if (px != null && !hidden) checkTinyText({ px, line, push })
        if (px != null && input && px < INPUT_ZOOM_PX) push(inputZoomFinding({ line, px }))
        if (!RESET_VALUES.test(value.trim()) && value.trim() !== '0') remember({ map: tally.sizes, key: lengthKey(value), line })
      } else if (prop === 'font') {
        const size = value.match(/(?:^|\s)(\d*\.?\d+(?:px|rem))(?=\s*\/|\s)/i)?.[1]
        if (size && !icon) {
          const px = pxOf({ value: size, remBase })
          if (px != null && !hidden) checkTinyText({ px, line, push })
          if (px != null && input && px < INPUT_ZOOM_PX) push(inputZoomFinding({ line, px }))
          remember({ map: tally.sizes, key: lengthKey(size), line })
        }
      } else if (HEIGHT_PROP.test(prop) && FULL_VIEWPORT.test(value.trim())) {
        if (!dynamicHeights.has(prop)) push(viewportHeightFinding(line))
      } else if (prop === 'font-weight') {
        const raw = unwrapVar(value).toLowerCase()
        if (!RESET_VALUES.test(raw) && !/^(bolder|lighter)$/.test(raw)) remember({ map: tally.weights, key: String(WEIGHT_NAMES[raw] ?? raw), line })
      } else if (/^border(-(top|bottom)-(left|right)|-(start|end)-(start|end))?-radius$/.test(prop)) {
        for (const part of splitValues(value)) {
          const raw = unwrapVar(part).toLowerCase()
          if (raw === '0' || raw === '50%' || raw === '100%' || /full|pill|round|circle|^calc\(/.test(raw)) continue
          const px = toPx(raw)
          if (px != null && (px === 0 || px >= 999)) continue
          remember({ map: tally.radii, key: lengthKey(raw), line })
        }
      } else if (/^(margin|padding)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(row-|column-)?gap$/.test(prop)) {
        for (const part of splitValues(value)) {
          const px = pxOf({ value: part, remBase })
          if (px != null && !isOnGrid(px)) tally.offScale.push({ line, px })
        }
      } else if (prop === 'text-align' && /^center$/i.test(value.trim())) {
        if (splitTopLevel(block.fullSelector).some(isParagraphSelector)) {
          push({ line, rule: 'centered-text-block', severity: 'warn', message: '문단을 가운데 정렬 — 줄마다 시작점이 달라 읽기 어렵다', fix: '문단은 왼쪽 정렬(text-align: start). 가운데는 짧은 한 줄(빈 상태 안내 등)만 (P6)' })
        }
      } else if ((prop === 'background-clip' || prop === '-webkit-background-clip') && /^text$/i.test(value.trim())) {
        if (!clipReported) push({ line, rule: 'gradient-text', severity: 'warn', message: '그라데이션 글자 — 강조가 아니라 장식으로 읽힌다', fix: '단색 글자에 크기·굵기로 위계를 준다. 강조색은 주 버튼 한 곳에 (P3)' })
        clipReported = true
      } else if (prop === 'object-fit' && /^fill$/i.test(value.trim())) {
        push({ line, rule: 'image-distort', severity: 'warn', message: 'object-fit: fill — 사진이 틀에 맞춰 늘어난다', fix: 'aspect-ratio로 틀을 정하고 object-fit: cover로 잘라 채운다 (P9)' })
      }

      // 강한 효과 — 장식 그라데이션·유리·큰 그림자
      if (/^(background|background-image|border-image)$/.test(prop) && GRADIENT.test(value) && hasChromaticColor(value)) tally.effects.push(line)
      // blur(0)은 유리가 되기 전의 시작 상태(전이용)라 세지 않는다
      if ((prop === 'backdrop-filter' || prop === '-webkit-backdrop-filter') && !/^(none|blur\(\s*0(px|rem|em)?\s*\))$/i.test(value.trim()) && !backdropCounted) {
        tally.effects.push(line)
        backdropCounted = true
      }
      if (prop === 'box-shadow' && isLargeShadow(value)) tally.effects.push(line)
      tallyColors({ prop, value, line, tally })
    }

    // 상자 안 상자 — 이 블록이 상자이고, 선택자의 조상 중에 상자가 있다
    if (fact.isBox) {
      const nested = splitTopLevel(block.fullSelector).some((selector) => {
        const { last, ancestors } = anatomyOf(selector)
        if (isExcludedCompound(last)) return false
        return ancestors.some((ancestor) => keysOf(ancestor).some((key) => boxKeys.has(key)))
      })
      if (nested) push({ line: block.line, rule: 'nested-card', severity: 'warn', message: '상자 안에 상자 — 테두리·배경·그림자가 있는 상자 안에 같은 상자가 또 있다', fix: '안쪽 상자를 걷어 내고 간격·얇은 선·정렬로 나눈다. 카드는 독립 단위에 한 겹만 (P5)' })
    }
  }
}

type Element = { name: string; line: number; isBox: boolean; align: 'center' | 'start' | null; centerReported: boolean }

const auditMarkup = ({ markup, boxKeys, tally, push, remBase }: { markup: string; boxKeys: Set<string>; tally: Tally; push: Push; remBase: number }) => {
  const stack: Element[] = []
  for (const tag of scanTags(markup)) {
    if (tag.closing) {
      // 같은 이름의 가장 가까운 열린 태그까지 닫는다 — 닫히지 않은 것(제네릭 <T> 등)은 함께 버린다
      const index = stack.map((el) => el.name).lastIndexOf(tag.name)
      if (index >= 0) stack.length = index
      continue
    }
    const line = lineOf(markup, tag.start)
    const tokens = classTokensOf(tag.attrs)
    const bases = tokens.map(baseOf)
    const plain = tokens.filter((token) => !token.includes(':')).map((token) => token.replace(/^!/, ''))
    const style = attrValue({ attrs: tag.attrs, name: /(?:^|\s)style\s*=\s*/ }) ?? ''
    const isJsxStyle = /^\s*\{/.test(style)
    const lowerTag = tag.name.toLowerCase()

    // 확대를 막는 viewport — 글자를 키워 읽어야 하는 사람이 읽을 수 없다(WCAG 1.4.4)
    if (lowerTag === 'meta' && /^viewport$/i.test(attrValue({ attrs: tag.attrs, name: /(?:^|\s)name\s*=\s*/ }) ?? '')) {
      const content = attrValue({ attrs: tag.attrs, name: /(?:^|\s)content\s*=\s*/ }) ?? ''
      if (/user-scalable\s*=\s*(?:no|0)\b/i.test(content) || /maximum-scale\s*=\s*(?:0?\.\d+|1(?:\.0+)?)(?![\d.])/i.test(content)) {
        push({ line, rule: 'zoom-disabled', severity: 'warn', message: '확대를 막은 viewport(user-scalable=no·maximum-scale=1) — 글자를 키워야 읽을 수 있는 사람이 읽지 못한다', fix: 'width=device-width, initial-scale=1, viewport-fit=cover만 둔다. 입력칸 확대가 문제면 입력칸 글자를 16px 이상으로 (WCAG 1.4.4)' })
      }
    }
    const isTextInput = /^(?:input|textarea|select)$/.test(lowerTag) && !NON_TEXT_INPUT.test(attrValue({ attrs: tag.attrs, name: /(?:^|\s)type\s*=\s*/ }) ?? '')

    // 높이 — h-screen(100vh)은 dvh·svh 짝이 같은 요소에 없으면 알린다
    if (plain.some((c) => /^(?:min-|max-)?h-screen$/.test(c)) && !bases.some((b) => /^(?:min-|max-)?h-(?:dvh|svh|lvh)$/.test(b))) push(viewportHeightFinding(line))
    // 입력칸 글자 — 접두사 없는 크기 클래스만(md:text-base 같은 넓은 화면 값은 모바일 확대와 관계없다)
    if (isTextInput) {
      const sizes = plain.map((c) => {
        const arbitrary = c.match(/^text-\[([^\]]+)\]$/)
        if (arbitrary) return twArbitraryPx(arbitrary[1])
        return /^text-(xs|sm|base|lg|[2-9]?xl)$/.test(c) ? TW_SIZE[c.slice(5)] : null
      })
      const px = sizes.filter((size): size is number => size != null).at(-1)
      if (px != null && px < INPUT_ZOOM_PX) push(inputZoomFinding({ line, px }))
    }

    // 글자 크기
    for (const base of bases) {
      const arbitrary = base.match(/^text-\[([^\]]+)\]$/)
      if (arbitrary) {
        const px = twArbitraryPx(arbitrary[1])
        if (px != null) {
          checkTinyText({ px, line, push })
          remember({ map: tally.sizes, key: `${+px.toFixed(2)}px`, line })
        }
      } else if (/^text-(xs|sm|base|lg|[2-9]?xl)$/.test(base)) remember({ map: tally.sizes, key: `${TW_SIZE[base.slice(5)]}px`, line })
      const weight = base.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/)
      if (weight) remember({ map: tally.weights, key: String(WEIGHT_NAMES[weight[1]]), line })
      const radius = base.match(/^rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?(?:-(xs|sm|md|lg|xl|2xl|3xl|\[[^\]]+\]))?$/)
      if (radius && twIsRounded(base)) {
        const size = radius[1] ?? ''
        const px = size.startsWith('[') ? twArbitraryPx(size.slice(1, -1)) : TW_RADIUS[size]
        if (px != null && px > 0 && px < 999) remember({ map: tally.radii, key: `${+px.toFixed(2)}px`, line })
      }
      const space = base.match(/^-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-(\d+(?:\.\d+)?|px|\[[^\]]+\])$/)
      if (space) {
        const raw = space[1]
        const px = raw === 'px' ? 1 : raw.startsWith('[') ? twArbitraryPx(raw.slice(1, -1)) : Number(raw) * 4
        if (px != null && !isOnGrid(px)) tally.offScale.push({ line, px })
      }
      if (/^bg-(gradient-to-|linear-|radial|conic)/.test(base) || (/^backdrop-blur(-|$)/.test(base) && base !== 'backdrop-blur-none') || /^(drop-)?shadow-(lg|xl|2xl)$/.test(base)) tally.effects.push(line)
      if (base === 'bg-clip-text') push({ line, rule: 'gradient-text', severity: 'warn', message: '그라데이션 글자 — 강조가 아니라 장식으로 읽힌다', fix: '단색 글자에 크기·굵기로 위계를 준다. 강조색은 주 버튼 한 곳에 (P3)' })
      const twColor = base.match(TW_COLOR)
      if (twColor && TW_HUES[twColor[2]]) {
        remember({ map: tally.hues, key: TW_HUES[twColor[2]], line })
        if (twColor[1] === 'bg' && Number(twColor[3]) <= 200) tally.tints.push(line)
      }
      const twArbitraryColor = base.match(/^(bg|text|border|fill|stroke)-\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]*\)|hsla?\([^\]]*\))\]$/)
      if (twArbitraryColor) tallyColors({ prop: twArbitraryColor[1] === 'bg' ? 'background' : 'color', value: twArbitraryColor[2].replace(/_/g, ' '), line, tally })
      if (base === 'object-fill') push({ line, rule: 'image-distort', severity: 'warn', message: 'object-fill — 사진이 틀에 맞춰 늘어난다', fix: 'aspect-ratio로 틀을 정하고 object-cover로 잘라 채운다 (P9)' })
    }

    // 인라인 스타일 — JSX 객체({{ fontSize: 9 }})와 HTML 문자열(style="font-size: 10px")
    let inlineAlign: 'center' | 'start' | null = null
    if (isJsxStyle) {
      const size = style.match(/fontSize\s*:\s*(?:(\d*\.?\d+)(?![\w.])|(["'])(\d*\.?\d+(?:px|rem))\2)/)
      if (size) {
        const px = size[1] != null ? Number(size[1]) : toPx(size[3])
        if (px != null) checkTinyText({ px, line, push })
        if (px != null && isTextInput && px < INPUT_ZOOM_PX) push(inputZoomFinding({ line, px }))
      }
      if (/(?:height|minHeight|maxHeight)\s*:\s*(["'])100vh\1/.test(style) && !/\d(?:dvh|svh|lvh)/.test(style)) push(viewportHeightFinding(line))
      for (const match of style.matchAll(/(background(?:Color)?|color|borderColor)\s*:\s*(["'])([^"']+)\2/g)) tallyColors({ prop: match[1].startsWith('background') ? 'background' : 'color', value: match[3], line, tally })
      const align = style.match(/textAlign\s*:\s*(["'])(\w+)\1/)?.[2]
      if (align) inlineAlign = align === 'center' ? 'center' : 'start'
    } else if (style) {
      for (const { prop, value } of declarationsOf({ body: style, line })) {
        tallyColors({ prop, value, line, tally })
        if (prop === 'font-size') {
          const px = sizePx({ value, remBase })
          if (px != null) checkTinyText({ px, line, push })
          if (px != null && isTextInput && px < INPUT_ZOOM_PX) push(inputZoomFinding({ line, px }))
        }
        if (HEIGHT_PROP.test(prop) && FULL_VIEWPORT.test(value.trim()) && !/\d(?:dvh|svh|lvh)/.test(style)) push(viewportHeightFinding(line))
        if (prop === 'text-align') inlineAlign = /center/i.test(value) ? 'center' : 'start'
      }
    }

    // 상자 판정 — Tailwind 조합, 같은 묶음 CSS가 상자로 정의한 클래스, 카드 이름
    const name = tag.name
    const lowerName = name.toLowerCase()
    const excluded = EXCLUDED_NAME.test(name) || plain.some((c) => EXCLUDED_CLASS.test(c))
    const twBox = plain.some(twIsRounded) && plain.some((c) => twIsBordered(c) || twIsShadowed(c) || twIsFilled(c))
    const cssBox = [...plain.map((c) => `.${c}`), lowerName].some((key) => boxKeys.has(key))
    const namedCard = CARD_COMPONENT.test(name) || plain.some((c) => CARD_CLASS.test(c))
    const isBox = !excluded && (twBox || cssBox || namedCard)

    if (isBox) {
      const outer = [...stack].reverse().find((el) => el.isBox)
      if (outer) push({ line, rule: 'nested-card', severity: 'warn', message: `상자 안에 상자 — 바깥 상자(${outer.line}줄) 안에 테두리·배경·그림자가 있는 상자가 또 있다`, fix: '안쪽 상자를 걷어 내고 간격·얇은 선·정렬로 나눈다. 카드는 독립 단위에 한 겹만 (P5)' })
    }

    // 정렬 — text-center는 자식에게 이어진다. 가운데 정렬 안의 긴 문단을 잡는다
    const classAlign = plain.includes('text-center') ? 'center' : plain.some((c) => /^text-(left|start|right|end|justify)$/.test(c)) ? 'start' : null
    const element: Element = { name, line, isBox, align: inlineAlign ?? classAlign, centerReported: false }
    if (lowerName === 'p') {
      const source = [element, ...[...stack].reverse()].find((el) => el.align != null)
      if (source?.align === 'center' && !source.centerReported) {
        // 글자로 적힌 부분만 센다 — {설명} 같은 식은 길이를 몰라 판정하지 않는다(짧은 상태 문구일 때가 많다)
        const close = markup.indexOf('</p', tag.end)
        const content = markup.slice(tag.end, close < 0 ? tag.end : close)
        const text = content.replace(/\{[^{}]*\}/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        if ([...text].length >= LONG_TEXT_CHARS) {
          push({ line, rule: 'centered-text-block', severity: 'warn', message: '여러 줄 문단을 가운데 정렬 — 줄마다 시작점이 달라 읽기 어렵다', fix: '문단은 왼쪽 정렬(text-left·text-align: start). 가운데는 짧은 한 줄(빈 상태 안내 등)만 (P6)' })
          source.centerReported = true
        }
      }
    }

    if (!tag.selfClosing) stack.push(element)
  }
}

const summarizeTally = ({ tally, push }: { tally: Tally; push: Push }) => {
  const allLines = (lines: number[]) => [...new Set(lines)].sort((a, b) => a - b)
  const linesOf = (map: Map<string, number[]>) => allLines([...map.values()].flat())
  const firstLine = (map: Map<string, number[]>) => linesOf(map)[0]
  const list = (map: Map<string, number[]>) => [...map.keys()].join('·')
  if (tally.sizes.size >= SIZE_VARIETY) {
    push({ line: firstLine(tally.sizes), lines: linesOf(tally.sizes), rule: 'font-size-variety', severity: 'warn', message: `글자 크기 ${tally.sizes.size}종(${list(tally.sizes)}) — 한 화면은 역할 수만큼 4~5종`, fix: '--text-* 토큰(12·14·16·20·24·32·40px)에서 역할로 고른다 (P2·P10)' })
  }
  if (tally.weights.size >= WEIGHT_VARIETY) {
    push({ line: firstLine(tally.weights), lines: linesOf(tally.weights), rule: 'font-weight-variety', severity: 'warn', message: `굵기 ${tally.weights.size}종(${list(tally.weights)}) — 3종이면 충분하다`, fix: '400·600·700(--weight-*)만 쓴다. 굵게는 영역마다 한 줄 (P2)' })
  }
  if (tally.radii.size >= RADIUS_VARIETY) {
    push({ line: firstLine(tally.radii), lines: linesOf(tally.radii), rule: 'radius-variety', severity: 'warn', message: `모서리 반경 ${tally.radii.size}종(${list(tally.radii)}) — 같은 역할이 화면마다 달라 보인다`, fix: '역할로 3종(--radius-control 8·--radius-card 12·--radius-sheet 24px) + 완전 둥근 것 (P10)' })
  }
  if (tally.offScale.length > 0) {
    const sorted = [...tally.offScale].sort((a, b) => a.line - b.line)
    const lines = [...new Set(sorted.map((o) => o.line))]
    const examples = [...new Set(sorted.map((o) => Math.abs(o.px)))].slice(0, 3).map((px) => `${formatPx(px)} → ${formatPx(nearestSpace(px))}`)
    push({ line: lines[0], lines, rule: 'spacing-off-scale', severity: 'warn', message: `4px 격자 밖 간격 ${sorted.length}곳(${lines.slice(0, 8).join('·')}줄)`, fix: `척도(4·8·12·16·24·32·48·64)로 — ${examples.join(', ')} (P4·P10)` })
  }
  if (tally.tints.length > 0) {
    const lines = [...new Set(tally.tints)].sort((a, b) => a - b)
    push({ line: lines[0], lines, rule: 'tinted-surface', severity: 'warn', message: `옅은 색 면 ${lines.length}곳(${lines.slice(0, 8).join('·')}줄) — 연노랑·살구·연파랑 같은 바탕은 잘 만든 앱 화면의 87%에 없다`, fix: '면은 흰 면과 옅은 회색(--color-canvas)으로 나누고, 상태는 글자·아이콘 색으로. 옅은 색 바탕은 선택 상태 하나에 강조색으로만 (tone.md)' })
  }
  if (tally.hues.size >= HUE_LIMIT) {
    push({ line: firstLine(tally.hues), lines: linesOf(tally.hues), rule: 'hue-count', severity: 'warn', message: `유채색 계열 ${tally.hues.size}종(${list(tally.hues)}) — 잘 만든 서비스의 81%는 UI에 체계 색을 2종 이하로 쓴다`, fix: '무채색 + 강조색 하나(브랜드색) + 오류 빨강. 성공·주의·정보는 글자와 아이콘 모양으로 구분한다. 시세의 상승·하락 색은 --color-rise·--color-fall, 메달·코인 같은 보상 그림의 색은 --color-reward 변수로 두면 따로 센다 (tone.md)' })
  }
  if (tally.emoji.size > 0) {
    const lines = linesOf(tally.emoji)
    const count = [...tally.emoji.values()].flat().length
    push({ line: lines[0], lines, rule: 'emoji-icon', severity: 'warn', message: `이모지 ${count}개(${lines.length}줄, ${[...tally.emoji.keys()].slice(0, 5).join(' ')}) — 아이콘·사진 자리의 이모지는 기기마다 모양이 다르고 AI가 만든 화면의 표시다`, fix: '같은 크기·같은 선 굵기의 선 아이콘 한 벌(layout-principles/assets/icons.ts)로. 사진이 없으면 같은 비율의 옅은 바탕 칸 (tone.md)' })
  }
  if (tally.effects.length >= EFFECT_LIMIT) {
    const lines = [...tally.effects].sort((a, b) => a - b)
    push({ line: lines[0], lines: [...new Set(lines)], rule: 'effect-overuse', severity: 'warn', message: `강한 효과 ${lines.length}곳(${lines.slice(0, 8).join('·')}줄) — 그라데이션·유리·큰 그림자는 화면마다 한두 곳`, fix: '1순위 요소 한 곳에만 남기고 나머지는 단색 면·얇은 선·간격으로 (P3)' })
  }
}

/** 예외 주석을 단 줄은 파일 단위 요약(종류 수·계열 수·척도 밖 간격)에서도 뺀다 — 로고 그림의 브랜드색처럼 이유가 적힌 값이 요약을 다시 켜지 않게 */
const withoutIgnored = ({ tally, ignored }: { tally: Tally; ignored: Set<number> }): Tally => {
  const keep = (lines: number[]) => lines.filter((line) => !ignored.has(line))
  const keepMap = (map: Map<string, number[]>) => new Map([...map].map(([key, lines]) => [key, keep(lines)] as const).filter(([, lines]) => lines.length > 0))
  return {
    sizes: keepMap(tally.sizes),
    weights: keepMap(tally.weights),
    radii: keepMap(tally.radii),
    offScale: tally.offScale.filter((o) => !ignored.has(o.line)),
    effects: keep(tally.effects),
    tints: keep(tally.tints),
    hues: keepMap(tally.hues),
    emoji: keepMap(tally.emoji),
  }
}

/** 마크업(주석을 지운 JSX·HTML)의 이모지 — 줄마다 모은다 */
const collectEmoji = ({ markup, tally }: { markup: string; tally: Tally }) => {
  markup.split('\n').forEach((text, index) => {
    for (const match of text.matchAll(EMOJI)) remember({ map: tally.emoji, key: match[0], line: index + 1 })
  })
}

/** 상자로 정의된 CSS 클래스·요소 — 모든 소스에서 모은다(CSS 파일의 .card를 TSX의 className="card"가 쓰는 경우) */
const collectBoxKeys = (factsByFile: BlockFacts[][]) => {
  const keys = new Set<string>()
  for (const facts of factsByFile) {
    for (const fact of facts) {
      if (!fact.isBox) continue
      for (const selector of splitTopLevel(fact.block.fullSelector)) {
        const { last } = anatomyOf(selector)
        if (isExcludedCompound(last)) continue
        const key = last.classes[0] ? `.${last.classes[0]}` : last.tag
        if (key) keys.add(key)
      }
    }
  }
  return keys
}

export const auditLayout = (sources: Source[]): Finding[] => {
  const findings: Finding[] = []
  const prepared = sources.map((source) => {
    const parts = partsOf(source)
    const tally = newTally()
    return { source, parts, tally, facts: parts.css ? factsFor(parts.css) : [] }
  })
  const boxKeys = collectBoxKeys(prepared.map((p) => p.facts))
  const remBase = remBaseOf(prepared.flatMap((p) => p.facts))

  for (const { source, parts, tally, facts } of prepared) {
    if (!parts.css && !parts.markup) continue
    const ignored = ignoredLines({ text: source.text, marker: /layout-audit-ignore(?!-file)/ })
    const fileIgnored = new Set([...source.text.matchAll(/layout-audit-ignore-file:\s*([\w-]+)/g)].map((m) => m[1]))
    const push: Push = (finding) => {
      if (!ignored.has(finding.line) && !fileIgnored.has(finding.rule)) findings.push({ file: source.file, ...finding })
    }
    auditCssFacts({ facts, boxKeys, tally, push, remBase })
    if (parts.markup) {
      auditMarkup({ markup: parts.markup, boxKeys, tally, push, remBase })
      collectEmoji({ markup: parts.markup, tally })
    }
    summarizeTally({ tally: withoutIgnored({ tally, ignored }), push })
  }
  return sortFindings(findings)
}
