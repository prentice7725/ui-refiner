import { type InputHTMLAttributes, type ReactNode } from 'react'
import './checkbox-radio.css'

type CheckboxProps = {
  label?: ReactNode
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

/**
 * 네이티브 체크박스를 숨기고 박스+SVG 체크마크를 그린다 — 포커스·Space·폼 제출은 브라우저 몫.
 * 체크마크 path 길이(약 24)를 stroke-dasharray로 두고 dashoffset을 당겨 "그려지는" 모션을 만든다.
 */
export const Checkbox = ({ label, className, ...inputProps }: CheckboxProps) => (
  <label className={className ? `check ${className}` : 'check'} data-kind="checkbox">
    <input type="checkbox" className="check-input" {...inputProps} />
    <span className="check-box" aria-hidden="true">
      <svg className="check-mark" viewBox="0 0 24 24">
        <path d="M4 12.5l5 5L20 7" />
      </svg>
    </span>
    {label && <span className="check-label">{label}</span>}
  </label>
)
