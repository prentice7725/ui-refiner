---
name: wheel-picker
description: iOS 드럼 휠 피커(wheel picker)를 구현한다 — 위아래로 굴려 가운데 칸에 스냅되는 원통형 선택기, 3D 기울기·페이드. "휠 피커, 드럼 피커, 아이폰 알람식 시간 롤러, 굴려서 고르는 시·분·날짜·숫자 선택기" 요청과 시·분·인원·수량처럼 값이 10~60개인 선택 UI에 쓴다. 기존 적용분의 항목 높이·보이는 칸 수·기울기·색 수정에도 쓴다.
---

# wheel-picker — 휠(드럼) 피커

라이브 데모: https://guksu.github.io/suta/#/wheel-picker

## 언제 쓰는가

시간·분·인원·수량처럼 **값이 순서를 갖고 개수가 10~60개**일 때. 위아래로 굴려 가운데 칸에 멈춘 값을 고르고, 가운데서 멀어질수록 항목이 원통처럼 기울며 흐려진다. iOS의 날짜·시간 피커(UIPickerView)가 이 관례이고, 모바일 예약·알람·타이머 화면에서 흔하다. 값이 10개 미만이면 세그먼트·라디오가, 검색이 필요할 만큼 많으면 콤보박스가 낫다.

반대 의견: 웹에서 드럼은 마우스로 굴리기 불편하다는 비판이 있다 — 그래서 이 패턴은 **항목 클릭으로 바로 이동**과 **키보드(방향키·Home/End·PageUp/Down)**를 기본 내장한다. 데스크톱 전용 화면이라면 `<select>`가 더 맞는 답일 수 있다.

**기술 선택:** CSS `scroll-snap-type: y mandatory` 스크롤 컨테이너 + 항목 `scroll-snap-align: center`. 관성 스크롤·스냅·터치 제스처는 전부 브라우저 네이티브라 손가락에 붙는 느낌을 JS로 흉내 낼 필요가 없다. JS는 ① 스크롤 위치→가운데 인덱스, ② 거리 기반 `rotateX`·`opacity`·`translateZ`(rAF로 프레임당 1회), ③ 스크롤 정지(`scrollend`, 미지원 시 150ms 디바운스) 시 onChange, ④ 외부 value 변경·키보드·클릭 시 `scrollTo`만 담당한다. 3D 자세 계산은 DOM 없는 순수 함수(`assets/wheelCore.ts`)로 분리해 테스트한다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/wheelCore.ts` | 순수 계산 — 위치↔인덱스, 거리→3D 스타일, 키보드 판정 | 모든 프로젝트 |
| `assets/createWheel.ts` | 코어 — 스크롤/키보드/클릭 리스너, 항목 transform 적용, onChange | 모든 프로젝트 |
| `assets/wheel-picker.css` | 컨테이너(원근·마스크·스크롤바 숨김)·선택 띠·항목·reduced-motion | 모든 프로젝트 |
| `assets/WheelPicker.tsx` | React 래퍼 (제어 컴포넌트, ARIA 마크업) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { WheelPicker } from './WheelPicker'

const HOURS = Array.from({ length: 11 }, (_, i) => ({ value: String(11 + i), label: `${11 + i}시` }))
const MINUTES = [
  { value: '00', label: '00분' },
  { value: '30', label: '30분' },
]

const ReservationTime = () => {
  const [hour, setHour] = useState('18')
  const [minute, setMinute] = useState('30')

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <WheelPicker aria-label="시" options={HOURS} value={hour} onChange={setHour} />
      <WheelPicker aria-label="분" options={MINUTES} value={minute} onChange={setMinute} visibleCount={3} />
    </div>
  )
}
```

- `value`는 부모가 소유한다(제어 컴포넌트). 밖에서 `value`를 바꾸면 휠이 그 위치로 굴러간다.
- `itemHeight`(기본 36)·`visibleCount`(기본 5, **홀수**)는 CSS 변수 `--wheel-item-height`·`--wheel-visible`로 내려간다 — 코어와 CSS가 같은 숫자를 봐야 가운데 칸이 맞는다.
- `aria-label` 또는 `aria-labelledby`로 휠마다 이름을 붙여라. 휠이 여럿이면 필수다.

## 사용 방법 — 순수 JS (React 없음)

마크업: 바깥 `.wheel`(선택 띠·마스크) 안에 스크롤 트랙 `.wheel-track`(`role="listbox"`, `tabindex="0"`), 그 직계 자식이 항목 `.wheel-item`(`role="option"`)이다.

```html
<div class="wheel">
  <div class="wheel-track" role="listbox" tabindex="0" aria-label="시">
    <div class="wheel-item" role="option" aria-selected="false">11시</div>
    <div class="wheel-item" role="option" aria-selected="false">12시</div>
    <!-- … -->
  </div>
</div>
```

```js
import { createWheel } from './createWheel.js'

const track = document.querySelector('.wheel-track')
const items = [...track.children]
const wheel = createWheel({
  container: track,
  onChange: (index) => {
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === index)))
    console.log('선택:', items[index].textContent)
  },
})
wheel.setIndex(7, { behavior: 'instant' }) // 초기 값 — 첫 배치는 애니메이션 없이
// 나중에 밖에서 값을 바꿀 때: wheel.setIndex(3)
// 제거 시: wheel.destroy()
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 항목 높이 | `--wheel-item-height` (기본 36px) — React는 `itemHeight` prop이 같은 변수를 찍는다 |
| 보이는 칸 수 | `--wheel-visible` (기본 5, 홀수만) — React는 `visibleCount` prop |
| 선택 띠 색 | `--wheel-highlight-bg` (기본 회색 14%) |
| 가운데 항목 색 / 나머지 색 | `--wheel-active-color` / `--wheel-item-color` (기본 inherit) |
| 원근 강도 | `--wheel-perspective` (기본 600px — 작을수록 원통이 도드라진다) |
| 거리당 기울기 | `createWheel({ degPerItem })` (기본 20도 — 18~22도가 읽히면서 원통으로 보이는 범위) |
| 포커스 링 | `--wheel-focus-ring` (기본 currentColor) |
| 정지 판정 대기 | `createWheel({ settleMs })` (기본 150ms — `scrollend` 미지원 브라우저에서만 쓰인다) |

## 주의사항

- **보이는 칸 수는 홀수여야 한다.** 짝수면 가운데가 항목 경계에 걸려 선택 띠와 스냅 위치가 어긋난다.
- **트랙 높이와 패딩은 CSS가 계산한다** — `height: 항목 × 칸 수`, `padding-block: 항목 × (칸 수 − 1) / 2`. 트랙에 다른 padding·border를 주면 첫/마지막 항목이 가운데에 오지 못한다. 여백이 필요하면 바깥 `.wheel`에 준다.
- `scrollTo`의 `behavior: 'instant'`를 초기 배치에 쓴다 — `'auto'`는 CSS `scroll-behavior: smooth`를 따르므로 0에서 굴러오는 가짜 이동이 생긴다.
- onChange는 **스크롤이 멎은 뒤** 한 번 온다. 굴러가는 중간 값이 필요하면 이 패턴 범위 밖이다(`data-center` 속성을 MutationObserver로 보는 정도).
- `aria-activedescendant`는 확정된(멈춘) 항목만 가리킨다 — 굴러가는 중간 항목이 보조기술에 줄줄이 읽히지 않게 하기 위해서다.
- 항목이 수백 개면 매 프레임 전체 항목에 transform을 찍는 비용이 보인다. 그 규모는 가상화(virtual-list)와 결합하거나 콤보박스를 검토하라.
- **reduced-motion 대응 내장** — JS가 `matchMedia`로 판정해 기울기·흐림을 건너뛰고, CSS도 `transform/opacity`를 `!important`로 끄며 `scroll-behavior`를 auto로 되돌린다. 스냅 리스트 자체는 남는다. 블록 제거 금지.
- Safari는 `scrollend`가 늦게 들어왔다(26 이전 미지원) — 그 경우 디바운스가 대신 정지를 판정하므로 onChange가 150ms 늦게 온다. 그 정도는 관례상 문제 없다.
