import { clampProgress, ringRadii } from './ringGeometry'
import { RingArc, ringVars } from './ProgressRing'
import './progress-ring.css'

export type ActivityRingItem = {
  value: number
  max?: number
  color: string
  /** 스크린 리더가 읽을 이름 — 링마다 개별 progressbar이므로 반드시 다르게 */
  label: string
  trackColor?: string
}

type ActivityRingsProps = {
  /** 배열 순서 = 바깥에서 안쪽 */
  rings: ActivityRingItem[]
  size?: number
  stroke?: number
  /** 링 사이 간격(px) */
  gap?: number
  className?: string
}

/**
 * 겹친 다중 링(3중 링). SVG 하나에 링을 바깥부터 안쪽으로 쌓고,
 * 각 링을 <g role="progressbar">로 감싸 보조기기에는 링 개수만큼의 진행 표시로 읽힌다.
 * 각 링의 색·offset은 <g>에 건 --ring-* 변수를 자식 <circle>이 상속해 쓴다.
 */
export const ActivityRings = ({ rings, size = 160, stroke = 14, gap = 4, className }: ActivityRingsProps) => {
  const radii = ringRadii({ size, stroke, gap, count: rings.length })

  return (
    <div className={className ? `progress-ring ${className}` : 'progress-ring'} style={{ width: size, height: size }}>
      <svg className="progress-ring-svg" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {rings.map((ring, index) => {
          const max = ring.max ?? 100
          const { progress, over } = clampProgress({ value: ring.value, max })
          return (
            <g
              key={ring.label}
              className="progress-ring-layer"
              style={ringVars({ radius: radii[index], progress, color: ring.color, trackColor: ring.trackColor })}
              role="progressbar"
              aria-label={ring.label}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={ring.value}
              data-over={over ? 'true' : undefined}
            >
              <RingArc center={size / 2} radius={radii[index]} stroke={stroke} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
