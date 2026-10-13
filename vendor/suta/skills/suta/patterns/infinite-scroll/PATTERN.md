---
name: infinite-scroll
description: 목록 끝에 닿으면 다음 페이지를 자동으로 불러오는 무한 스크롤(infinite scroll)을 구현한다 — 미리 로드하고, 중복 호출·연쇄 로딩·실패 폭주를 막는다. "무한 스크롤, 스크롤 내리면 더 불러오기, 끝까지 내리면 다음 페이지 자동 로딩, 피드 자동 페이지네이션, 끝에서 더보기" 요청과 피드·검색 결과·상품 목록에 쓴다. 미리 로드 거리·로딩 표시 수정에도 쓴다.
---

# infinite-scroll — 무한 스크롤

라이브 데모: https://guksu.github.io/suta/#/infinite-scroll

## 언제 쓰는가

피드·검색 결과·상품 목록처럼 **끝을 정하지 않고 계속 이어지는 목록**에. 사용자가 "다음 페이지" 버튼을 찾지 않아도 스크롤만으로 이어진다.

반대로 **쓰지 말아야 할 곳**이 분명하다: 푸터에 중요한 링크가 있는 페이지, 사용자가 "3페이지 3번째" 같은 위치를 기억해야 하는 목록, 인쇄·검색이 필요한 문서. 목록이 무한히 자라면 그 아래에 있는 것들에는 영원히 닿지 못한다.

**기술 선택:** IntersectionObserver. 스크롤 이벤트를 듣지 않는다 — 스크롤 핸들러는 프레임마다 깨어나 위치를 계산하고 스로틀이 필요하지만, 옵저버는 "감시 요소가 보이기 시작함"만 알려준다. 라이브러리 불필요.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createInfiniteScroll.ts` | 코어 — 감시·중복 차단·연쇄 로딩·실패 처리 | 모든 프로젝트 |
| `assets/useInfiniteScroll.ts` | React 훅 | React 프로젝트만 |
| `assets/infinite-scroll.css` | 감시 요소·로딩 스피너·새 항목 등장 | 모든 프로젝트 |

## 무엇을 대신 막아 주는가

직접 만들면 대개 이 셋에서 무너진다.

| 함정 | 증상 | 코어의 처리 |
|------|------|------------|
| 중복 호출 | 같은 페이지가 두 번 붙는다 | 로딩 중에는 다시 부르지 않는다 |
| 연쇄 로딩 끊김 | 한 페이지로 화면이 안 차면 거기서 멈춘다 | 페이지를 붙인 뒤 관찰을 새로 걸어 이어서 부른다 |
| 실패 폭주 | 요청이 실패할 때마다 다시 부르며 서버를 때린다 | 실패하면 멈춘다 — `retry()`를 부를 때까지 |

## 사용 방법 — React

1. 세 파일을 프로젝트로 복사한다(TS가 아니면 타입을 벗겨 `.js`로).
2. 목록 **끝에** 빈 감시 요소를 두고 `sentinelRef`를 단다. 마지막 항목에 달면 안 된다 — 항목이 지워지면 감시가 함께 사라진다.

```tsx
import { useInfiniteScroll } from './useInfiniteScroll'
import './infinite-scroll.css'

const PAGE_SIZE = 20 // 서버가 한 번에 주는 개수 — 등장 순서를 매기는 데만 쓴다

const MenuFeed = () => {
  const [items, setItems] = useState<Menu[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const feed = useInfiniteScroll({
    hasMore,
    loadMore: async () => {
      const page = await fetchMenus({ cursor })
      setItems((prev) => [...prev, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(Boolean(page.nextCursor))
    },
  })

  return (
    <>
      <ul>
        {items.map((item, index) => (
          <li
            key={item.id}
            /* 첫 페이지는 이미 있던 것이므로 연출하지 않는다 */
            className={index >= PAGE_SIZE ? 'infinite-item-new' : undefined}
            style={{ '--infinite-item-order': index % PAGE_SIZE } as CSSProperties}
          >
            {item.name}
          </li>
        ))}
      </ul>

      <div ref={feed.sentinelRef} className="infinite-sentinel" aria-hidden="true" />

      <div className="infinite-footer" role="status" aria-live="polite">
        {feed.status === 'loading' && (
          <>
            <span className="infinite-spinner" aria-hidden="true" />
            불러오는 중…
          </>
        )}
        {feed.status === 'error' && (
          <>
            불러오지 못했습니다
            <button type="button" onClick={feed.retry}>다시 시도</button>
          </>
        )}
        {feed.status === 'done' && <span>마지막입니다</span>}
        {feed.status === 'idle' && <button type="button" onClick={feed.loadNow}>더 보기</button>}
      </div>
    </>
  )
}
```

**"더 보기" 버튼을 함께 두는 것은 장식이 아니다** — 아래의 접근성 항목을 보라.

### 스크롤 컨테이너가 따로 있을 때

목록이 `overflow: auto`인 상자 안에서 스크롤된다면 그 상자를 알려줘야 한다. 기본값은 뷰포트다.

```tsx
const boxRef = useRef<HTMLDivElement>(null)
const feed = useInfiniteScroll({ hasMore, loadMore, rootRef: boxRef })
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { createInfiniteScroll } from './createInfiniteScroll.js'

const feed = createInfiniteScroll({
  sentinel: document.querySelector('.infinite-sentinel'),
  hasMore: () => Boolean(nextCursor),
  loadMore: async () => {
    const page = await fetchMenus({ cursor: nextCursor })
    list.append(...page.items.map(renderItem))
    nextCursor = page.nextCursor
  },
  onStatusChange: (status) => {
    footer.dataset.status = status
  },
})
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 미리 부르는 거리 | `rootMarginPx` | 400px (화면 밖 400px에 다가오면 부른다) |
| 스크롤 컨테이너 | `rootRef` / `root` | 뷰포트 |
| 새 항목 등장 연출 | 새로 붙은 항목에 `.infinite-item-new` 클래스 | 8px 위로 떠오르며 260ms 페이드 인 |
| 등장 순서 간격 | 항목마다 `--infinite-item-order`에 그 페이지 안에서의 순번 | 40ms씩 차례로 (순번을 안 주면 동시에) |
| 로딩·끝 문구 | 푸터를 직접 그린다 — 코어는 상태만 준다 | - |

`rootMarginPx`를 키우면 로딩을 거의 못 보게 되지만, 사용자가 안 볼 페이지까지 미리 받아 데이터를 쓴다. 목록 한 화면 높이 정도(300~600px)가 무난하다.

## 주의사항

- **"더 보기" 버튼을 함께 두라.** 무한 스크롤만 있으면 키보드 사용자는 목록을 다 지나야 푸터에 닿고, 스크린 리더 사용자는 "내려서 보이게 하는" 조작 자체가 어렵다. 자동 로딩은 편의로 얹고, 명시적 버튼을 진짜 경로로 남겨 두는 편이 안전하다. `loadNow()`가 그 버튼용이다.
- **로딩·완료는 `role="status"`로 알린다.** 화면에 스피너만 도는 것은 보이는 사람에게만 정보다.
- **스크롤 위치 복원은 이 패턴의 범위 밖이다.** 상세 화면에 다녀왔을 때 원래 위치로 돌아가려면 목록·커서·스크롤 위치를 캐시에 남겨야 하고, 그것은 UI가 아니라 데이터 설계 문제다.
- **항목이 수천 개로 자라면 DOM 자체가 무거워진다.** 그때는 가상 스크롤(화면에 보이는 것만 그리기)로 내려가야 하며, 이 패턴은 그 지점까지를 담당한다.
- **감시 요소의 높이를 0으로 두지 말라.** `infinite-scroll.css`가 1px을 주는 이유다 — 높이 0인 요소는 교차 판정이 불안정하다.
- **reduced-motion 대응 내장** — 새 항목 등장 연출은 사라지고 스피너 회전만 느리게 남는다(진행 중이라는 유일한 신호).
- IntersectionObserver가 없는 환경(아주 오래된 브라우저·SSR)에서는 자동 로딩이 꺼지고 `loadNow()` 버튼만 동작한다 — 목록이 사라지지는 않는다.
