import { type ReactNode } from 'react'
import { useSegmentedControl } from './useSegmentedControl'

type SegmentOption<V extends string> = {
  value: V
  label: ReactNode
}

type SegmentedControlProps<V extends string> = {
  /** 라디오 그룹 이름 — 같은 name끼리 배타 선택·화살표 이동을 브라우저가 처리한다 */
  name: string
  options: SegmentOption<V>[]
  value: V
  onChange: (value: V) => void
  /** 그룹의 접근 가능한 이름 (스크린 리더가 "면 종류, 라디오 그룹"으로 읽는다) */
  label?: string
  disabled?: boolean
  className?: string
}

/**
 * 네이티브 <input type="radio"> 그룹 + thumb 한 장.
 * 라디오를 시각적으로만 숨기고 라벨을 칸으로 쓰면 포커스·방향키 이동·폼 제출이 전부 브라우저 몫이다 —
 * 접근성을 직접 재구현하지 않는 것이 핵심 결정이다. thumb는 aria-hidden 장식이고 상태는 라디오가 들고 있다.
 */
export const SegmentedControl = <V extends string>({
  name,
  options,
  value,
  onChange,
  label,
  disabled,
  className,
}: SegmentedControlProps<V>) => {
  const activeIndex = options.findIndex((option) => option.value === value)
  const { registerSegment, thumbRef } = useSegmentedControl({ activeIndex })

  return (
    <div className={className ? `segmented ${className}` : 'segmented'} role="radiogroup" aria-label={label}>
      {options.map((option, index) => (
        <label key={option.value} ref={registerSegment(index)} className="segment">
          <input
            type="radio"
            className="segment-input"
            name={name}
            value={option.value}
            checked={option.value === value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          <span className="segment-label">{option.label}</span>
        </label>
      ))}
      <span ref={thumbRef} className="segment-thumb" aria-hidden="true" />
    </div>
  )
}
