import { useId, type InputHTMLAttributes } from 'react'
import './floating-label.css'

type TextFieldProps = {
  label: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'className'>

/**
 * 플로팅 라벨 입력 — 떠오름 판정은 전부 CSS(:focus·:placeholder-shown)라 JS 상태가 없다.
 * placeholder는 " "로 고정한다: 비어 있을 때 :placeholder-shown이 성립해야 라벨이 내려온다.
 * 라벨이 placeholder를 대신하므로 별도 placeholder 문구는 받지 않는다.
 */
export const TextField = ({ label, className, id, ...inputProps }: TextFieldProps) => {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={className ? `field ${className}` : 'field'}>
      <input id={inputId} className="field-input" placeholder=" " {...inputProps} />
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
    </div>
  )
}
