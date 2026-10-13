---
name: segmented-control
description: iOS 스타일 세그먼트 컨트롤(segmented control) 컴포넌트를 구현한다 — 선택한 칸 뒤로 알약 모양 배경(thumb)이 미끄러져 이동하며, 방향키·스크린 리더에 대응한다. "세그먼트 컨트롤, 세그먼트 버튼, 알약 탭, 매장/포장 같은 2~5지선다 옵션 토글, iOS 탭 토글" 요청과 소수 옵션 중 하나를 즉시 고르는 컨트롤에 쓴다. 기존 적용분의 thumb 색·이동 속도·모서리 수정에도 쓴다.
---

# segmented-control — 세그먼트 컨트롤

라이브 데모: https://guksu.github.io/suta/#/segmented-control

## 언제 쓰는가

"매장/포장", "소면/칼국수/냉면"처럼 **2~5개 옵션 중 하나를 즉시 고르는** 컨트롤. iOS의 세그먼트 컨트롤(지도 앱의 지도/교통/위성 전환)이 이 관례다 — 선택 칸 뒤로 흰 알약이 미끄러져 "어디서 어디로 옮겼는지"가 보인다. 밑줄만 움직이는 `tab-indicator`와 달리 선택 칸 전체를 배경판이 덮는다.

기준: 옵션이 화면(콘텐츠 영역)을 바꾸면 탭(`tab-indicator`), 값(설정·필터·주문 옵션)을 바꾸면 세그먼트 컨트롤. 옵션이 6개 이상이거나 라벨이 길면 세그먼트가 아니라 셀렉트(`select`)나 라디오 목록이 맞다.

**기술 선택:** 네이티브 `<input type="radio">` 그룹 + 측정(JS 한 줄) + CSS transition. 라디오를 시각적으로만 숨기고 라벨을 칸으로 쓰면 배타 선택·방향키 이동·포커스·폼 제출이 전부 브라우저 몫이다. thumb는 `translateX`(위치) + `width`(폭)로 옮긴다 — `tab-indicator`처럼 `scaleX`로 늘리면 알약의 둥근 모서리와 그림자가 가로로 찌그러진다. width 전이는 레이아웃을 돌리지만 thumb는 `position: absolute`(흐름 밖)라 형제에 영향이 없고 칸이 2~5개라 비용이 무시할 만하다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/moveSegmentThumb.ts` | 코어 — 측정→transform·width 적용, `segmentThumbFrame` 순수 계산 포함 | 모든 프로젝트 |
| `assets/segmented-control.css` | 트랙·칸·thumb·포커스 링 정의 | 모든 프로젝트 |
| `assets/useSegmentedControl.ts` | React 훅 (코어 사용, 리사이즈 재측정 포함) | React 프로젝트만 |
| `assets/SegmentedControl.tsx` | React 편의 컴포넌트 (마크업·라디오 그룹 내장) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { SegmentedControl } from './SegmentedControl'

const ORDERS = [
  { value: 'dine-in', label: '매장' },
  { value: 'takeout', label: '포장' },
]

const OrderType = () => {
  const [order, setOrder] = useState('dine-in')

  return <SegmentedControl name="order" label="주문 방식" options={ORDERS} value={order} onChange={setOrder} />
}
```

마크업을 직접 짜야 하면(아이콘 칸·커스텀 라벨) `useSegmentedControl` 훅을 쓴다 — `registerSegment(index)`를 각 `<label className="segment">`의 ref로, `thumbRef`를 `<span className="segment-thumb" aria-hidden="true" />`에 단다. `assets/SegmentedControl.tsx`가 그 예시다.

## 사용 방법 — 순수 JS (React 없음)

```html
<div class="segmented" role="radiogroup" aria-label="주문 방식">
  <label class="segment">
    <input type="radio" class="segment-input" name="order" value="dine-in" checked />
    <span class="segment-label">매장</span>
  </label>
  <label class="segment">
    <input type="radio" class="segment-input" name="order" value="takeout" />
    <span class="segment-label">포장</span>
  </label>
  <span class="segment-thumb" aria-hidden="true"></span>
</div>
```

```js
import { moveSegmentThumb } from './moveSegmentThumb.js'

const group = document.querySelector('.segmented')
const thumb = group.querySelector('.segment-thumb')
const inputs = [...group.querySelectorAll('.segment-input')]

const checked = inputs.find((input) => input.checked)
moveSegmentThumb({ thumb, target: checked.parentElement, immediate: true }) // 첫 배치는 슬라이드 없이
inputs.forEach((input) => {
  input.addEventListener('change', () => moveSegmentThumb({ thumb, target: input.parentElement }))
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 속도 | `--segment-duration` (기본 200ms — 하루 여러 번 누르는 컨트롤이라 짧게, 300ms 안쪽) |
| thumb 색 | `--segment-thumb-bg` (기본 #fff — 다크 배경이면 밝은 회색이나 `var(--surface)`로) |
| 트랙 색 | `--segment-track-bg` (기본 반투명 회색 rgba(120,120,128,0.16)) |
| 모서리 | `--segment-radius` (기본 999px 알약 — 8px 정도면 각진 iOS 최신형) |
| 글자색 | `--segment-color`(비선택)·`--segment-active-color`(선택)·`--segment-focus-color`(포커스 링) |
| 칸 폭 | 기본 균등(`grid-auto-columns: 1fr`). 내용 폭대로 두려면 `.segmented`에 `grid-auto-columns: auto` |

## 주의사항

- **thumb와 칸은 같은 offsetParent 안에 있어야 한다** — `.segmented`의 `position: relative`가 그 좌표계다. 트랙 패딩(2px)은 `offsetLeft`에 이미 포함되므로 thumb의 `left`는 0으로 둔다.
- 라디오를 `display: none`으로 숨기면 안 된다 — 포커스·방향키를 받을 수 없게 된다. 제공된 클립 방식(시각만 숨김)을 유지한다.
- 첫 배치는 `immediate: true`로 — 없으면 페이지 진입 시 thumb가 0에서 미끄러져 오는 가짜 이동이 보인다(React 훅은 내장 처리).
- 칸 폭이 바뀌는 경우(폰트 로드·리사이즈·라벨 변경)는 재측정이 필요하다 — React 훅은 ResizeObserver로 내장 처리, 순수 JS는 resize 시 `immediate: true`로 다시 호출한다.
- 선택 칸의 글자는 진하게 유지한다(`.segment-input:checked + .segment-label`) — thumb 색만으로는 저대비·색약 환경에서 어느 칸이 선택됐는지 약하다.
- **드래그로 thumb를 끌어 선택하는 동작은 범위 밖이다** — 클릭·탭·방향키만 지원한다. 드래그가 필요하면 포인터 이벤트로 가장 가까운 칸을 고르는 로직을 따로 얹어야 한다.
- 즉시 적용이 원칙이다 — 세그먼트를 고른 뒤 "적용" 버튼을 또 요구하지 않는다. 제출형 폼이면 일반 라디오(`checkbox-radio`)가 맞다.
- **reduced-motion 대응 내장** — 슬라이드를 끄고 즉시 점프로 위치 표시만 유지한다. 블록 제거 금지.
