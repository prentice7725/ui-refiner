/**
 * 편집 후 검사 훅의 순수 로직 — 훅 입력에서 고친 파일을 찾고, 검사 결과를 훅 응답(종료 코드·출력)으로 바꾼다.
 * 입출력(stdin·파일 읽기·종료)은 post-edit-hook.mjs가 맡는다. 여기는 테스트할 수 있는 판단만 둔다.
 *
 * 두 도구의 입력이 다르다.
 *  - Claude Code(Write·Edit·MultiEdit): tool_input.file_path
 *  - Codex(apply_patch): tool_input.command에 패치 본문 — `*** Add File:`·`*** Update File:`·`*** Move to:` 줄에 경로가 있다
 * 응답은 같다. error는 종료 코드 2 + stderr(두 도구 모두 에이전트에게 돌려보낸다), warn은 종료 0 + additionalContext(참고만).
 *
 * 이번 편집이 바꾼 줄만 본다. 기존 프로젝트의 CSS에는 이미 규칙에 걸리는 줄이 흔하다(잘 만든 사이트들의 공개 CSS도 대부분 걸린다).
 * 파일 전체를 매번 막으면 상관없는 줄 때문에 편집마다 되돌아오고, 에이전트가 범위 밖 코드를 고치게 된다.
 *  - Claude Code: tool_response.structuredPatch(줄 번호가 있는 변경 덩어리). 새로 만든 파일(type create)은 전체
 *  - Codex: apply_patch 본문에서 그 파일 구간의 + 줄을 새 파일에서 찾는다. Add File은 전체
 */
import { isAbsolute, resolve } from 'node:path'
import type { Finding } from '../patterns/motion-audit/assets/auditCore.ts'

export type HookInput = {
  cwd?: string
  hook_event_name?: string
  tool_name?: string
  tool_input?: Record<string, unknown>
  tool_response?: unknown
}

/** 파일별로 이번 편집이 바꾼 줄(1부터). null은 "파일 전체가 새것"(새 파일·알 수 없음) */
export type ChangedLines = Map<string, Set<number> | null>

export type HookResponse = { exitCode: 0 | 2; stdout: string; stderr: string }

const PATCH_PATH = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm
const FILE_FIELDS = ['file_path', 'filePath', 'path']

/** 고친 파일(절대 경로) — 지운 파일은 빼고, Move는 옮기기 전·후를 모두 돌려준다(없는 파일은 호출 쪽이 거른다) */
export const editedFiles = ({ input, cwd }: { input: HookInput; cwd: string }) => {
  const base = typeof input.cwd === 'string' && input.cwd ? input.cwd : cwd
  const paths: string[] = []
  for (const [key, value] of Object.entries(input.tool_input ?? {})) {
    if (typeof value !== 'string') continue
    if (FILE_FIELDS.includes(key)) paths.push(value)
    else for (const match of value.matchAll(PATCH_PATH)) paths.push(match[1].trim())
  }
  return [...new Set(paths.map((path) => (isAbsolute(path) ? path : resolve(base, path))))]
}

type Hunk = { newStart?: number; lines?: string[] }

/** Claude Code의 변경 덩어리 → 새 파일에서 더해지거나 바뀐 줄 */
const fromStructuredPatch = (hunks: Hunk[]) => {
  const lines = new Set<number>()
  for (const hunk of hunks) {
    let line = hunk.newStart ?? 1
    for (const row of hunk.lines ?? []) {
      if (row.startsWith('+')) {
        lines.add(line)
        line += 1
      } else if (!row.startsWith('-') && !row.startsWith('\\')) line += 1
    }
  }
  return lines
}

/** 새 파일에서 주어진 줄들을 차례로 찾는다 — 같은 줄이 여러 번 나오면 앞에서 찾은 위치 다음부터 */
const locate = ({ wanted, text }: { wanted: string[]; text: string }) => {
  const rows = text.split('\n')
  const lines = new Set<number>()
  let from = 0
  for (const target of wanted) {
    const index = rows.indexOf(target, from)
    if (index < 0) continue
    lines.add(index + 1)
    from = index + 1
  }
  return lines
}

/** Codex 패치를 파일 구간으로 나눈다 — Move는 같은 구간에 새 경로를 더한다 */
const patchSections = ({ patch, base }: { patch: string; base: string }) => {
  const sections: Array<{ paths: string[]; added: boolean; rows: string[] }> = []
  let current: (typeof sections)[number] | null = null
  for (const row of patch.split('\n')) {
    const header = row.match(/^\*\*\* (Add File|Update File|Delete File|Move to): (.+)$/)
    if (header) {
      const path = isAbsolute(header[2].trim()) ? header[2].trim() : resolve(base, header[2].trim())
      if (header[1] === 'Move to' && current) current.paths.push(path)
      else {
        current = header[1] === 'Delete File' ? null : { paths: [path], added: header[1] === 'Add File', rows: [] }
        if (current) sections.push(current)
      }
    } else if (/^\*\*\* (Begin|End) Patch/.test(row)) current = null
    else if (current) current.rows.push(row)
  }
  return sections
}

/** 이번 편집이 이 파일에서 바꾼 줄 — 알 수 없거나 새 파일이면 null(전체를 새것으로 본다) */
export const changedLines = ({ input, file, text }: { input: HookInput; file: string; text: string }): Set<number> | null => {
  const response = (input.tool_response ?? {}) as { type?: string; structuredPatch?: Hunk[] }
  if (Array.isArray(response.structuredPatch)) {
    if (response.type === 'create') return null
    return fromStructuredPatch(response.structuredPatch)
  }
  const base = typeof input.cwd === 'string' && input.cwd ? input.cwd : '/'
  for (const value of Object.values(input.tool_input ?? {})) {
    if (typeof value !== 'string' || !/^\*\*\* (Add|Update) File:/m.test(value)) continue
    const section = patchSections({ patch: value, base }).find((s) => s.paths.includes(file))
    if (!section) continue
    if (section.added) return null
    return locate({ wanted: section.rows.filter((row) => row.startsWith('+')).map((row) => row.slice(1)), text })
  }
  const newString = (input.tool_input ?? {}).new_string
  if (typeof newString === 'string' && newString) {
    const start = text.indexOf(newString)
    if (start >= 0) {
      const first = text.slice(0, start).split('\n').length
      return new Set(Array.from({ length: newString.split('\n').length }, (_, k) => first + k))
    }
  }
  return null
}

/** 이 지적이 이번 편집과 겹치는가 — 지적한 줄이나, 파일 단위 요약이면 관여한 줄 중 하나라도 바뀌었으면 겹친다 */
const touchesEdit = ({ finding, changed }: { finding: Finding; changed?: ChangedLines }) => {
  if (!changed || !changed.has(finding.file)) return true
  const lines = changed.get(finding.file)
  if (lines == null) return true
  return lines.has(finding.line) || (finding.lines ?? []).some((line) => lines.has(line))
}

const IGNORE_GUIDE =
  '의도된 예외라면 그 줄 바로 위에 이유를 적은 주석을 둔다 — /* layout-audit-ignore: {규칙} — {이유} */ 또는 /* motion-audit-ignore: {규칙} — {이유} */'

const oneLine = (f: Finding) => `- ${f.file}:${f.line} ${f.rule} — ${f.message}`

const listWithRest = ({ findings, max }: { findings: Finding[]; max: number }) => {
  const lines = findings.slice(0, max).map(oneLine)
  if (findings.length > max) lines.push(`… 외 ${findings.length - max}건`)
  return lines.join('\n')
}

/** 검사 결과 → 훅 응답. 이번 편집이 만든 error는 막고(고친 뒤 계속), warn은 알리기만 하고, 그 밖에는 조용하다.
 * changed가 없으면 모든 지적을 이번 편집의 것으로 본다 */
export const hookResponse = ({ findings, changed, maxLines = 5 }: { findings: Finding[]; changed?: ChangedLines; maxLines?: number }): HookResponse => {
  const mine = findings.filter((finding) => touchesEdit({ finding, changed }))
  const errors = mine.filter((f) => f.severity === 'error')
  const warns = mine.filter((f) => f.severity === 'warn')
  const before = findings.filter((f) => f.severity === 'error' && !mine.includes(f)).length
  // 기존 error는 막지 않는다 — 이미 무언가를 알릴 때만 한 줄로 덧붙인다(편집마다 같은 소리를 내지 않게)
  const beforeNote = before > 0 ? `\n이 파일에는 이번 편집과 무관한 기존 error ${before}건이 더 있다 — 이번 작업 범위가 아니면 그대로 둔다.` : ''
  if (errors.length > 0) {
    const detail = errors.map((f) => `${f.file}:${f.line} [error] ${f.rule} — ${f.message}\n    → ${f.fix}`).join('\n')
    const warnPart = warns.length > 0 ? `\n\nwarn ${warns.length}건(판단해서 고친다):\n${listWithRest({ findings: warns, max: maxLines })}` : ''
    return { exitCode: 2, stdout: '', stderr: `suta 검사 — 방금 고친 줄에 error ${errors.length}건. 고친 뒤 계속한다.\n${detail}\n${IGNORE_GUIDE}${warnPart}${beforeNote}\n` }
  }
  if (warns.length > 0) {
    const additionalContext = `suta 검사 warn ${warns.length}건 — 편집은 유지된다. 원칙(layout-principles·motion-principles)을 보고 고칠지 판단한다.\n${listWithRest({ findings: warns, max: maxLines })}${beforeNote}`
    return { exitCode: 0, stdout: JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext } }), stderr: '' }
  }
  return { exitCode: 0, stdout: '', stderr: '' }
}
