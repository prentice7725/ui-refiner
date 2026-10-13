import { useEffect, useId, useRef, useState } from 'react'
import { moveHighlight } from './selectCore'
import './select.css'

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  options: SelectOption[]
  /** 선택된 값 — 없으면 null (placeholder 표시) */
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  /** 콤보박스의 이름(예: "면 종류"). 콤보박스는 안의 글자를 이름으로 쓰지 않는다 — 없으면 placeholder가 이름이 된다 */
  label?: string
  /** 화면에 보이는 라벨 요소의 id — 있으면 label보다 먼저 쓴다 */
  labelledBy?: string
  className?: string
}

/**
 * WAI-ARIA "select-only combobox" 패턴 — 포커스는 항상 트리거 버튼에 있고,
 * 활성 옵션은 aria-activedescendant로만 가리킨다(옵션으로 포커스를 옮기지 않는다).
 * 키보드 판정은 selectCore.ts의 순수 함수가 담당한다.
 */
export const Select = ({ options, value, onChange, placeholder = '선택', label, labelledBy, className }: SelectProps) => {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const baseId = useId()
  const optionId = (index: number) => `${baseId}-option-${index}`

  const selected = options.find((option) => option.value === value) ?? null

  const openPanel = () => {
    const selectedIndex = options.findIndex((option) => option.value === value)
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const commit = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault() // 버튼 기본 동작(click 발화)과 겹치지 않게
        openPanel()
      }
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'Tab') {
      setOpen(false) // 포커스가 떠나는 키 — 닫되 이동은 막지 않는다
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      commit(highlight)
      return
    }
    const next = moveHighlight({ index: highlight, count: options.length, key: event.key })
    if (next !== highlight) {
      event.preventDefault() // 화살표의 페이지 스크롤을 막는다
      setHighlight(next)
    }
  }

  useEffect(
    function closeOnOutsidePointer() {
      if (!open) return
      const handlePointerDown = (event: PointerEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
      }
      window.addEventListener('pointerdown', handlePointerDown)
      return () => window.removeEventListener('pointerdown', handlePointerDown)
    },
    [open],
  )

  useEffect(
    function scrollHighlightIntoView() {
      if (!open || highlight < 0) return
      document.getElementById(optionId(highlight))?.scrollIntoView?.({ block: 'nearest' })
    },
    [open, highlight],
  )

  return (
    <div ref={rootRef} className={className ? `select ${className}` : 'select'}>
      <button
        type="button"
        className="select-trigger"
        role="combobox"
        aria-label={labelledBy ? undefined : (label ?? placeholder)}
        aria-labelledby={labelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-listbox`}
        aria-activedescendant={open && highlight >= 0 ? optionId(highlight) : undefined}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleTriggerKeyDown}
      >
        {selected ? (
          <span>{selected.label}</span>
        ) : (
          <span className="select-placeholder">{placeholder}</span>
        )}
        <svg className="select-chevron" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        id={`${baseId}-listbox`}
        className="select-panel"
        role="listbox"
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            id={optionId(index)}
            role="option"
            className="select-option"
            aria-selected={option.value === value}
            data-highlighted={index === highlight ? 'true' : 'false'}
            onPointerEnter={() => setHighlight(index)}
            onClick={() => commit(index)}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
