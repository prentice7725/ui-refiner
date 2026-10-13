---
name: page-transition
description: 화면(라우트) 전환 애니메이션(page transition)을 구현한다 — 다음 화면이 오른쪽에서 밀려 들어오고 뒤로 가면 반대로 재생되며, 돌아오면 스크롤 위치가 복원된다. "페이지 넘어갈 때 애니메이션, 화면 전환 효과, 라우트 이동 애니메이션, 앱처럼 밀리는 화면, 뒤로가기 애니메이션" 요청과 SPA 라우팅 화면 이동에 쓴다. 기존 적용분의 화면 전환 속도(빠르게·느리게)·방향 수정에도 쓴다.
---

# page-transition — 화면 전환

라이브 데모: https://guksu.github.io/suta/#/page-transition

## 언제 쓰는가

목록 → 상세, 설정 → 하위 설정처럼 **깊이가 있는 화면 이동**에. 웹에서 화면이 툭 갈아 끼워지는 것과 앱처럼 밀려 들어오는 것의 차이는 취향이 아니라 정보다 — 방향이 "들어왔다/나왔다"를 알려 주기 때문에, 뒤로 가기를 눌렀는지 새 화면으로 갔는지가 눈으로 구분된다.

같은 층위의 이동(탭 사이 전환)에는 쓰지 않는다. 그건 깊이가 아니라 나란한 이동이라 밑줄이 미끄러지는 편이 맞다(tab-indicator 패턴).

**기술 선택:** View Transitions API(`document.startViewTransition`). 브라우저가 화면을 바꾸기 직전의 모습을 사진으로 찍고, 바뀐 뒤 새 화면과 교차 애니메이션을 대신 해 준다 — 두 화면을 동시에 띄우려고 이전 화면을 복제해 두는 재주가 필요 없다. 지원하지 않는 브라우저에서는 전환 없이 즉시 바뀐다(기능은 그대로).

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/runPageTransition.ts` | 코어 — 방향 표시 + View Transitions 호출 + 폴백 | 모든 프로젝트 |
| `assets/usePageStack.ts` | React 훅 — 화면 스택·스크롤 기억 (라우터 없이 쓸 때) | React 프로젝트만 |
| `assets/page-transition.css` | 방향별 밀림 애니메이션 | 모든 프로젝트 |

## 전환 범위가 핵심이다

이 패턴은 **페이지 전체가 아니라 지정한 영역만** 전환한다. `page-transition.css`의 첫 두 규칙이 그 일을 한다:

```css
:root { view-transition-name: none; }   /* 페이지 전체는 전환 대상에서 뺀다 */
[data-page-view] { view-transition-name: page; }  /* 이 영역만 전환한다 */
```

그래서 상단 헤더·하단 탭바는 제자리를 지키고 그 안쪽 내용만 갈아 끼워진다 — 앱에서 탭바가 화면을 따라 움직이지 않는 이유가 이것이다. 페이지 전체를 전환하고 싶으면 첫 규칙을 지우고 `[data-page-view]`의 이름을 `root`로 바꾼다.

`view-transition-name`은 문서 안에서 **유일해야 한다** — `data-page-view`가 붙은 요소는 화면에 하나뿐이어야 한다.

## 사용 방법 — React (라우터 없이)

```tsx
import { usePageStack } from './usePageStack'

const App = () => {
  const stack = usePageStack<{ name: 'list' } | { name: 'detail'; id: string }>({ initial: { name: 'list' } })

  return (
    <div className="app">
      <header className="app-header">
        {stack.canGoBack && <button type="button" onClick={stack.back}>← 뒤로</button>}
        성수동 손칼국수
      </header>

      {/* 전환되는 영역 — 헤더는 이 바깥이라 자리를 지킨다 */}
      <main data-page-view>
        {stack.current.name === 'list' ? (
          <MenuList onSelect={(id) => stack.push({ name: 'detail', id })} />
        ) : (
          <MenuDetail id={stack.current.id} />
        )}
      </main>
    </div>
  )
}
```

`push`는 들어가는 전환(오른쪽에서 덮음), `back`은 나오는 전환(반대 방향)이다. **스크롤도 함께 처리된다** — 들어갈 때 목록의 위치를 기억해 두고, 돌아오면 그 자리로 되돌린다.

목록이 창 전체가 아니라 특정 상자 안에서 스크롤된다면 그 상자를 알려준다:

```tsx
const boxRef = useRef<HTMLDivElement>(null)
const stack = usePageStack({ initial: { name: 'list' }, scrollRef: boxRef })
```

## 사용 방법 — 라우터가 이미 있을 때

`usePageStack` 대신 코어만 쓴다. 라우터의 이동 함수를 감싸고, 방향은 히스토리 깊이로 판단한다.

```tsx
import { flushSync } from 'react-dom'
import { runPageTransition } from './runPageTransition'

const navigate = useNavigate() // react-router 등

const go = (to: string, direction: 'forward' | 'back' = 'forward') =>
  runPageTransition({
    direction,
    // 이 안에서 DOM이 동기적으로 바뀌어야 한다 — 그래서 flushSync다
    update: () => flushSync(() => navigate(to)),
  })
```

브라우저 뒤로 가기 버튼까지 방향을 맞추려면 히스토리 상태에 순번을 심고 비교한다:

```js
// 이동할 때: navigate(to, { state: { index: currentIndex + 1 } })
window.addEventListener('popstate', (event) => {
  const next = event.state?.index ?? 0
  runPageTransition({ direction: next < currentIndex ? 'back' : 'forward', update: applyRoute })
  currentIndex = next
})
```

> **Next.js App Router**는 `useRouter().push()`가 비동기라 `flushSync`로 감쌀 수 없다. 이 경우 라우트가 바뀐 뒤 실행되는 전환(`next-view-transitions` 같은 어댑터)이 필요하며, CSS 부분(`page-transition.css`)은 그대로 쓸 수 있다.

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 전환 속도 | `--page-transition-duration` (`:root`에 선언) | 280ms |
| 뒤로 물러나는 거리 | `--page-transition-shift` (`:root`에 선언) | 30% (100%로 두면 두 화면이 나란히 밀린다) |
| 밀림 대신 다른 연출 | `@keyframes page-in-from-right` 등 4개를 갈아 끼운다 | 좌우 밀림 |
| 전환 범위 | `[data-page-view]`를 어디에 붙이느냐 | 헤더·탭바 제외한 본문 |

```css
/* 변수는 :root에 선언한다 — 전환되는 요소에 걸면 적용되지 않는다 */
:root {
  --page-transition-duration: 220ms;
}
```

## 주의사항

- **커스터마이즈 변수는 `:root`에 선언해야 한다.** `::view-transition-old/new` 가상 요소는 전환되는 요소가 아니라 문서 루트에 붙는다 — 컨테이너나 `[data-page-view]`에 변수를 선언하면 조용히 무시되고 기본값이 쓰인다.
- **탭이 화면에 보이지 않으면 전환은 통째로 건너뛴다**(브라우저 규칙). 백그라운드 탭에서 라우트가 바뀌어도 화면은 정상적으로 갱신된다 — 연출만 빠진다.
- **`update`는 동기적으로 DOM을 바꿔야 한다.** React라면 `flushSync`가 필수다. 그냥 `setState`하면 브라우저가 사진을 찍고 콜백이 끝난 뒤에야 화면이 바뀌어, 전환이 "안 바뀐 화면 → 안 바뀐 화면"이 된다.
- **미지원 브라우저에서는 전환이 없다.** 화면은 정상적으로 바뀐다 — 기능이 아니라 연출만 빠진다. 폴백 애니메이션을 따로 만들지 않은 것은 의도다(두 벌의 전환 코드는 반드시 어긋난다).
- **스크롤 복원은 DOM을 바꾸는 그 순간에 한다.** 전환이 끝난 뒤 되돌리면 애니메이션이 끝나고 화면이 한 번 튄다. `usePageStack`이 그 순서를 지킨다.
- **`usePageStack`은 라우터가 아니다.** URL을 바꾸지 않으므로 새로고침하면 첫 화면으로 돌아가고, 특정 화면을 링크로 공유할 수 없다. 화면 상태가 URL에 있어야 하는 서비스라면 라우터를 쓰고 코어만 가져다 쓴다.
- **전환 중 사용자 입력은 잠긴다**(View Transitions API의 동작). 그래서 280ms를 넘기지 않는 편이 좋다 — 길수록 "느린 앱"이 된다.
- **reduced-motion 대응 내장** — 좌우 밀림 대신 120ms 겹침으로 바뀐다. 전환을 아예 없애지 않는 이유는, 갑자기 내용만 바뀌면 같은 화면인지 다른 화면인지 알기 어렵기 때문이다.
