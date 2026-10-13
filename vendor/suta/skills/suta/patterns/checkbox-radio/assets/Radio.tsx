import { type InputHTMLAttributes, type ReactNode } from 'react'
import './checkbox-radio.css'

type RadioProps = {
  label?: ReactNode
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

/**
 * 네이티브 라디오를 숨기고 원+도트를 그린다. 같은 name끼리 배타 선택·화살표 이동은 브라우저 몫.
 * 도트는 scale(0)→1로 맺히며, 오버슈트 커브로 살짝 튀어 "선택됐다"를 강조한다.
 */
export const Radio = ({ label, className, ...inputProps }: RadioProps) => (
  <label className={className ? `check ${className}` : 'check'} data-kind="radio">
    <input type="radio" className="check-input" {...inputProps} />
    <span className="check-box" aria-hidden="true">
      <span className="check-dot" />
    </span>
    {label && <span className="check-label">{label}</span>}
  </label>
)
