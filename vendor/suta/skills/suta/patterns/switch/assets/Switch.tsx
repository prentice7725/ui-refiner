import { type ReactNode } from 'react'
import './switch.css'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  /** 스위치 옆에 보일 라벨 — label 요소로 감싸 클릭 영역이 함께 넓어진다 */
  label?: ReactNode
  disabled?: boolean
  className?: string
}

/**
 * 네이티브 체크박스 + role="switch" — 포커스·Space 토글·폼 연동은 브라우저가 담당하고,
 * CSS는 트랙/썸의 시각만 그린다. 접근성을 직접 재구현하지 않는 것이 핵심이다.
 */
export const Switch = ({ checked, onChange, label, disabled, className }: SwitchProps) => (
  <label className={className ? `switch ${className}` : 'switch'}>
    <input
      type="checkbox"
      role="switch"
      className="switch-input"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="switch-track" aria-hidden="true">
      <span className="switch-thumb" />
    </span>
    {label && <span className="switch-label">{label}</span>}
  </label>
)
