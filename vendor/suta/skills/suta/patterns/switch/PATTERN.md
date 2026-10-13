---
name: switch
description: iOS 스타일 토글 스위치(toggle switch)를 구현한다 — 썸이 미끄러지고 트랙 색이 바뀌는 온오프 입력, 네이티브 input 기반이라 키보드·폼 연동이 된다. "스위치, 온오프 버튼, 켜기 끄기 토글, 알림 켜고 끄기, 설정 스위치" 요청과 설정·옵션의 즉시 적용형 on/off 입력에 쓴다. 기존 적용분의 크기·색·속도 수정에도 쓴다.
---

# switch — 토글 스위치

라이브 데모: https://guksu.github.io/suta/#/switch

## 언제 쓰는가

알림 켜기, 다크 모드, 주문 옵션처럼 **누르는 즉시 적용되는 on/off**. 체크박스와의 구분이 기준이다 — 체크박스는 "제출 시 반영"(폼 제출 전 여러 개 고르기), 스위치는 "즉시 반영"(누르면 바로 켜짐). 썸이 미끄러지는 모션은 장식이 아니라 "지금 전환됐다"는 피드백이다.

**기술 선택:** 네이티브 `<input type="checkbox" role="switch">` + CSS. 체크박스를 숨기고 트랙/썸을 그리면 포커스·Space 토글·라벨 클릭·폼 제출이 전부 브라우저 몫이 된다 — 접근성을 직접 재구현하지 않는 것이 이 패턴의 핵심 결정이다. 썸 이동·스퀴시는 transform만 쓴다(레이아웃 애니메이션 없음).

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/switch.css` | 트랙·썸·스퀴시·포커스 링 정의 | 모든 프로젝트 |
| `assets/Switch.tsx` | React 래퍼 (라벨 연결 포함) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { Switch } from './Switch'

const OrderOptions = () => {
  const [extra, setExtra] = useState(false)

  return <Switch checked={extra} onChange={setExtra} label="곱빼기 (+1,000원)" />
}
```

## 사용 방법 — 순수 JS (React 없음)

마크업만 맞추면 JS 없이도 동작한다(상태는 체크박스가 들고 있다).

```html
<label class="switch">
  <input type="checkbox" role="switch" class="switch-input" />
  <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
  <span class="switch-label">곱빼기 (+1,000원)</span>
</label>
```

```js
document.querySelector('.switch-input').addEventListener('change', (e) => {
  console.log('켜짐:', e.target.checked)
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 크기 | `--switch-width`(44px)·`--switch-height`(26px) — 썸 크기·이동 거리가 함께 계산된다 |
| 켜짐/꺼짐 색 | `--switch-on-bg`(#1b1e24 — 거의 검정. 브랜드색으로 바꾼다)·`--switch-off-bg`(#868b94 — 흰 바탕 대비 3.4:1, 비텍스트 기준 3:1 이상) |
| 속도 | `--switch-duration` (기본 200ms — 하루 수십 번 누르는 컨트롤이라 짧게) |

## 주의사항

- **`role="switch"`를 지우지 말 것** — 스크린 리더가 "켜짐/꺼짐"으로 읽는 근거다(체크박스는 "선택됨"으로 읽는다).
- 입력을 `display: none`으로 숨기면 안 된다 — 포커스를 받을 수 없게 된다. 제공된 클립 방식(시각만 숨김)을 유지한다.
- 누름 스퀴시는 `width`가 아니라 `scaleX`다 — width 전이는 매 프레임 레이아웃을 돌린다. 배율(1.12)을 크게 키우면 썸이 타원으로 보이니 1.2 이하를 유지한다.
- 즉시 적용이 원칙이므로 스위치를 켠 뒤 "저장" 버튼을 또 요구하지 않는다 — 제출형 폼이면 체크박스가 맞다.
- **reduced-motion 대응 내장** — 썸 이동은 즉시 점프, 트랙 색 전환(상태 표시)은 유지한다. 블록 제거 금지.
