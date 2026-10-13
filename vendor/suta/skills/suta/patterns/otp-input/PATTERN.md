---
name: otp-input
description: 인증번호(OTP) 칸 입력을 구현한다 — 한 글자를 치면 다음 칸으로 넘어가고, 빈 칸에서 지우면 앞 칸으로 돌아가며, 복사한 코드를 붙여넣으면 칸마다 하나씩 나뉜다. "인증번호 입력, OTP input, 6자리 코드 입력, 인증번호 칸, 본인확인 코드, 문자로 온 코드 붙여넣기" 요청과 SMS·이메일 인증 화면에 쓴다. 칸 수·에러 흔들림 수정에도 쓴다.
---

# otp-input — 인증번호 칸 입력

라이브 데모: https://guksu.github.io/suta/#/otp-input

## 언제 쓰는가

문자·이메일로 받은 인증번호, 결제 승인 코드, 앱 잠금 PIN처럼 **짧은 코드를 칸에 나눠 받을 때**. 칸을 나누는 이유는 장식이 아니라 "몇 자리를 입력해야 하는지"와 "지금 몇 자리를 넣었는지"를 세지 않고도 알 수 있게 하기 위해서다.

**칸을 나누지 말아야 할 때도 있다** — 자릿수가 가변이거나(비밀번호), 사용자가 중간을 자유롭게 고쳐야 하는 값이라면 그냥 입력 하나가 낫다.

**기술 선택:** 네이티브 `<input>` 여러 개 + 포커스 제어. `contenteditable`이나 가짜 커서를 쓰지 않는다 — 비밀번호 관리자·자동완성·모바일 키보드가 모두 진짜 input에만 반응한다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createOtpInput.ts` | 코어 — 포커스 이동·붙여넣기 분배·완성 판정 | 모든 프로젝트 |
| `assets/shakeCore.ts` | 흔들림 트리거 (form-shake-error 패턴의 공유 코어) | 모든 프로젝트 |
| `assets/OtpInput.tsx` | React 컴포넌트 | React 프로젝트만 |
| `assets/otp-input.css` | 칸 모양·포커스·흔들림 | 모든 프로젝트 |

## 이 패턴이 대신 처리하는 것

칸을 나누는 순간 생기는 문제는 모양이 아니라 **포커스**다.

| 상황 | 기대하는 동작 |
|------|--------------|
| 한 글자를 친다 | 그 칸에 남고 다음 칸으로 넘어간다 |
| 빈 칸에서 지우기를 누른다 | 앞 칸으로 돌아가 그 글자를 지운다 |
| 문자에서 복사한 6자리를 아무 칸에나 붙여넣는다 | 칸마다 하나씩 나뉘고 마지막 다음으로 포커스가 간다 |
| iOS가 문자 메시지의 인증번호를 제안한다 | 6자리가 한 칸에 들어오지만 칸마다 나뉜다 |
| 값이 있는 칸을 클릭한다 | 그 자리가 선택돼 바로 덮어쓸 수 있다 |
| 숫자가 아닌 글자를 친다 | 아무 일도 일어나지 않는다 |

## 사용 방법 — React

```tsx
import { useRef, useState } from 'react'
import { OtpInput, type OtpHandle } from './OtpInput'

const VerifyStep = () => {
  const otp = useRef<OtpHandle>(null)
  const [message, setMessage] = useState('')

  const verify = async (code: string) => {
    const ok = await confirmCode(code)
    if (ok) return goNext()
    // 틀린 번호를 남겨 두면 사용자가 지우는 일부터 해야 한다 — 흔들고 비워 첫 칸으로
    setMessage('인증번호가 올바르지 않습니다')
    otp.current?.shake()
    otp.current?.clear()
  }

  return (
    <>
      <p>문자로 보낸 6자리를 입력해 주세요</p>
      <OtpInput ref={otp} onComplete={verify} />
      <p role="alert">{message}</p>
    </>
  )
}
```

`onComplete`는 마지막 칸이 채워지는 순간 불린다 — **확인 버튼을 누르게 하지 말고 여기서 바로 인증한다.** 6자리를 다 넣은 사용자에게 버튼을 한 번 더 누르게 할 이유가 없다.

`ref`로 꺼내 쓰는 것: `shake()`(흔들기) · `clear()`(비우고 첫 칸으로) · `focus()` · `value()`.

## 사용 방법 — 순수 JS (React 없음)

```html
<div class="otp-group" role="group" aria-label="인증번호">
  <input class="otp-cell" type="text" inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="인증번호 1번째 자리" />
  <!-- 나머지 다섯 칸 — autocomplete는 첫 칸에만 -->
</div>
```

```js
import { createOtpInput } from './createOtpInput.js'

const otp = createOtpInput({
  inputs: [...document.querySelectorAll('.otp-cell')],
  onComplete: (code) => verify(code),
})
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 칸 수 | `length` | 6 |
| 허용 문자 | `isAllowed` (코어 옵션) — 영문 코드면 `(c) => /[0-9A-Za-z]/.test(c)` | 숫자만 |
| 칸 크기·간격 | `--otp-cell-size`·`--otp-gap` | 3rem / 0.5rem |
| 색 | `--otp-accent`·`--otp-border`·`--otp-error`·`--otp-bg` | 거의 검정(#1b1e24) / 회색 / 빨강 / 흰색 |
| 칸 이름 | `digitLabel({ label, position })` — position은 1부터 | "{label} {position}번째 자리" |

## 주의사항

- **`type="number"`를 쓰지 않는 것은 의도다.** 스피너가 붙고, 휠 스크롤로 값이 바뀌며, 브라우저마다 `maxLength`가 먹지 않는다. `type="text"` + `inputMode="numeric"`이면 모바일 숫자 키보드는 그대로 뜨면서 그 문제들이 없다.
- **`autoComplete="one-time-code"`는 첫 칸에만 준다.** 여섯 칸 모두에 주면 iOS가 칸마다 제안을 띄운다.
- **칸마다 `aria-label`이 필요하다**("인증번호 3번째 자리"). 라벨 없는 입력 여섯 개는 스크린 리더에 "편집 텍스트" 여섯 줄로만 읽힌다.
- **실패 안내는 흔들림만으로 끝내지 않는다.** 흔들림은 눈에만 보인다 — `role="alert"` 문구를 함께 띄운다. 이 패턴은 흔들기만 제공하고 문구는 호출하는 쪽 몫이다.
- **자동 제출이므로 중복 요청 차단이 필요하다.** 붙여넣기 한 번에 `onComplete`가 불리고, 실패 후 다시 채우면 또 불린다 — 인증 요청 자체는 loading-button 패턴의 `useAsyncAction`처럼 진행 중 재실행을 막는 장치와 함께 쓴다.
- **좁은 화면에서는 칸이 줄어든다.** 기본 크기(3rem × 6칸 + 간격)는 328px라 320px 화면의 본문 폭보다 넓다. 그룹은 부모 폭을 넘지 않고(`max-width: 100%`), 칸이 그만큼 좁아진다(`min-width: 0`). 글자 크기는 `--otp-cell-size` 기준이라 그대로다.
- **reduced-motion 대응 내장** — 좌우 흔들림은 사라지고 붉은 테두리만 잠깐 뜬다. 실패했다는 사실이 사라지지 않도록 `role="alert"` 문구를 반드시 함께 띄운다.
- `assets/shakeCore.ts`는 form-shake-error 패턴과 **같은 파일**이다. 두 패턴을 함께 설치하면 하나만 두고 import 경로를 맞춘다.
