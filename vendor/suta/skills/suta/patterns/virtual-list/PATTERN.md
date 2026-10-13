---
name: virtual-list
description: 항목이 수천·수만 개여도 화면에 보이는 구간만 그리는 가상 스크롤 목록(virtual list, virtualized/windowing)을 구현한다. "가상 스크롤, 리스트 성능, 목록이 느려요·버벅여요, 항목 많을 때 렌더링, 보이는 것만 렌더링" 요청과 긴 목록의 스크롤 성능 개선에 쓴다. 기존 적용분의 항목 높이·여유분(overscan) 수정에도 쓴다.
---

# virtual-list — 가상 스크롤

라이브 데모: https://guksu.github.io/suta/#/virtual-list

## 언제 쓰는가

**항목이 많아 스크롤이 끊길 때.** 목록 1만 개를 전부 그리면 DOM 노드가 1만 개 생기고, 브라우저는 보이지도 않는 것들의 레이아웃·스타일을 계속 계산한다.

숫자로 기준을 잡자면 — 항목이 **수백 개까지는 그냥 그리는 편이 낫다**. 가상 스크롤은 공짜가 아니다: 항목 높이가 고정돼야 하고, Ctrl+F로 페이지 내 검색이 안 되고, 스크린 리더가 목록 전체를 훑지 못한다. 그 비용을 치를 만큼 느려졌을 때 쓴다.

infinite-scroll 패턴과는 **짝**이다: 무한 스크롤이 "언제 더 불러올까"를 다루고, 이 패턴이 "불러온 것을 어떻게 감당할까"를 다룬다. 둘을 같이 쓰면 목록이 끝없이 자라도 DOM은 일정하게 유지된다.

**기술 선택:** 순수 계산 + `transform`. 라이브러리 없이, 스크롤 위치에서 보이는 구간을 구하고 그 묶음만 그린다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/virtualRange.ts` | 코어 — 보이는 구간 계산 (순수 함수, DOM 없음) | 모든 프로젝트 |
| `assets/useVirtualList.ts` | React 훅 — 스크롤·크기 변화 추적 | React 프로젝트만 |
| `assets/virtual-list.css` | 뷰포트·전체 높이 상자·그린 묶음 | 모든 프로젝트 |

## 어떻게 동작하나 — 세 겹

```
.virtual-viewport   스크롤되는 상자 (높이 고정)
└ .virtual-sizer    전체 높이(개수 × 항목 높이)만큼 자리만 차지하는 빈 상자
  └ .virtual-window 실제로 그린 20여 개 — transform으로 제자리에 밀어 놓는다
```

빈 상자가 **스크롤바에 진짜 길이**를 주고, 그린 묶음이 스크롤을 따라 이동한다. 사용자에게는 1만 개가 다 있는 것처럼 보이지만 DOM에는 20여 개만 있다.

## 사용 방법 — React

```tsx
import { useVirtualList } from './useVirtualList'

const ITEM_HEIGHT = 56

const OrderList = ({ orders }: { orders: Order[] }) => {
  const list = useVirtualList({ itemCount: orders.length, itemHeight: ITEM_HEIGHT })

  return (
    <div ref={list.containerRef} className="virtual-viewport">
      <div className="virtual-sizer" style={{ height: list.range.totalHeight }}>
        <div className="virtual-window" style={{ transform: `translateY(${list.range.offsetY}px)` }}>
          {list.indexes.map((index) => (
            <div
              key={orders[index].id}
              className="virtual-item"
              style={{ '--virtual-item-height': `${ITEM_HEIGHT}px` } as CSSProperties}
            >
              {orders[index].name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

`scrollToIndex(index)`로 특정 항목으로 보낼 수 있다(예: "맨 위로", 검색 결과로 이동).

## 사용 방법 — 순수 JS (React 없음)

계산만 가져다 쓰고 DOM은 직접 갱신한다:

```js
import { virtualRange } from './virtualRange.js'

const render = () => {
  const { startIndex, endIndex, offsetY, totalHeight } = virtualRange({
    scrollTop: viewport.scrollTop,
    viewportHeight: viewport.clientHeight,
    itemHeight: 56,
    itemCount: orders.length,
  })
  sizer.style.height = `${totalHeight}px`
  window.style.transform = `translateY(${offsetY}px)`
  window.replaceChildren(...orders.slice(startIndex, endIndex + 1).map(renderRow))
}

viewport.addEventListener('scroll', render, { passive: true })
render()
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 항목 높이 | `itemHeight` (CSS `--virtual-item-height`와 **같은 값**이어야 한다) | - |
| 여유분 | `overscan` — 화면 밖으로 더 그려 둘 개수 | 3 |
| 빠른 스크롤 보정 | `maxLead` — 진행 방향으로 미리 그릴 최대 개수 (0이면 끔) | 24 |
| 상자 높이 | `--virtual-height` | 400px |

`overscan`은 **항상** 더 그리는 양이라 키우면 평소 비용이 늘어난다. 3~5가 무난하고, 항목이 무거우면(이미지·차트) 오히려 줄이는 편이 낫다.

`maxLead`는 다르다 — **빠르게 스크롤할 때만, 가는 방향으로만** 늘어난다. 훅이 스크롤 속도를 재서 "다음 120ms 동안 지나갈 만큼"을 미리 그리고, 멈추면 0으로 돌아온다. 지나온 방향은 늘리지 않으므로 평소 비용이 거의 없다.

## 빈 칸이 스치는 문제

빠르게 밀어 넘기면 목록 아래쪽이 잠깐 비어 보일 수 있다. 이건 구현의 버그가 아니라 **웹의 구조적 한계**다: 브라우저는 스크롤을 별도 스레드에서 즉시 처리하는 반면, 무엇을 그릴지 정하는 것은 자바스크립트라 한 박자 늦는다. 네이티브 목록이 이 문제가 덜한 이유는 스크롤과 셀 재사용이 같은 곳에서 함께 일어나기 때문이다.

DOM에서 할 수 있는 것은 **틈을 줄이는 것**까지다:

| 방법 | 효과 |
|------|------|
| `maxLead`(기본 24) | 손가락으로 밀어 넘기는 정도의 속도에서는 대부분 사라진다 |
| `overscan`을 3~5로 | 느린 스크롤의 경계 깜빡임을 없앤다 |
| 항목을 가볍게 (이미지 지연 로딩, 그림자·필터 줄이기) | 렌더가 빨라져 따라잡는 시간이 준다 |
| **먼 거리는 `behavior: 'smooth'`를 쓰지 않는다** | 아래 항목 참고 |

`scrollToIndex(0, 'smooth')`로 5만 개짜리 목록의 맨 위로 보내면 브라우저가 초당 수천 픽셀로 화면을 옮기는데, 어떤 자바스크립트도 그 속도를 따라갈 수 없어 이동 내내 빈 칸이 보인다. **먼 거리는 즉시 이동(기본값 `'auto'`)이 맞다** — 부드러운 스크롤은 한두 화면 이내에서만 쓴다.

## 주의사항

- **항목 높이가 모두 같아야 한다.** 이 계산의 전제다. 높이가 제각각인 목록(글 길이에 따라 달라지는 카드)은 각 항목을 측정해 누적 높이를 관리해야 하며, 그건 이 패턴의 범위 밖이다 — 그럴 땐 `@tanstack/react-virtual` 같은 라이브러리가 맞다.
- **CSS의 `--virtual-item-height`와 훅의 `itemHeight`가 어긋나면 목록이 서서히 밀린다.** 상수 하나를 두 곳에 전달하라(위 예시처럼).
- **Ctrl+F로 화면에서 찾을 수 없다.** 그려지지 않은 항목은 존재하지 않기 때문이다. 검색이 중요한 목록이라면 앱 안에 검색 기능을 함께 두어야 한다(search-suggest 패턴).
- **스크린 리더는 목록 전체 개수를 알 수 없다.** 컨테이너에 `role="list"`와 함께 `aria-rowcount`(또는 안내 문구)로 전체 개수를 알려 주고, 각 항목에 `aria-posinset`·`aria-setsize`를 주면 "1000개 중 30번째"로 읽힌다.
- **스크롤할 때마다 리렌더하지 않는다** — 구간이 실제로 바뀔 때만 상태를 갱신한다. 이 규칙을 깨면(스크롤 위치를 state에 넣는 등) 가상 스크롤을 쓰는 이유가 사라진다.
- **애니메이션이 없는 패턴이다** — 스크롤을 따라 항목이 나타나는 것은 연출이 아니라 위치 계산이라, `prefers-reduced-motion`으로 뺄 모션 자체가 없다.
- 항목 안에 포커스가 있는 요소(입력·버튼)를 두고 그 항목이 화면 밖으로 나가면 포커스가 사라진다. 편집 가능한 행이 있는 목록에서는 `overscan`을 넉넉히 주거나 가상 스크롤을 재고하라.
