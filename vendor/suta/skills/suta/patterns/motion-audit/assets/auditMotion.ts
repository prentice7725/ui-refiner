/**
 * motion-audit 코어 — CSS·TSX·JS 소스 텍스트를 훑어 모션 규칙 위반을 `file:line`으로 찾는다 (의존성 0, DOM 없음).
 *
 * 왜 스크립트인가: "애니메이션이 괜찮은가"는 눈으로 보면 주관이 섞이지만, 아래 규칙들은 텍스트만으로
 * 결정적으로 판정된다. 에이전트가 파일을 하나씩 읽어 판단하는 것보다 빠르고 빠뜨리지 않는다.
 * 브라우저에서도 같은 함수를 쓴다(데모가 붙여 넣은 CSS를 즉시 검사).
 *
 * 규칙 (id — 심각도 — 무엇을 잡는가):
 *  layout-animation   error — transition/animation 대상이 width·height·top·left·margin·padding 등 레이아웃 속성
 *  transition-all     error — transition: all (의도치 않은 속성까지 움직이고, 레이아웃 속성이 섞인다)
 *  no-reduced-motion  error — 움직임이 있는 파일에 prefers-reduced-motion 블록이 없다
 *  duration-range     warn  — transition 시간이 60ms 미만(안 보임)이거나 700ms 초과(기다림). animation은 반복용이라 상한만 2000ms
 *  linear-movement    warn  — transform/translate 이동에 linear 이징 (기계적으로 보인다. 진행률·스피너에만)
 *  ease-in-exit       warn  — 퇴장/닫힘 상태(exiting·closing·leave·out·hide)에 ease-in (첫 순간이 늦어 굼뜨다)
 *  infinite-loop      warn  — 무한 반복 애니메이션. reduced-motion에서 멈추거나 느려지는지 확인
 *  js-interval-anim   warn  — setInterval로 style을 갱신 (프레임과 어긋난다. requestAnimationFrame 또는 CSS)
 *  will-change-global warn  — will-change가 상시 선언 (메모리를 잡아 둔다. 움직이기 직전에만)
 *
 * 의도적 예외: 그 줄(또는 바로 앞 줄)에 `motion-audit-ignore: {규칙} — {이유}` 주석을 두면 그 줄의 지적을 건너뛴다.
 * 예외에는 반드시 이유를 적는다 — 다음 사람이 규칙을 되살릴지 판단할 근거다.
 */

import { blank, blankComments, cssBlocks, declarationsOf, ignoredLines, lineOf, sortFindings, type Finding, type Source } from './auditCore.ts'

// 결과 형식은 공통 코어(auditCore.ts)가 정본이다 — layout-audit와 결과를 합칠 수 있게 같은 형식을 쓴다
export type { Finding, Severity } from './auditCore.ts'
export { formatFindings, summarize } from './auditCore.ts'

const LAYOUT_PROPS = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'border-width', 'font-size', 'line-height', 'inset', 'max-height', 'min-height', 'gap']
const LAYOUT_RE = new RegExp(`(^|[\\s,])(${LAYOUT_PROPS.map((p) => p.replace('-', '\\-')).join('|')})(?=\\s|$|,)`, 'i')
const MOTION_HINT = /transition|animation|@keyframes/i
const EXIT_STATE = /exit|closing|closed|leave|hide|hidden|out\b|dismiss|collaps/i

const isCss = (file: string) => /\.(css|scss|less|vue|svelte)$/i.test(file)
const isScript = (file: string) => /\.(tsx?|jsx?|mjs|cjs|vue|svelte)$/i.test(file)

/** `transition: transform 250ms ease, opacity 250ms` → 각 항목의 속성·시간·이징 */
const parseTransition = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const tokens = part.split(/\s+/)
      const prop = tokens[0]
      const durations = tokens.filter((t) => /^[\d.]+m?s$/i.test(t)).map(toMs)
      const easing = tokens.find((t) => /^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier|steps)/i.test(t)) ?? ''
      return { prop, durationMs: durations[0], easing }
    })

const toMs = (t: string) => (/ms$/i.test(t) ? parseFloat(t) : parseFloat(t) * 1000)

export const auditMotion = (sources: Source[]): Finding[] => {
  const findings: Finding[] = []
  const push = (f: Omit<Finding, 'file'> & { file: string }) => findings.push(f)

  for (const { file, text } of sources) {
    if (isCss(file)) auditCss({ file, text, push })
    if (isScript(file)) auditScript({ file, text, push })
  }
  return sortFindings(findings)
}

const auditCss = ({ file, text, push: rawPush }: Source & { push: (f: Finding) => void }) => {
  const ignored = ignoredLines({ text, marker: /motion-audit-ignore/ })
  const push = (f: Finding) => {
    if (!ignored.has(f.line)) rawPush(f)
  }
  // 주석 속 단어("transition을 두지 않는다")에 속지 않게 주석을 지운 본문으로 판단한다
  const code = blankComments(text)
  const hasMotion = MOTION_HINT.test(code)
  if (!hasMotion) return
  const blocks = cssBlocks(text)
  // reduced-motion 블록이 animation을 다루면(none·느리게) 무한 반복은 이미 처리된 것이다
  const reducedHandlesAnimation = blocks.some((b) => b.inReducedMotion && /animation/i.test(b.body))
  if (!/prefers-reduced-motion/.test(code)) {
    push({
      file,
      line: lineOf(code, code.search(MOTION_HINT)),
      // 움직임을 선언한 줄 전체 — 편집 후 훅은 이 중 하나를 고친 편집에만 이 지적을 돌려준다
      lines: code.split('\n').flatMap((row, index) => (MOTION_HINT.test(row) ? [index + 1] : [])),
      rule: 'no-reduced-motion',
      severity: 'error',
      message: '움직임이 있는데 prefers-reduced-motion 블록이 없다',
      fix: '@media (prefers-reduced-motion: reduce) { … } 에서 이동·확대를 끄고 페이드만 남긴다 (모든 suta 패턴 CSS 하단 블록 참고)',
    })
  }

  for (const block of blocks) {
    for (const { prop, value, line } of declarationsOf(block)) {
      if (prop === 'transition' || prop === 'transition-property') {
        for (const item of parseTransition(value)) {
          if (item.prop === 'all') {
            push({ file, line, rule: 'transition-all', severity: 'error', message: 'transition: all — 어떤 속성이 움직일지 정하지 않았다', fix: 'transform·opacity 등 움직일 속성을 이름으로 나열한다' })
            continue
          }
          if (LAYOUT_RE.test(item.prop)) {
            push({ file, line, rule: 'layout-animation', severity: 'error', message: `${item.prop}를 transition — 매 프레임 레이아웃이 돈다`, fix: layoutFix(item.prop) })
          }
          // 0ms는 "전이 없음"의 관용 표현(visibility 지연 등)이라 범위 검사에서 뺀다
          if (item.durationMs != null && item.durationMs !== 0 && !block.inReducedMotion && (item.durationMs < 60 || item.durationMs > 700)) {
            push({ file, line, rule: 'duration-range', severity: 'warn', message: `transition ${item.durationMs}ms — 60~700ms 밖 (motion-principles: 100~420ms)`, fix: '작은 요소 150ms, 컴포넌트 250ms, 화면 크기 350ms, 페이지 420ms (motion-principles 토큰)' })
          }
          if (/^linear$/i.test(item.easing) && /transform|translate|scale|rotate/.test(item.prop)) {
            push({ file, line, rule: 'linear-movement', severity: 'warn', message: `${item.prop} 이동에 linear 이징 — 기계적으로 보인다`, fix: '들어오는 이동은 ease-out(cubic-bezier(0.22, 1, 0.36, 1)). linear는 진행률·스피너에만' })
          }
          if (/^ease-in$|cubic-bezier\(\s*0\.[4-9]/i.test(item.easing) && EXIT_STATE.test(block.selector) && !/ease-in-out/i.test(item.easing)) {
            push({ file, line, rule: 'ease-in-exit', severity: 'warn', message: '퇴장 상태에 ease-in — 첫 순간이 늦어 굼뜨게 느껴진다', fix: '퇴장도 ease-out, 시간은 진입의 3/4' })
          }
        }
      }

      if (prop === 'animation' || prop === 'animation-iteration-count') {
        if (/\binfinite\b/i.test(value) && !block.inReducedMotion && !reducedHandlesAnimation) {
          push({ file, line, rule: 'infinite-loop', severity: 'warn', message: '무한 반복 애니메이션', fix: 'reduced-motion에서 animation을 멈추거나 느린 페이드로 바꾼다 (skeleton 패턴의 맥동 완화 참고)' })
        }
        const dur = value.match(/(?:^|\s)([\d.]+m?s)(?=\s|$)/)?.[1]
        if (prop === 'animation' && dur && !block.inReducedMotion && toMs(dur) > 2000 && !/infinite/i.test(value)) {
          push({ file, line, rule: 'duration-range', severity: 'warn', message: `animation ${toMs(dur)}ms — 2초를 넘는 단발 애니메이션`, fix: '단발 연출은 700ms 안에. 길게 보여야 하면 사용자가 멈출 수 있게' })
        }
      }

      if (prop === 'will-change' && !/auto/i.test(value) && !/:hover|:active|:focus|\[data-/.test(block.selector)) {
        push({ file, line, rule: 'will-change-global', severity: 'warn', message: 'will-change 상시 선언 — GPU 레이어를 계속 잡아 둔다', fix: '움직이기 직전 상태(:hover·[data-state])에서만 선언하거나 제거' })
      }
    }
  }

  // @keyframes 안의 레이아웃 속성
  const kf = /@keyframes[^{]*\{([\s\S]*?)\}\s*\}/g
  let m: RegExpExecArray | null
  while ((m = kf.exec(text))) {
    const body = m[1]
    const inner = /([a-z-]+)\s*:/gi
    const reported = new Set<string>() // 같은 속성은 keyframes 블록당 한 번만
    let d: RegExpExecArray | null
    while ((d = inner.exec(body))) {
      const p = d[1].toLowerCase()
      if (LAYOUT_PROPS.includes(p) && !reported.has(p)) {
        reported.add(p)
        push({ file, line: lineOf(text, m.index + d.index), rule: 'layout-animation', severity: 'error', message: `@keyframes에서 ${p} 변경 — 매 프레임 레이아웃이 돈다`, fix: layoutFix(p) })
      }
    }
  }
}

const layoutFix = (prop: string) => {
  if (/height|max-height|min-height/.test(prop)) return '높이 변화는 grid-template-rows: 0fr→1fr (accordion 패턴) 또는 transform: scaleY'
  if (/width/.test(prop)) return '폭 변화는 transform: scaleX + transform-origin (tab-indicator 패턴)'
  if (/top|left|right|bottom|inset|margin/.test(prop)) return '위치 이동은 transform: translate (flip-list의 FLIP 기법)'
  if (/padding|gap/.test(prop)) return '간격 변화는 안쪽 요소의 transform으로'
  if (/font-size|line-height/.test(prop)) return '글자 크기는 transform: scale (floating-label 패턴)'
  return 'transform·opacity로 바꾼다'
}

/** 실행되지 않는 글을 같은 길이의 공백으로 지운다 — 주석과 템플릿 문자열(화면에 보여 주는 예시 코드·마크업 문자열).
 * 문서·데모 페이지의 예시 코드에 편집 후 훅이 걸려 에이전트를 멈추지 않게 한다. 줄 번호는 그대로다.
 * `https://`의 `//`는 주석이 아니므로 바로 앞이 `:`이면 남긴다 */
const scriptCode = (text: string) =>
  blankComments(text)
    .split('\n')
    .map((line) => line.replace(/(^|[^:\\])\/\/.*$/, (all: string, lead: string) => lead + blank(all.slice(lead.length))))
    .join('\n')
    .replace(/`(?:\\.|[^`\\])*`/g, blank)

const auditScript = ({ file, text, push: rawPush }: Source & { push: (f: Finding) => void }) => {
  const ignored = ignoredLines({ text, marker: /motion-audit-ignore/ })
  const push = (f: Finding) => {
    if (!ignored.has(f.line)) rawPush(f)
  }
  const code = scriptCode(text)
  const interval = /setInterval\s*\(/g
  let m: RegExpExecArray | null
  while ((m = interval.exec(code))) {
    const window = code.slice(m.index, m.index + 400)
    if (/\.style\.|transform|opacity|scrollTop|scrollLeft/.test(window)) {
      push({ file, line: lineOf(code, m.index), rule: 'js-interval-anim', severity: 'warn', message: 'setInterval로 스타일을 갱신 — 프레임과 어긋나 끊긴다', fix: 'requestAnimationFrame 루프(count-up·spring-physics 코어) 또는 CSS transition' })
    }
  }
  // 인라인 스타일로 레이아웃 속성을 애니메이션(프레임 루프 안에서 top/left/width/height 갱신)
  const layoutWrite = /\.style\.(top|left|width|height|marginLeft|marginTop)\s*=/g
  while ((m = layoutWrite.exec(code))) {
    const before = code.slice(Math.max(0, m.index - 600), m.index)
    if (/requestAnimationFrame|setInterval|onUpdate|tick/.test(before)) {
      push({ file, line: lineOf(code, m.index), rule: 'layout-animation', severity: 'error', message: `프레임 루프에서 style.${m[1]} 갱신 — 매 프레임 레이아웃이 돈다`, fix: 'style.transform = translate()/scale()로 바꾼다' })
    }
  }
}
