---
name: tab-indicator
description: 탭을 바꿀 때 활성 탭 밑줄(tab indicator)이 옆으로 미끄러져 따라가는 애니메이션을 구현한다. "탭 밑줄 애니메이션, 탭 인디케이터, 슬라이딩 탭, 탭 누르면 밑줄이 옆으로 따라가는, 탭 바 밑줄" 요청과 상단 탭 바·카테고리 탭 UI에 쓴다. 기존 적용분의 속도·색·밑줄 두께 수정에도 쓴다.
---

# tab-indicator — 탭 인디케이터 슬라이드

라이브 데모: https://guksu.github.io/suta/#/tab-indicator

## 언제 쓰는가

탭·세그먼트 전환에서 활성 표시(밑줄)가 이전 탭에서 새 탭으로 미끄러져 이동할 때. 당근·토스·인스타그램의 상단 탭이 이 관례다 — 각 탭에 밑줄을 껐다 켜는 방식과 달리 "어디서 어디로 이동했는지"가 보인다.

**기술 선택:** 측정(JS 한 줄) + CSS transition. 인디케이터를 폭 1px로 두고 `translateX + scaleX`로 옮긴다 — `left`/`width`를 직접 애니메이션하면 매 프레임 레이아웃이 돌지만 transform은 GPU 합성만 쓴다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/moveTabIndicator.ts` | 코어 — 측정→transform 적용 | 모든 프로젝트 |
| `assets/tab-indicator.css` | 인디케이터·슬라이드 정의 | 모든 프로젝트 |
| `assets/useTabIndicator.ts` | React 훅 (코어 사용, 리사이즈 재측정 포함) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { useTabIndicator } from './useTabIndicator'

const TABS = ['홈', '동네생활', '내 근처', '채팅']

const TabBar = () => {
  const [active, setActive] = useState(0)
  const { registerTab, indicatorRef } = useTabIndicator({ activeIndex: active })

  return (
    <nav className="tab-bar" role="tablist">
      {TABS.map((label, index) => (
        <button
          key={label}
          ref={registerTab(index)}
          role="tab"
          aria-selected={index === active}
          onClick={() => setActive(index)}
        >
          {label}
        </button>
      ))}
      <span ref={indicatorRef} className="tab-indicator" aria-hidden="true" />
    </nav>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { moveTabIndicator } from './moveTabIndicator.js'

const bar = document.querySelector('.tab-bar')
const indicator = bar.querySelector('.tab-indicator')
const tabs = [...bar.querySelectorAll('[role=tab]')]

moveTabIndicator({ indicator, target: tabs[0], immediate: true }) // 첫 배치는 슬라이드 없이
tabs.forEach((tab) => {
  tab.addEventListener('click', () => moveTabIndicator({ indicator, target: tab }))
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 색 | `--tab-indicator-color` (기본 currentColor — 활성 탭 글자색과 맞추기 쉽다) |
| 두께 | `--tab-indicator-height` (기본 2px) |
| 속도 | `--tab-indicator-duration` (기본 250ms — 인접 탭은 짧게, 멀리 이동해도 300ms 안쪽) |

## 주의사항

- **인디케이터와 탭은 같은 offsetParent 안에 있어야 한다** — `.tab-bar`의 `position: relative`가 그 좌표계다. 제거하면 위치가 틀어진다.
- 첫 배치는 `immediate: true`로 — 없으면 페이지 진입 시 인디케이터가 0에서 미끄러져 오는 가짜 이동이 보인다(React 훅은 내장 처리).
- 탭 폭이 바뀌는 경우(폰트 로드·리사이즈·라벨 변경)는 재측정이 필요하다 — React 훅은 ResizeObserver로 내장 처리, 순수 JS는 resize 시 `immediate: true`로 다시 호출한다.
- **reduced-motion 대응 내장** — 슬라이드를 끄고 즉시 점프로 위치 표시만 유지한다. 블록 제거 금지.
- scaleX 방식은 인디케이터에 둥근 모서리·그라데이션을 주면 늘어나 보인다 — 그런 장식이 필요하면 이 패턴 범위 밖(FLIP 계열)이다.
