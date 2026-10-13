#!/usr/bin/env node
/**
 * suta 통합 검사 CLI — 모션과 레이아웃 규칙을 한 번에 돌려 file:line으로 출력한다. 화면을 고친 뒤 이 명령 하나로 확인한다.
 *
 *   node audit.mjs src/                  # 폴더 재귀 (css·scss·less·ts·tsx·js·jsx·mjs·vue·svelte·html)
 *   node audit.mjs src/App.tsx src/app.css
 *   node audit.mjs src/ --json           # 기계가 읽을 JSON
 *   node audit.mjs src/ --warn-only      # warn만 — 기존 코드에 단계적으로 적용할 때(종료 코드 0)
 *   node audit.mjs src/ --errors-only    # error만 출력 — CI 로그를 짧게(요약 줄에는 warn 수도 나온다)
 *
 * 종료 코드: error가 하나라도 있으면 1, 사용법 오류 2, 아니면 0.
 * 요구: Node 22.18 이상(코어 .ts를 그대로 import한다). 그 이하는 `node --experimental-strip-types audit.mjs …`.
 * 의존성·빌드 폴더(node_modules·dist·build 등)와 테스트·타입 선언·압축 파일은 건너뛴다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { auditAll, formatFindings, isAuditTarget, summarize } from './auditAll.ts'

const args = process.argv.slice(2)
const json = args.includes('--json')
const warnOnly = args.includes('--warn-only')
const errorsOnly = args.includes('--errors-only')
const targets = args.filter((a) => !a.startsWith('--'))
if (targets.length === 0) {
  console.error('사용: node audit.mjs <폴더|파일> … [--json] [--warn-only] [--errors-only]')
  process.exit(2)
}

const collect = (path, out = []) => {
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path)) {
      const child = join(path, name)
      if (statSync(child).isDirectory() || isAuditTarget(child)) collect(child, out)
    }
  } else if (isAuditTarget(path)) {
    out.push({ file: path, text: readFileSync(path, 'utf8') })
  }
  return out
}

const sources = targets.flatMap((target) => collect(target))
const all = auditAll(sources)
const summary = summarize(all)
const shown = warnOnly ? all.filter((f) => f.severity === 'warn') : errorsOnly ? all.filter((f) => f.severity === 'error') : all

if (json) {
  console.log(JSON.stringify({ files: sources.length, ...summary, findings: shown }, null, 2))
} else {
  if (shown.length > 0) console.log(formatFindings(shown))
  console.log(`\n검사한 파일 ${sources.length}개 — error ${summary.errors}, warn ${summary.warnings}`)
}
process.exit(summary.errors > 0 && !warnOnly ? 1 : 0)
