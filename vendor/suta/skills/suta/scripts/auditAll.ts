/**
 * suta 통합 검사 — 모션(motion-audit)과 레이아웃(layout-audit) 검사를 한 번에 돌린다.
 * 에이전트가 화면을 고친 뒤 쓰는 단일 명령(audit.mjs)과 편집 후 검사 훅(post-edit-hook.mjs)이 함께 쓴다.
 * 두 검사의 결과 형식은 공통 코어(auditCore.ts)가 정본이라 그대로 합칠 수 있다.
 */
import { auditMotion } from '../patterns/motion-audit/assets/auditMotion.ts'
import { auditLayout } from '../patterns/layout-audit/assets/auditLayout.ts'
import { sortFindings, type Finding, type Source } from '../patterns/motion-audit/assets/auditCore.ts'

export type { Finding, Source } from '../patterns/motion-audit/assets/auditCore.ts'
export { formatFindings, summarize } from '../patterns/motion-audit/assets/auditCore.ts'

const TARGET = /\.(css|scss|less|tsx?|jsx?|mjs|cjs|vue|svelte|html?)$/i
const SKIPPED_DIR = /(^|[\\/])(node_modules|dist|build|\.git|coverage|\.next|\.nuxt|\.svelte-kit|out)([\\/]|$)/
// 테스트는 일부러 나쁜 예를 담기도 하고, 타입 선언·압축 파일은 사람이 고치는 코드가 아니다
const SKIPPED_FILE = /\.(test|spec)\.[cm]?[jt]sx?$|\.d\.ts$|\.min\.(css|js)$/i

/** 검사할 파일인가 — 스타일·마크업·스크립트 파일 중 의존성·빌드 폴더와 테스트·타입 선언·압축 파일을 뺀 것 */
export const isAuditTarget = (path: string) => TARGET.test(path) && !SKIPPED_DIR.test(path) && !SKIPPED_FILE.test(path)

/** 모션 + 레이아웃 — 각 검사가 확장자로 자기 대상을 고르므로 같은 소스를 둘 다에 넘긴다 */
export const auditAll = (sources: Source[]): Finding[] => sortFindings([...auditMotion(sources), ...auditLayout(sources)])
