---
name: cart-fly
description: 담기 버튼을 누르면 상품 이미지가 장바구니 아이콘으로 포물선을 그리며 날아가 들어가는 애니메이션(add to cart fly)을 구현한다. "장바구니 담기 애니메이션, 카트로 날아가는 효과, 담을 때 슝 가는 효과, 아이템 플라이" 요청과 커머스 담기·찜 인터랙션에 쓴다. 기존 적용분의 속도·궤적 수정에도 쓴다.
---

# cart-fly — 카트 플라이

라이브 데모: https://guksu.github.io/suta/#/cart-fly

## 언제 쓰는가

상품을 장바구니에 담는 순간, 상품의 잔상(고스트)이 장바구니 버튼으로 날아가는 피드백. "담겼다"는 결과가 화면 어디에 반영됐는지(장바구니 위치)를 시선으로 안내한다.

**기술 선택:** 포물선 궤적을 keyframes 없이 만든다 — **바깥 요소는 가로를 등속(linear)으로, 안쪽 요소는 세로를 가속(ease-in)으로** 움직이면 두 축이 합쳐져 곡선이 된다. transform·opacity만 쓰고(GPU), 고스트는 도착 시 스스로 정리된다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/flyToTarget.ts` | 코어 — 고스트 생성·2축 비행·정리 | 모든 프로젝트 |
| `assets/useCartFly.ts` | React 훅 | React 프로젝트만 |

CSS 파일은 없다 — 고스트 스타일은 코어가 인라인으로 관리한다(복사 파일 하나로 완결). TS가 아닌 프로젝트는 타입을 벗겨 .js로 저장한다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { useCartFly } from './useCartFly'
import { Icon } from './Icon' // layout-principles의 선 아이콘 한 벌 — 이모지로 대신하지 않는다

const Shop = () => {
  const [count, setCount] = useState(0)
  const { targetRef, flyFrom } = useCartFly<HTMLButtonElement>()

  const addToCart = (event: React.MouseEvent) => {
    const card = (event.currentTarget as HTMLElement).closest('.product-card') as HTMLElement
    flyFrom({ source: card, onArrive: () => setCount((prev) => prev + 1) })
  }

  return (
    <>
      <button ref={targetRef} type="button" aria-label={`장바구니 ${count}개`}>
        <Icon name="cart" /> {count}
      </button>
      <div className="product-card">
        <img src="/photos/janchi.webp" alt="잔치국수" width={96} height={96} />
        <button type="button" onClick={addToCart}>담기</button>
      </div>
    </>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { flyToTarget } from './flyToTarget.js'

const cart = document.querySelector('#cart-button')
document.querySelectorAll('.product-card .add').forEach((button) => {
  button.addEventListener('click', () => {
    flyToTarget({
      source: button.closest('.product-card'),
      target: cart,
      onArrive: () => bumpCartCount(),
    })
  })
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 비행 시간 | `durationMs` (기본 600ms — 화면 대각선 거리 기준. 짧은 거리는 400ms대가 무난) |
| 궤적 방향 | `arc` — `'horizontal-first'`(기본): 옆으로 갔다가 끝에서 상승(j자) / `'vertical-first'`: 먼저 떠올랐다가 옆으로(r자). 축 이징을 서로 바꿔 만든다 |
| 카운트 증가 시점 | `onArrive` — 도착 순간에 증가시켜야 인과가 보인다(누르자마자 증가시키면 비행이 무의미해진다) |
| 고스트 모양 | `source`에 무엇을 주느냐가 곧 모양 — 카드 전체 대신 썸네일 요소를 주면 가볍다 |

## 주의사항

- **카운트는 onArrive에서 올려라** — 상태(진짜 장바구니 데이터)는 클릭 즉시 갱신하되, 화면의 뱃지 숫자만 도착에 맞추는 분리가 정석이다. 네트워크 요청을 비행에 묶지 마라.
- 고스트는 `position: fixed`다 — 스크롤 컨테이너 안이 아니라 뷰포트 좌표로 난다. 비행 중 스크롤되면 목적지가 이미 이동해 있을 수 있다(600ms 안에서는 체감 미미).
- **reduced-motion 대응 내장** — 비행을 생략하고 즉시 onArrive를 부른다.
- 연타하면 고스트가 여러 개 난다 — 의도된 동작이다(각자 정리됨). 막고 싶으면 호출부에서 스로틀하라.
