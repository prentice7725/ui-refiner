import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createHoldRepeat } from './createHoldRepeat'
import './quantity-stepper.css'

type QuantityStepperProps = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  /** 그룹의 접근성 이름 (예: "멸치국수 수량") */
  label?: string
  /**
   * 최솟값에서 한 번 더 줄이려 할 때. 주면 − 버튼이 최솟값에서도 살아 있고 "삭제"로 읽힌다
   * (장바구니에서 수량 1일 때 −를 누르면 항목을 빼는 관례).
   */
  onBelowMin?: () => void
  disabled?: boolean
  /** − / + 버튼의 이름 — 그룹 이름(label)을 받아 만든다. 기본은 "{label} 줄이기·삭제·늘리기" */
  buttonLabels?: StepperButtonLabels
}

type StepperButtonLabels = {
  decrease: (label: string) => string
  remove: (label: string) => string
  increase: (label: string) => string
}

const DEFAULT_BUTTON_LABELS: StepperButtonLabels = {
  decrease: (label) => `${label} 줄이기`,
  remove: (label) => `${label} 삭제`,
  increase: (label) => `${label} 늘리기`,
}

/** 소수 눈금(0.5 등)에서 부동소수 오차가 남지 않게 */
const decimalsOf = (step: number) => (String(step).split('.')[1] ?? '').length

/**
 * 수량 스테퍼 — 누르고 있으면 점점 빨라지며 올라간다.
 *
 * 숫자는 직접 입력할 수도 있다. 20을 맞추려고 버튼을 열아홉 번 누르게 하지 않기 위한 것으로,
 * 입력이 끝나면(blur·Enter) 눈금과 범위에 맞춰 정리된다.
 */
export const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  label = '수량',
  onBelowMin,
  disabled = false,
  buttonLabels = DEFAULT_BUTTON_LABELS,
}: QuantityStepperProps) => {
  const [draft, setDraft] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)
  const directionRef = useRef<'up' | 'down'>('up')
  const valueRef = useRef(value)
  valueRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const atMin = value <= min
  const atMax = value >= max
  const deleteAtMin = atMin && Boolean(onBelowMin)

  const clamp = (next: number) => {
    // 순서가 중요하다: 먼저 범위로 가두고 눈금에 맞춘다.
    // 반대로 하면 999가 눈금에 맞은 뒤 최댓값으로 잘려, 눈금에 없는 값이 남는다.
    const bounded = Math.min(Math.max(next, min), max)
    const snapped = min + Math.round((bounded - min) / step) * step
    const onGrid = snapped > max ? min + Math.floor((max - min) / step) * step : snapped
    return Number(onGrid.toFixed(decimalsOf(step)))
  }

  const bump = (delta: number) => {
    const next = clamp(valueRef.current + delta)
    if (next === valueRef.current) return
    // 반복이 빠르면 React가 여러 번의 변경을 묶어 처리한다 — 다시 그려지기를 기다리면
    // 그동안의 반복이 모두 같은 값에서 출발해 한 번만 오른다. 그래서 즉시 기록한다.
    valueRef.current = next
    directionRef.current = delta > 0 ? 'up' : 'down'
    onChangeRef.current(next)
  }
  const bumpRef = useRef(bump)
  bumpRef.current = bump

  // 숫자가 바뀌면 방향대로 밀려 들어온다.
  // key로 다시 마운트시키지 않는 이유: 입력에 포커스를 둔 채 방향키를 누르면 포커스를 잃는다.
  // 대신 속성을 뗐다 붙여 애니메이션을 재시작한다(중간에 강제 리플로우가 있어야 재시작된다).
  const mounted = useRef(false)
  useLayoutEffect(
    function replayBump() {
      const input = inputRef.current
      if (!input) return
      if (!mounted.current) {
        mounted.current = true
        return // 처음 그려질 때는 연출하지 않는다
      }
      input.removeAttribute('data-bump')
      void input.offsetWidth
      input.setAttribute('data-bump', directionRef.current)
      const done = () => input.removeAttribute('data-bump')
      input.addEventListener('animationend', done, { once: true })
      return () => input.removeEventListener('animationend', done)
    },
    [value],
  )

  // 누르고 있는 동안 반복 — 버튼마다 하나씩, 언마운트·값 변화와 무관하게 유지된다
  const holdRef = useRef<{ up: ReturnType<typeof createHoldRepeat>; down: ReturnType<typeof createHoldRepeat> } | null>(null)
  if (!holdRef.current) {
    holdRef.current = {
      up: createHoldRepeat({ onRepeat: () => bumpRef.current(step) }),
      down: createHoldRepeat({ onRepeat: () => bumpRef.current(-step) }),
    }
  }

  useEffect(function stopOnUnmount() {
    const held = holdRef.current
    return () => {
      held?.up.stop()
      held?.down.stop()
    }
  }, [])

  const press = (delta: number) => {
    if (disabled) return
    if (delta < 0 && deleteAtMin) {
      onBelowMin?.()
      return
    }
    bump(delta) // 첫 실행은 누르는 즉시
    const held = delta > 0 ? holdRef.current?.up : holdRef.current?.down
    held?.start()
  }

  const release = () => {
    holdRef.current?.up.stop()
    holdRef.current?.down.stop()
  }

  const commitDraft = () => {
    if (draft === undefined) return
    const digits = draft.replace(/[^\d.-]/g, '')
    setDraft(undefined)
    // 빈 문자열은 Number()가 0으로 읽는다 — "곱빼기"를 0으로 받아 최솟값이 되면 안 된다
    if (digits === '') return
    const parsed = Number(digits)
    if (Number.isNaN(parsed)) return // 알아볼 수 없는 입력은 되돌린다
    const next = clamp(parsed)
    if (next !== value) {
      directionRef.current = next > value ? 'up' : 'down'
      onChange(next)
    }
  }

  const buttonProps = (delta: number) => ({
    type: 'button' as const,
    className: 'qty-button',
    // disabled 대신 aria-disabled — 포커스가 닿아야 "왜 더 못 줄이는지"를 알 수 있다
    'aria-disabled': disabled || (delta > 0 ? atMax : atMin && !deleteAtMin) ? ('true' as const) : undefined,
    onPointerDown: () => press(delta),
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
  })

  return (
    <div className="qty" role="group" aria-label={label} data-disabled={disabled ? 'true' : undefined}>
      <button {...buttonProps(-step)} aria-label={deleteAtMin ? buttonLabels.remove(label) : buttonLabels.decrease(label)}>
        {deleteAtMin ? (
          // 삭제는 휴지통 선 아이콘(layout-principles 아이콘 한 벌의 trash와 같은 Lucide 경로) — 이모지는 기기마다 모양·색이 달라 버튼 한 벌이 어긋난다
          <svg className="qty-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        ) : (
          '−'
        )}
      </button>

      <input
        ref={inputRef}
        className="qty-value"
        type="text"
        inputMode="numeric"
        aria-label={label}
        disabled={disabled}
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitDraft()
            event.currentTarget.blur()
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            bump(step)
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            bump(-step)
          }
        }}
      />

      <button {...buttonProps(step)} aria-label={buttonLabels.increase(label)}>
        +
      </button>
    </div>
  )
}
