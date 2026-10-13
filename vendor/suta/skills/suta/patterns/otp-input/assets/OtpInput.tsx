import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { createOtpInput } from './createOtpInput'
import { shake } from './shakeCore'
import './otp-input.css'

export type OtpHandle = {
  /** 좌우로 흔든다 — 연속으로 틀려도 매번 처음부터 다시 흔들린다 */
  shake: () => void
  /** 전부 지우고 첫 칸으로 */
  clear: () => void
  focus: () => void
  value: () => string
}

type OtpInputProps = {
  /** 칸 수 (기본 6) */
  length?: number
  /** 마지막 칸까지 채워졌을 때 — 보통 여기서 바로 인증을 시도한다 */
  onComplete: (code: string) => void
  onChange?: (code: string) => void
  /** 화면에 들어오자마자 첫 칸에 포커스 (기본 true) */
  autoFocus?: boolean
  disabled?: boolean
  /** 스크린 리더가 읽을 그룹 이름 */
  label?: string
  /** 칸마다 읽힐 이름 — position은 1부터 센다. 기본 "{label} {position}번째 자리" */
  digitLabel?: ({ label, position }: { label: string; position: number }) => string
  ref?: Ref<OtpHandle>
}

const defaultDigitLabel = ({ label, position }: { label: string; position: number }) => `${label} ${position}번째 자리`

/**
 * 인증번호 입력 — 포커스 이동·붙여넣기 분배는 createOtpInput이, 모양은 CSS가 담당한다.
 * 실패 처리는 ref로 꺼내 쓴다(흔들기·비우기) — 성공/실패 판정은 이 컴포넌트가 알 수 없기 때문이다.
 *
 * 모바일 배려 두 가지가 들어 있다:
 *  - inputMode="numeric"으로 숫자 키보드가 뜬다(type="number"는 스피너·휠 스크롤 때문에 쓰지 않는다)
 *  - 첫 칸의 autoComplete="one-time-code"로 iOS가 문자 메시지의 인증번호를 제안한다.
 *    제안을 누르면 6자리가 한 칸에 들어오지만 코어가 칸마다 나눈다.
 */
export const OtpInput = ({
  length = 6,
  onComplete,
  onChange,
  autoFocus = true,
  disabled = false,
  label = '인증번호',
  digitLabel = defaultDigitLabel,
  ref,
}: OtpInputProps) => {
  const groupRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<ReturnType<typeof createOtpInput> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [filled, setFilled] = useState(0)

  useEffect(
    function bindOtp() {
      const group = groupRef.current
      if (!group) return
      const controller = createOtpInput({
        inputs: Array.from(group.querySelectorAll<HTMLInputElement>('input')),
        onChange: (code) => {
          setFilled(code.length)
          onChangeRef.current?.(code)
        },
        onComplete: (code) => onCompleteRef.current(code),
      })
      controllerRef.current = controller
      if (autoFocus) controller.focusFirstEmpty()
      return () => {
        controller.destroy()
        controllerRef.current = null
      }
    },
    [length, autoFocus],
  )

  useImperativeHandle(ref, () => ({
    shake: () => {
      if (groupRef.current) shake(groupRef.current)
    },
    clear: () => {
      controllerRef.current?.clear()
      setFilled(0)
    },
    focus: () => controllerRef.current?.focusFirstEmpty(),
    value: () => controllerRef.current?.value() ?? '',
  }))

  return (
    <div ref={groupRef} className="otp-group" role="group" aria-label={label}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          className="otp-cell"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-label={digitLabel({ label, position: index + 1 })}
          data-filled={index < filled ? 'true' : 'false'}
        />
      ))}
    </div>
  )
}
