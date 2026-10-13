#!/usr/bin/env node
/**
 * suta 편집 후 검사 훅 — 에이전트가 파일을 고친 직후, 그 파일에 모션·레이아웃 검사를 돌린다.
 *   Claude Code: 플러그인 매니페스트(.claude-plugin/plugin.json)의 PostToolUse(Write·Edit·MultiEdit)
 *   Codex:       플러그인 매니페스트(.codex-plugin/plugin.json)의 PostToolUse(apply_patch) — /hooks에서 승인해야 돈다
 *
 * - 이번 편집이 바꾼 줄만 본다. 파일에 원래 있던 위반은 막지 않는다(기존 프로젝트의 CSS를 고칠 때마다 상관없는 줄로 되돌아오지 않게).
 * - 바꾼 줄에 error가 있으면 종료 코드 2 + stderr. 두 도구 모두 이 내용을 에이전트에게 돌려보내 바로 고치게 한다(편집은 이미 적용됐다).
 * - warn만 있으면 종료 0 + JSON additionalContext. 에이전트가 참고만 한다.
 * - 문제가 없으면 아무것도 출력하지 않는다.
 * - 훅이 실패해도 편집을 막지 않는다. SUTA_HOOK=off, 입력 해석 실패, Node 22.18 미만(.ts를 못 읽음)이면 조용히 종료 0.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { relative } from 'node:path'

if (process.env.SUTA_HOOK === 'off') process.exit(0)

const readStdin = async () => {
  let data = ''
  for await (const chunk of process.stdin) data += chunk
  return data
}

try {
  const input = JSON.parse(await readStdin())
  // 동적 import — Node가 .ts를 못 읽는 환경이면 여기서 실패하고, 아래 catch가 조용히 끝낸다
  const { changedLines, editedFiles, hookResponse } = await import('./hookCore.ts')
  const { auditAll, isAuditTarget } = await import('./auditAll.ts')
  const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd()
  const files = editedFiles({ input, cwd }).filter((file) => isAuditTarget(file) && existsSync(file) && statSync(file).isFile())
  if (files.length === 0) process.exit(0)
  // 결과에는 작업 폴더 기준 경로를 보인다. 작업 폴더 밖의 파일이면 절대 경로 그대로
  const shown = (file) => {
    const rel = relative(cwd, file)
    return rel && !rel.startsWith('..') ? rel : file
  }
  const sources = files.map((file) => ({ path: file, file: shown(file), text: readFileSync(file, 'utf8') }))
  const changed = new Map(sources.map((source) => [source.file, changedLines({ input, file: source.path, text: source.text })]))
  const { exitCode, stdout, stderr } = hookResponse({ findings: auditAll(sources), changed })
  if (stdout) process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)
  process.exitCode = exitCode
} catch {
  process.exitCode = 0
}
