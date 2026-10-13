/**
 * 프레임워크 무관 인증번호 입력 코어 (의존성 0).
 *
 * 칸이 여러 개인 입력의 어려움은 모양이 아니라 **포커스**다:
 *  - 한 글자를 치면 다음 칸으로 넘어가야 하고, 지우면 앞 칸으로 돌아와야 한다
 *  - 문자 메시지에서 복사한 6자리를 아무 칸에나 붙여넣어도 칸마다 하나씩 나뉘어야 한다
 *  - 자동완성·안드로이드 키보드는 한 칸에 여러 글자를 한꺼번에 밀어 넣는다 — 그것도 나눠야 한다
 * 이 코어가 그 포커스 이동과 분배만 담당한다. 모양은 CSS, 검증은 호출하는 쪽 몫이다.
 */

type CreateOtpInputOptions = {
  /** 칸 순서대로의 input 요소들 */
  inputs: HTMLInputElement[]
  /** 한 글자가 이 칸에 들어와도 되는지 (기본: 숫자만) */
  isAllowed?: (char: string) => boolean
  /** 값이 바뀔 때마다 — 부분 입력도 포함한다 */
  onChange?: (code: string) => void
  /** 마지막 칸까지 채워졌을 때 — 보통 여기서 바로 제출한다 */
  onComplete?: (code: string) => void
}

const DIGIT = /^[0-9]$/

export const createOtpInput = ({ inputs, isAllowed = (char) => DIGIT.test(char), onChange, onComplete }: CreateOtpInputOptions) => {
  const read = () => inputs.map((input) => input.value).join('')

  const focusAt = (index: number) => {
    const target = inputs[Math.max(0, Math.min(inputs.length - 1, index))]
    target.focus()
    target.select() // 이미 값이 있으면 덮어쓰기가 되도록
  }

  const notify = () => {
    const code = read()
    onChange?.(code)
    if (code.length === inputs.length) onComplete?.(code)
  }

  /** from 칸부터 한 글자씩 나눠 담고, 마지막으로 채운 칸의 다음으로 포커스를 옮긴다 */
  const distribute = ({ text, from }: { text: string; from: number }) => {
    const chars = Array.from(text).filter(isAllowed)
    if (chars.length === 0) return

    let cursor = from
    for (const char of chars) {
      if (cursor >= inputs.length) break
      inputs[cursor].value = char
      cursor += 1
    }
    focusAt(cursor)
    notify()
  }

  const onInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const index = inputs.indexOf(input)
    if (index === -1) return

    // 자동완성·모바일 키보드는 한 칸에 여러 글자를 밀어 넣는다 — 들어온 값을 통째로 다시 나눈다
    const typed = input.value
    input.value = ''
    distribute({ text: typed, from: index })
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const input = event.target as HTMLInputElement
    const index = inputs.indexOf(input)
    if (index === -1) return

    if (event.key === 'Backspace') {
      if (input.value !== '') return // 자기 칸을 지우는 것은 브라우저에 맡긴다
      event.preventDefault()
      if (index === 0) return
      inputs[index - 1].value = '' // 빈 칸에서의 지우기는 "앞 칸을 지운다"는 뜻이다
      focusAt(index - 1)
      notify()
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAt(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusAt(index + 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAt(inputs.length - 1)
    }
  }

  const onPaste = (event: ClipboardEvent) => {
    const input = event.target as HTMLInputElement
    const index = inputs.indexOf(input)
    if (index === -1) return
    event.preventDefault() // 붙여넣기를 한 칸이 통째로 삼키지 못하게
    distribute({ text: event.clipboardData?.getData('text') ?? '', from: index })
  }

  /** 값이 있는 칸을 클릭하면 그 자리를 덮어쓸 수 있게 선택해 둔다 */
  const onFocus = (event: FocusEvent) => (event.target as HTMLInputElement).select()

  inputs.forEach((input) => {
    input.addEventListener('input', onInput)
    input.addEventListener('keydown', onKeyDown)
    input.addEventListener('paste', onPaste)
    input.addEventListener('focus', onFocus)
  })

  return {
    value: read,
    /** 전부 지우고 첫 칸으로 — 인증 실패 후 다시 입력받을 때 */
    clear: () => {
      inputs.forEach((input) => (input.value = ''))
      focusAt(0)
      onChange?.('')
    },
    /** 아직 비어 있는 첫 칸으로 포커스 — 화면 진입 시 */
    focusFirstEmpty: () => {
      const empty = inputs.findIndex((input) => input.value === '')
      focusAt(empty === -1 ? inputs.length - 1 : empty)
    },
    destroy: () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', onInput)
        input.removeEventListener('keydown', onKeyDown)
        input.removeEventListener('paste', onPaste)
        input.removeEventListener('focus', onFocus)
      })
    },
  }
}
