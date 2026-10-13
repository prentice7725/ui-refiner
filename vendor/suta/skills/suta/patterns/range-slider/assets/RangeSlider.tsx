import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { clampPair, lowerOnTop, nearerHandle, snapValue, toPercent, valueAtPercent } from './rangeValues'
import './range-slider.css'

export type RangeValue = { lower: number; upper: number }

type RangeSliderProps = {
  min: number
  max: number
  step?: number
  value: RangeValue
  onChange: (next: RangeValue) => void
  /** 두 값 사이 최소 간격 (기본 0) */
  minDistance?: number
  /** 각 손잡이의 접근성 이름 */
  label?: { lower: string; upper: string }
  /** 스크린 리더가 읽을 값 문구 — "12000" 대신 "12,000원"으로 읽히게 한다 */
  format?: (value: number) => string
  className?: string
}

/**
 * 두 손잡이 범위 슬라이더.
 *
 * **네이티브 `<input type="range">` 두 개를 겹쳐 놓았다.** 직접 그린 div로 만들면
 * 키보드 조작·스크린 리더·터치·고대비 모드를 전부 다시 만들어야 하는데, 네이티브를 쓰면 공짜다.
 * 화면에 보이는 트랙과 채움은 별도 요소이고, input 자신은 투명하게 만들어 손잡이만 남긴다.
 *
 * 값의 규칙(눈금·경계·교차)은 rangeValues가, 모양은 CSS가 담당한다.
 */
export const RangeSlider = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  minDistance = 0,
  label = { lower: '최솟값', upper: '최댓값' },
  format,
  className,
}: RangeSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null)

  const commit = ({ next, moved }: { next: number; moved: 'lower' | 'upper' }) => {
    const snapped = snapValue({ value: next, min, max, step })
    const pair = moved === 'lower' ? { lower: snapped, upper: value.upper } : { lower: value.lower, upper: snapped }
    onChange(clampPair({ ...pair, moved, minDistance }))
  }

  /** 트랙을 누르면 가까운 손잡이가 그 자리로 온다 — 손잡이를 정확히 집지 않아도 조작할 수 있다 */
  const onTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track || (event.target as HTMLElement).tagName === 'INPUT') return
    const rect = track.getBoundingClientRect()
    const percent = ((event.clientX - rect.left) / rect.width) * 100
    const next = valueAtPercent({ percent, min, max, step })
    commit({ next, moved: nearerHandle({ value: next, lower: value.lower, upper: value.upper }) })
  }

  const vars = {
    '--range-lower': `${toPercent({ value: value.lower, min, max })}%`,
    '--range-upper': `${toPercent({ value: value.upper, min, max })}%`,
  } as CSSProperties

  const inputProps = (handle: 'lower' | 'upper') => ({
    type: 'range' as const,
    className: 'range-input',
    min,
    max,
    step,
    value: value[handle],
    'aria-label': label[handle],
    // 숫자만 읽으면 "12000"이 된다 — 단위까지 읽히게 문구를 준다
    'aria-valuetext': format?.(value[handle]),
    onChange: (event: { target: { value: string } }) => commit({ next: Number(event.target.value), moved: handle }),
  })

  return (
    <div
      ref={trackRef}
      className={className ? `range-root ${className}` : 'range-root'}
      style={vars}
      data-on-top={lowerOnTop({ lower: value.lower, upper: value.upper, min, max }) ? 'lower' : 'upper'}
      onPointerDown={onTrackPointerDown}
    >
      <div className="range-track" aria-hidden="true" />
      <input {...inputProps('lower')} data-handle="lower" />
      <input {...inputProps('upper')} data-handle="upper" />
    </div>
  )
}
