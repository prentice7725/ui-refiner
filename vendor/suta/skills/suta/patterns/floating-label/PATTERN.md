---
name: floating-label
description: 라벨이 플레이스홀더 자리에 있다가 입력창을 누르거나 글자를 치면 위로 떠올라 작아지는 플로팅 라벨 입력 필드(floating label input)를 구현한다. "인풋 라벨 위로 떠오르게, 머티리얼 인풋, placeholder가 라벨로 올라가는 입력창, 라벨 애니메이션 폼" 요청과 로그인·예약·결제 폼의 텍스트 입력에 쓴다. 기존 적용분의 라벨 색·올라가는 속도 수정에도 쓴다.
---

# floating-label — 플로팅 라벨 입력

라이브 데모: https://guksu.github.io/suta/#/floating-label

## 언제 쓰는가

플레이스홀더만 있는 입력은 타이핑을 시작하는 순간 "여기가 무슨 칸이었지"가 사라진다. 라벨을 항상 위에 두면 해결되지만 폼이 길어진다 — 플로팅 라벨은 빈 칸에서는 플레이스홀더 자리를 차지하다가 입력이 시작되면 위로 떠올라 **공간과 문맥을 둘 다 지킨다**. 로그인·예약·결제처럼 필드 몇 개짜리 폼에서 효과가 크다.

**기술 선택:** CSS 판정만 사용, JS 상태 0. "떠 있어야 하는가"는 `:focus`(입력 중) 또는 `:not(:placeholder-shown)`(값 있음) 두 의사 클래스로 CSS가 스스로 판정한다 — blur 후에도 값이 있으면 떠 있는 상태가 공짜로 유지된다. 라벨 이동은 `transform: translateY + scale`만 쓴다(`font-size`·`top` 전이는 매 프레임 레이아웃을 돌린다).

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/floating-label.css` | 필드·라벨 떠오름·포커스 링 정의 | 모든 프로젝트 |
| `assets/TextField.tsx` | React 래퍼 (id·label 연결, placeholder 고정) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { TextField } from './TextField'

const ReserveForm = () => {
  const [name, setName] = useState('')

  return (
    <form>
      <TextField label="예약자 이름" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="연락처" type="tel" name="phone" />
    </form>
  )
}
```

`TextField`는 `placeholder`를 받지 않는다 — 라벨이 그 역할이고, 내부적으로 `" "`(한 칸 공백)로 고정된다.

## 사용 방법 — 순수 JS (React 없음)

마크업 순서(input 다음 label)와 `placeholder=" "`만 지키면 JS가 아예 필요 없다.

```html
<div class="field">
  <input class="field-input" id="name" placeholder=" " />
  <label class="field-label" for="name">예약자 이름</label>
</div>
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 떠오름 속도 | `--field-duration` (기본 150ms — 타이핑 시작을 방해하지 않게 짧게) |
| 포커스 색 | `--field-accent` (기본 #1b1e24 — 라벨·테두리·포커스 링이 함께 물든다) |
| 테두리·라벨 색 | `--field-border`(#d4d9e1)·`--field-label-color`(#8a93a1) |

## 주의사항

- **`placeholder=" "`가 판정의 전제다** — 지우거나 문구를 넣으면 `:placeholder-shown` 판정이 무너져 라벨이 입력값과 겹친다. 별도 안내 문구가 필요하면 필드 아래 helper text로 둔다(플레이스홀더와 라벨을 동시에 쓰는 순간 이 패턴의 공간 이점이 사라진다).
- **마크업 순서는 input → label이다** — CSS가 인접 형제 선택자(`+`)로 라벨을 찾는다. 순서를 바꾸면 떠오르지 않는다.
- 브라우저 자동완성(autofill)으로 값이 채워져도 `:placeholder-shown`이 해제되므로 라벨이 떠오른다 — 별도 처리가 필요 없다.
- `type="date"`처럼 빈 값에도 자체 UI가 보이는 입력에는 맞지 않다 — 라벨과 겹친다. 텍스트 계열(text·email·tel·password·number)에 쓴다.
- **reduced-motion 대응 내장** — 라벨 이동은 즉시 점프, 색 전환은 유지한다. 블록 제거 금지.
