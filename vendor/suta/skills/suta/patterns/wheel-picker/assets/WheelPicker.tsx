import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { createWheel, type WheelHandle } from './createWheel'
import './wheel-picker.css'

export type WheelOption = {
  value: string
  label: string
}

type WheelPickerProps = {
  options: WheelOption[]
  value: string
  onChange: (value: string) => void
  /** 항목 높이(px). 기본 36 — CSS 변수 --wheel-item-height와 동기 */
  itemHeight?: number
  /** 보이는 칸 수(홀수). 기본 5 — CSS 변수 --wheel-visible과 동기 */
  visibleCount?: number
  'aria-label'?: string
  'aria-labelledby'?: string
  className?: string
}

/**
 * createWheel 코어의 React 래퍼 — 값(value)은 부모가 소유하는 제어 컴포넌트.
 * 스크롤이 멎어 가운데 항목이 바뀌면 onChange(value), 밖에서 value가 바뀌면 그 위치로 스크롤한다.
 * 항목 높이·보이는 칸 수는 CSS 변수로 내려보내 코어와 CSS가 같은 숫자를 본다.
 */
export const WheelPicker = ({ options, value, onChange, itemHeight, visibleCount, className, ...aria }: WheelPickerProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const wheelRef = useRef<WheelHandle | null>(null)
  const baseId = useId()
  // 최신 콜백·옵션을 ref로 들고 있어 인라인 함수를 넘겨도 코어가 재생성되지 않는다
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const optionsRef = useRef(options)
  optionsRef.current = options
  const valueRef = useRef(value)
  valueRef.current = value

  const optionId = (index: number) => `${baseId}-option-${index}`
  const selectedIndex = options.findIndex((option) => option.value === value)

  useEffect(
    function attachWheel() {
      const track = trackRef.current
      if (!track) return
      const wheel = createWheel({
        container: track,
        itemHeight,
        onChange: (index) => {
          const option = optionsRef.current[index]
          if (option && option.value !== valueRef.current) onChangeRef.current(option.value)
        },
      })
      wheelRef.current = wheel
      // 첫 배치는 애니메이션 없이 — 0에서 굴러오는 가짜 이동을 막는다
      const initial = optionsRef.current.findIndex((option) => option.value === valueRef.current)
      wheel.setIndex(Math.max(0, initial), { behavior: 'instant' })
      return () => {
        wheel.destroy()
        wheelRef.current = null
      }
    },
    [itemHeight, options.length],
  )

  useEffect(
    function scrollToExternalValue() {
      const wheel = wheelRef.current
      if (!wheel || selectedIndex < 0 || wheel.getIndex() === selectedIndex) return
      wheel.setIndex(selectedIndex)
    },
    [selectedIndex],
  )

  const vars = {
    ...(itemHeight !== undefined ? { '--wheel-item-height': `${itemHeight}px` } : {}),
    ...(visibleCount !== undefined ? { '--wheel-visible': visibleCount } : {}),
  } as CSSProperties

  return (
    <div className={className ? `wheel ${className}` : 'wheel'} style={vars}>
      <div ref={trackRef} className="wheel-track" role="listbox" tabIndex={0} aria-label={aria['aria-label']} aria-labelledby={aria['aria-labelledby']}>
        {options.map((option, index) => (
          <div key={option.value} id={optionId(index)} className="wheel-item" role="option" aria-selected={index === selectedIndex}>
            {option.label}
          </div>
        ))}
      </div>
    </div>
  )
}
