import type { CSSProperties, ReactNode } from 'react'
import { circumference, clampProgress, dashOffset } from './ringGeometry'
import './progress-ring.css'

type RingArcProps = {
  /** 캔버스 중심 좌표(정사각형이므로 cx = cy) */
  center: number
  radius: number
  stroke: number
}

/** 트랙 원 + 진행 원 한 쌍. dasharray/offset은 부모의 --ring-* 변수를 읽는다 — ActivityRings와 공유 */
export const RingArc = ({ center, radius, stroke }: RingArcProps) => (
  <>
    <circle className="progress-ring-track" cx={center} cy={center} r={radius} strokeWidth={stroke} />
    <circle className="progress-ring-bar" cx={center} cy={center} r={radius} strokeWidth={stroke} />
  </>
)

type RingVarsInput = {
  radius: number
  progress: number
  color?: string
  trackColor?: string
}

/** 링 하나의 CSS 변수 묶음 — px 단위를 붙여야 stroke-dashoffset transition이 수치 보간을 한다 */
export const ringVars = ({ radius, progress, color, trackColor }: RingVarsInput) =>
  ({
    '--ring-circumference': `${circumference({ radius })}px`,
    '--ring-offset': `${dashOffset({ radius, progress })}px`,
    ...(color ? { '--ring-color': color } : {}),
    ...(trackColor ? { '--ring-track': trackColor } : {}),
  }) as CSSProperties

type ProgressRingProps = {
  /** 현재 값. undefined면 무한(indeterminate) 로딩 — 짧은 호가 돈다 */
  value?: number
  max?: number
  /** 캔버스 한 변(px) */
  size?: number
  /** 획 두께(px) */
  stroke?: number
  color?: string
  trackColor?: string
  /** 스크린 리더가 읽을 이름(aria-label) */
  label?: string
  className?: string
  /** 가운데 슬롯 — 퍼센트 숫자·아이콘 */
  children?: ReactNode
}

/**
 * 단일 진행 링. value가 바뀌면 CSS transition이 직전 위치에서 새 위치로 따라간다.
 * 목표 초과(value > max)는 링을 가득 찬 상태로 클램프하고 data-over="true"를 붙인다.
 */
export const ProgressRing = ({
  value,
  max = 100,
  size = 120,
  stroke = 12,
  color,
  trackColor,
  label = '진행률',
  className,
  children,
}: ProgressRingProps) => {
  const radius = size / 2 - stroke / 2
  const indeterminate = value === undefined
  const { progress, over } = clampProgress({ value: value ?? 0, max })
  const style = { width: size, height: size, ...ringVars({ radius, progress, color, trackColor }) }

  return (
    <div
      className={className ? `progress-ring ${className}` : 'progress-ring'}
      style={style}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      /* 실제 값을 그대로 전달한다 — 링만 시각적으로 클램프. valuenow가 없으면 ARIA상 indeterminate다 */
      aria-valuenow={indeterminate ? undefined : value}
      data-over={over ? 'true' : undefined}
      data-indeterminate={indeterminate ? 'true' : undefined}
    >
      <svg className="progress-ring-svg" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <RingArc center={size / 2} radius={radius} stroke={stroke} />
      </svg>
      {children !== undefined && <div className="progress-ring-center">{children}</div>}
    </div>
  )
}
