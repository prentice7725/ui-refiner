---
name: flip-list
description: 리스트 정렬·필터·추가·삭제로 순서를 바꿀 때 항목들이 순간이동하지 않고 미끄러져 자리를 잡는 FLIP 재배치 애니메이션(list reorder animation)을 구현한다. "목록 정렬 바꿀 때 항목 이동 애니메이션, 순서 바뀔 때 부드럽게, 필터 전환 효과, 리스트 재정렬 애니메이션" 요청과 정렬·필터 토글이 있는 목록·카드 그리드에 쓴다. 기존 적용분의 속도·이징 수정에도 쓴다.
---

# flip-list — 리스트 재배치 (FLIP)

라이브 데모: https://guksu.github.io/suta/#/flip-list

## 언제 쓰는가

정렬 버튼·필터·항목 추가/삭제로 리스트 순서가 바뀔 때. 재배치가 순간이동이면 사용자는 "어떤 항목이 어디로 갔는지"를 놓친다 — FLIP은 각 항목이 이전 자리에서 새 자리로 미끄러지게 해 이동을 추적 가능하게 만든다.

**기술 선택:** FLIP(First-Last-Invert-Play) 기법. 재배치 전 위치를 기억했다가, DOM이 바뀐 뒤 각 항목을 transform으로 이전 자리에 되돌려 놓고 제자리로 전환한다. top/left 애니메이션(레이아웃)이 아니라 transform(GPU)만 쓴다. 라이브러리 불필요.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/captureFlip.ts` | 코어 — 캡처·되감기·재생 | 모든 프로젝트 |
| `assets/useFlipList.ts` | React 훅 (매 렌더 자동 캡처·재생) | React 프로젝트만 |

CSS 파일은 없다 — transform은 코어가 인라인으로 걸고 끝나면 정리한다. TS가 아닌 프로젝트는 타입을 벗겨 .js로 저장한다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { useFlipList } from './useFlipList'

const Menu = () => {
  const [items, setItems] = useState(['칼국수', '수제비', '냉모밀', '만두'])
  const { containerRef } = useFlipList<HTMLUListElement>()

  return (
    <>
      <button type="button" onClick={() => setItems((prev) => [...prev].reverse())}>
        순서 뒤집기
      </button>
      <ul ref={containerRef}>
        {items.map((item) => (
          <li key={item} data-flip-id={item}>
            {item}
          </li>
        ))}
      </ul>
    </>
  )
}
```

`data-flip-id`는 재배치 전후의 같은 항목을 잇는 열쇠다 — React의 key와 같은 값을 쓰면 된다.

## 사용 방법 — 순수 JS (React 없음)

DOM을 바꾸기 **직전에** 캡처하고, 바꾼 **직후에** 재생한다:

```js
import { captureFlip } from './captureFlip.js'

const list = document.querySelector('ul')
const flip = captureFlip({ container: list })
list.prepend(list.lastElementChild) // 재배치
flip.play({ durationMs: 300 })
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 속도·이징 | `play({ durationMs, easing })` — 기본 300ms, ease-out 커스텀 커브 |
| 애니메이션 대상 | `data-flip-id`가 있는 직계 자식만 — 없는 항목은 제외된다 |

## 주의사항

- **항목의 크기가 함께 변하는 경우(확장 카드 등)는 범위 밖이다** — 이 코어는 위치 이동만 재생한다. 요소가 커지는 전환이 필요하면 zoom-lightbox 패턴(확대 전환)을 검토하라.
- 새로 추가된 항목은 이동 애니메이션 없이 나타난다 — 등장 연출이 필요하면 enter-exit 패턴과 조합하라.
- **reduced-motion 대응 내장** — 이동 재생을 생략한다(재배치 결과는 이미 화면에 있다).
- (React) 매 렌더 캡처가 부담될 만큼 리스트가 크면(수백 개) 정렬 시점에만 코어를 직접 호출하는 방식으로 내려가라.
