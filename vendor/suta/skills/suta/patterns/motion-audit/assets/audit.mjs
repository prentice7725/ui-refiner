#!/usr/bin/env node
/**
 * motion-audit CLI — 폴더·파일을 훑어 모션 규칙 위반을 file:line으로 출력한다.
 *
 *   node audit.mjs src/                 # 폴더 재귀 (css·scss·less·ts·tsx·js·jsx·vue·svelte)
 *   node audit.mjs src/styles.css App.tsx
 *   node audit.mjs src/ --json          # 기계가 읽을 JSON
 *   node audit.mjs src/ --warn-only     # warn만 (error 없이) — 기존 코드에 단계적으로 적용할 때
 *
 * 종료 코드: error가 하나라도 있으면 1 (CI·훅에서 게이트로 쓴다), 아니면 0.
 * 요구: Node 22.18 이상(코어 .ts를 그대로 import한다). 그 이하는 `node --experimental-strip-types audit.mjs …`.
 * node_modules·dist·build·.git 폴더는 건너뛴다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { auditMotion, formatFindings, summarize } from './auditMotion.ts'

const EXT = new Set(['.css', '.scss', '.less', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte'])
const SKIP = new Set(['node_modules', 'dist', 'build', '.git', 'coverage'])

const args = process.argv.slice(2)
const json = args.includes('--json')
const warnOnly = args.includes('--warn-only')
const targets = args.filter((a) => !a.startsWith('--'))
if (targets.length === 0) {
  console.error('사용: node audit.mjs <폴더|파일> … [--json] [--warn-only]')
  process.exit(2)
}

const collect = (path, out = []) => {
  const st = statSync(path)
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) if (!SKIP.has(name)) collect(join(path, name), out)
  } else if (EXT.has(extname(path))) {
    out.push({ file: path, text: readFileSync(path, 'utf8') })
  }
  return out
}

const sources = targets.flatMap((t) => collect(t))
let findings = auditMotion(sources)
if (warnOnly) findings = findings.filter((f) => f.severity === 'warn')
const summary = summarize(findings)

if (json) {
  console.log(JSON.stringify({ files: sources.length, ...summary, findings }, null, 2))
} else {
  if (findings.length > 0) console.log(formatFindings(findings))
  console.log(`\n검사한 파일 ${sources.length}개 — error ${summary.errors}, warn ${summary.warnings}`)
}
process.exit(summary.errors > 0 && !warnOnly ? 1 : 0)
