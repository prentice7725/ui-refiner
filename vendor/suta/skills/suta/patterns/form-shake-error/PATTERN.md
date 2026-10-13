---
name: form-shake-error
description: 잘못된 입력을 좌우로 흔들고(shake) 에러 메시지가 아래에서 밀려 올라오는 폼 검증 에러 피드백(form validation error)을 구현한다. "비번/비밀번호 틀리면 입력창 흔들리게, 로그인 실패 시 입력창 떨림, 잘못된 입력 표시, 에러 문구 애니메이션, 폼 검증 피드백" 요청과 제출·검증 실패를 알릴 때 쓴다. 기존 적용분의 흔들림 세기·속도·색 수정에도 쓴다.
---

# form-shake-error — 폼 에러 흔들림 + 메시지

라이브 데모: https://guksu.github.io/suta/#/form-shake-error

## 언제 쓰는가

비밀번호 불일치, 필수 항목 비움, 전화번호 형식 오류처럼 **제출을 눌렀는데 통과하지 못한** 순간. 좌우로 짧게 튕기는 흔들림은 "아니오"라는 고개 저음의 관례라 문구를 읽기 전에 실패를 알린다. 흔들림만으로는 이유를 모르니 메시지가 반드시 뒤따르고, 모션을 끈 사용자를 위해 테두리 색도 함께 바뀐다(이중 신호).

**기술 선택:** CSS keyframe + `data-shake` 속성 토글. 흔들림은 `translateX`만 쓰고, 진폭이 줄어드는 감쇠 곡선으로 "튕기고 멈춘다". 유일한 JS 로직은 **재시작** — 이미 흔들리는 중에 다시 틀리면 속성을 뗐다 붙이는데, 그 사이 강제 리플로우가 없으면 브라우저가 두 변경을 합쳐 애니메이션이 다시 돌지 않는다(`shakeCore.ts`가 이를 보장). 메시지 접힘/펼침은 `grid-template-rows 0fr↔1fr`라 높이 측정이 없다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/shakeCore.ts` | 흔들림 트리거·재시작 코어 (프레임워크 무관) | 모든 프로젝트 |
| `assets/form-shake-error.css` | 감쇠 shake 키프레임, 에러 테두리, 메시지 슬라이드 | 모든 프로젝트 |
| `assets/ShakeField.tsx` | React 래퍼 (`useShake` 훅 + `FieldError` 메시지) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { useShake, FieldError } from './ShakeField'

const PhoneForm = () => {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string>()
  const field = useShake<HTMLInputElement>()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!/^01\d-\d{3,4}-\d{4}$/.test(phone)) {
      setError('010-1234-5678 형식으로 입력해 주세요')
      field.shake()
      field.ref.current?.focus()
      return
    }
    setError(undefined)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <input
        ref={field.ref}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby="phone-error"
      />
      <FieldError id="phone-error" message={error} />
      <button type="submit">예약</button>
    </form>
  )
}
```

- `shake()`는 제출 시점에 명시적으로 부른다 — 타이핑 중 실시간 검증마다 흔들면 사용자를 괴롭힌다.
- 실패 시 `focus()`를 함께 주면 키보드·스크린 리더 사용자가 곧바로 고칠 수 있다.
- 입력 하나가 아니라 폼 전체(카드)를 흔들려면 그 컨테이너에 `ref`를 준다.

## 사용 방법 — 순수 JS (React 없음)

```html
<input id="phone" aria-describedby="phone-error" />
<div class="field-error" id="phone-error-wrap" data-visible="false">
  <div class="field-error-inner"><span class="field-error-text" id="phone-error" role="alert"></span></div>
</div>
```

```js
import { shake } from './shakeCore.js'

const input = document.getElementById('phone')
const showError = (message) => {
  input.setAttribute('aria-invalid', 'true')
  document.getElementById('phone-error').textContent = message
  document.getElementById('phone-error-wrap').dataset.visible = 'true'
  shake(input)
  input.focus()
}
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 세기 | `--shake-distance` (6px — 카드 전체를 흔들 땐 4px 정도로 줄인다, 큰 요소는 작은 이동도 크게 보인다) |
| 흔들림 길이 | `--shake-duration` (400ms — 500ms를 넘기면 장난처럼 보인다) |
| 에러 색 | `--error-color` (#dc2626 — 테두리·메시지·포커스 링에 함께 쓰인다) |
| 메시지 속도 | `--error-duration` (200ms) |

## 주의사항

- **`aria-invalid`와 메시지를 빼먹지 말 것** — 흔들림은 시각 신호일 뿐이다. 스크린 리더는 `aria-invalid="true"`로 "잘못됨"을, `role="alert"`로 문구를 듣는다.
- `[aria-invalid='true']` 규칙에 `!important`를 둔 것은 입력 컴포넌트의 포커스 스타일보다 에러 표시가 이겨야 하기 때문이다. 프로젝트 입력 스타일이 이미 에러 상태를 다루면 그 블록을 지운다.
- 흔들 요소에 이미 `transform`이 있으면(중앙 정렬용 translate 등) 키프레임이 덮어쓴다 — 그 경우 한 겹 감싼 래퍼를 흔든다.
- 성공 시에도 흔들지 않는다 — 흔들림은 오직 "아니오"다.
- **reduced-motion 대응 내장** — 흔들림·슬라이드를 없애고 테두리 색·메시지는 즉시 표시한다. 블록 제거 금지.
