/**
 * 파일 검증 (의존성 0, DOM 없음).
 *
 * 끌어다 놓기는 화면 밖에서 무엇이든 들어올 수 있는 통로다 — 20MB짜리 동영상도, .exe도,
 * 한 번에 300장도 들어온다. 받기 전에 거르되, **왜 거절했는지**를 함께 돌려준다.
 * "업로드 실패"만 뜨는 화면에서 사용자는 무엇을 고쳐야 할지 알 수 없다.
 */

export type RejectionReason = 'type' | 'size' | 'count'
export type FileRejection = { file: File; reason: RejectionReason }

type Constraints = {
  /** input의 accept와 같은 형식: "image/*,.pdf,image/png". 없으면 형식을 따지지 않는다 */
  accept?: string
  maxSizeBytes?: number
  maxFiles?: number
  /** 이미 담겨 있는 개수 — maxFiles는 그것까지 합쳐 센다 */
  currentCount?: number
}

/** accept 한 조각과 파일이 맞는지 — "image/*", ".png", "image/png" 세 가지 형식을 지원한다 */
const matchesRule = ({ file, rule }: { file: File; rule: string }) => {
  const trimmed = rule.trim().toLowerCase()
  if (trimmed === '') return false
  if (trimmed.startsWith('.')) return file.name.toLowerCase().endsWith(trimmed)
  if (trimmed.endsWith('/*')) return file.type.toLowerCase().startsWith(trimmed.slice(0, -1))
  return file.type.toLowerCase() === trimmed
}

export const matchesAccept = ({ file, accept }: { file: File; accept?: string }) =>
  !accept ? true : accept.split(',').some((rule) => matchesRule({ file, rule }))

/**
 * 받을 것과 거절할 것을 나눈다.
 * 개수 제한은 **하나씩 세면서** 적용한다 — 열 장을 놓았는데 다섯 장만 남는 자리가 있으면
 * 앞의 다섯 장은 받고 나머지만 거절한다(전부 거절하면 사용자는 다시 처음부터 골라야 한다).
 */
export const validateFiles = ({
  files,
  accept,
  maxSizeBytes,
  maxFiles,
  currentCount = 0,
}: Constraints & { files: File[] }) => {
  const accepted: File[] = []
  const rejected: FileRejection[] = []
  let count = currentCount

  for (const file of files) {
    if (!matchesAccept({ file, accept })) {
      rejected.push({ file, reason: 'type' })
      continue
    }
    if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
      rejected.push({ file, reason: 'size' })
      continue
    }
    if (maxFiles !== undefined && count >= maxFiles) {
      rejected.push({ file, reason: 'count' })
      continue
    }
    accepted.push(file)
    count += 1
  }

  return { accepted, rejected }
}

/** 사람이 읽는 크기 — 거절 사유 문구에 쓴다 */
export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}${units[unit]}`
}
