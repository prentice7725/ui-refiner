import { useRef, type RefObject } from 'react'
import { shake } from './shakeCore'
import './form-shake-error.css'

/**
 * 흔들 요소의 ref와 트리거를 돌려준다. 제출 실패 시 `shake()`를 부른다.
 * 여러 번 연속으로 불러도 매번 처음부터 재생된다(shakeCore가 재시작을 보장).
 */
export const useShake = <T extends HTMLElement = HTMLElement>(): { ref: RefObject<T | null>; shake: () => void } => {
  const ref = useRef<T | null>(null)
  return {
    ref,
    shake: () => {
      if (ref.current) shake(ref.current)
    },
  }
}

type FieldErrorProps = {
  /** 에러 문구 — 비어 있으면 접힌다 */
  message?: string
  /** 입력의 aria-describedby와 연결할 id */
  id?: string
  className?: string
}

/**
 * 에러 메시지 — 접힘/펼침을 grid-template-rows로, 문구는 아래에서 올라온다.
 * role="alert"라 문구가 나타나는 순간 스크린 리더가 읽는다. 항상 DOM에 있어 닫힘 애니메이션도 CSS 몫이다.
 */
export const FieldError = ({ message, id, className }: FieldErrorProps) => (
  <div className={className ? `field-error ${className}` : 'field-error'} data-visible={message ? 'true' : 'false'}>
    <div className="field-error-inner">
      <span className="field-error-text" id={id} role="alert">
        {message}
      </span>
    </div>
  </div>
)
