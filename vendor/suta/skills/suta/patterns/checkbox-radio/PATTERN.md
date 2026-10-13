---
name: checkbox-radio
description: 체크박스(checkbox)·라디오(radio) 버튼 컴포넌트 구현 — 체크할 때 체크 표시가 획으로 그려지듯 나타나고 라디오 도트가 튀어 맺히며, 키보드·그룹 배타·폼 연동이 된다. "체크박스, 라디오 버튼, 동의 체크, 약관 동의, 단일 선택, 다중 선택" 요청과 폼의 선택 입력에 쓴다. 기존 적용분의 크기·색·속도 수정에도 쓴다.
---

# checkbox-radio — 체크박스 · 라디오

라이브 데모: https://guksu.github.io/suta/#/checkbox-radio

## 언제 쓰는가

약관 동의, 토핑 여러 개 고르기(체크박스), 면 종류 하나 고르기(라디오)처럼 **제출 시 반영되는 선택 입력**. 즉시 적용되는 on/off는 `switch` 패턴이 맞다. 체크마크가 획 순서대로 그려지는 모션은 "지금 선택됐다"를 눈에 남기는 최소한의 피드백이다 — 브라우저 기본 체크박스는 프레임 하나로 바뀌어 눈이 놓친다.

**기술 선택:** 네이티브 `<input type="checkbox|radio">` + CSS. 입력을 시각적으로만 숨기고 박스·마크를 그리면 포커스·Space 토글·라디오 화살표 이동·같은 name 배타 선택·폼 제출이 전부 브라우저 몫이 된다. 체크마크는 SVG path의 `stroke-dasharray/dashoffset`으로 그려지고, 라디오 도트는 `transform: scale`로 맺힌다 — 레이아웃 애니메이션 없음.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/checkbox-radio.css` | 박스·마크·도트·누름·포커스 링 정의 | 모든 프로젝트 |
| `assets/Checkbox.tsx` | React 래퍼 (체크박스) | React 프로젝트만 |
| `assets/Radio.tsx` | React 래퍼 (라디오) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { Checkbox } from './Checkbox'
import { Radio } from './Radio'

const NoodleForm = () => {
  const [noodle, setNoodle] = useState('somyeon')
  const [agree, setAgree] = useState(false)

  return (
    <form>
      <fieldset>
        <legend>면 종류</legend>
        <Radio name="noodle" value="somyeon" checked={noodle === 'somyeon'} onChange={() => setNoodle('somyeon')} label="소면" />
        <Radio name="noodle" value="kalguksu" checked={noodle === 'kalguksu'} onChange={() => setNoodle('kalguksu')} label="칼국수" />
      </fieldset>
      <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} label="주문 안내에 동의합니다" />
    </form>
  )
}
```

두 컴포넌트 모두 나머지 props(`name`·`value`·`disabled`·`required` 등)를 input에 그대로 넘긴다.

## 사용 방법 — 순수 JS (React 없음)

마크업만 맞추면 JS 없이 동작한다(상태는 input이 들고 있다).

```html
<label class="check" data-kind="checkbox">
  <input type="checkbox" class="check-input" name="agree" />
  <span class="check-box" aria-hidden="true">
    <svg class="check-mark" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 7" /></svg>
  </span>
  <span class="check-label">주문 안내에 동의합니다</span>
</label>

<label class="check" data-kind="radio">
  <input type="radio" class="check-input" name="noodle" value="somyeon" />
  <span class="check-box" aria-hidden="true"><span class="check-dot"></span></span>
  <span class="check-label">소면</span>
</label>
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 크기 | `--check-size` (22px — 마크·도트는 비율로 따라온다) |
| 색 | `--check-accent`(선택 색), `--check-border`(미선택 테두리) |
| 속도 | `--check-duration` (200ms — 마크 그리기는 박스 채움보다 30% 늦게 시작한다) |
| 체크마크 모양 | `Checkbox.tsx`의 `path d` — 바꾸면 `stroke-dasharray` 값도 path 길이(`getTotalLength()`)에 맞춘다 |

## 주의사항

- **입력을 `display: none`으로 숨기면 안 된다** — 포커스를 받을 수 없게 된다. 제공된 클립 방식(시각만 숨김)을 유지한다.
- 라디오는 반드시 같은 `name`으로 묶고 `fieldset/legend`로 그룹 이름을 준다 — 배타 선택과 "면 종류, 소면, 1/2" 안내가 여기서 나온다.
- 체크마크 `stroke-dasharray: 24`는 제공된 path 길이 기준이다. path를 바꾸면 dash 값이 짧아 끝이 잘리거나 길어 지연이 생긴다.
- 라디오 도트의 오버슈트 커브(1.56)는 도트에만 쓴다 — 박스 채움에 오버슈트를 주면 색이 넘쳤다 돌아오는 것처럼 보인다.
- `indeterminate`(부분 선택) 상태는 포함하지 않았다 — 필요하면 `.check-input:indeterminate + .check-box`에 가로줄을 추가한다.
- **reduced-motion 대응 내장** — 그리기·튀어오름을 즉시 표시로 바꾸고 색 전환(상태 표시)은 유지한다. 블록 제거 금지.
