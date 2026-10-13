---
name: edge-swipe-back
description: iOS swipe back — 화면 왼쪽 가장자리를 오른쪽으로 끌어 뒤로가기 하는 인터랙티브 제스처를 구현한다. 현재 화면이 손가락을 따라 밀리고 뒤에 이전 화면이 따라 나오며, 놓으면 거리·속도로 판정해 끝까지 가거나 되돌아온다. "가장자리 스와이프 뒤로가기, 밀어서 뒤로가기, iOS 백 제스처, 화면 끌어서 뒤로, 스와이프 백" 요청에 쓴다. 기존 적용분의 임계값·가장자리 폭·스프링 수정에도 쓴다.
---

# edge-swipe-back — 가장자리 스와이프 뒤로가기

라이브 데모: https://guksu.github.io/suta/#/edge-swipe-back

## 언제 쓰는가

목록 → 상세 → 하위 상세처럼 **깊이가 있는 화면 스택**에서, 뒤로 버튼을 찾지 않고 왼쪽 가장자리를 끌어 돌아가는 경험. iOS의 내비게이션 컨트롤러가 이 관례를 만들었고 지금은 안드로이드도 같은 손짓을 쓴다. 버튼식 뒤로가기(`page-transition`)와 다른 점은 **손가락이 화면을 쥐고 있다**는 것이다 — 끌던 도중에 마음을 바꿔 되돌릴 수 있고, 얼마나 끌었는지가 곧 얼마나 돌아갔는지다.

반대 의견: 웹에는 브라우저 자체의 뒤로가기 제스처가 이미 있다(Safari·Chrome 모바일). 그 제스처는 **브라우저 히스토리**를 움직이고, 이 패턴은 **앱 안의 화면 스택**(모달·상세 패널·설정 하위 화면처럼 URL이 바뀌지 않는 층)을 움직인다. URL이 바뀌는 페이지 이동이라면 브라우저 제스처에 맡기고 이 패턴은 쓰지 않는다.

**기술 선택:** Pointer Events + 스프링(`spring-physics` 코어 복사본). 드래그 중에는 CSS transition을 끄고 현재 화면의 `translateX(px)`·이전 화면의 `translateX(%)`·어둠의 `opacity`를 프레임마다 직접 쓴다. 놓은 뒤 이동은 **CSS transition이 아니라 JS 스프링**이다 — 놓는 순간의 손가락 속도를 이어받아야 "던진 대로" 움직이고, 스프링 도중 다시 잡아도 그 자리에서 이어지기 때문이다. 정지 상태의 모양(이전 화면 −30%, 어둠 0.4)은 CSS 변수가 정본이고 코어가 그 변수를 읽는다. 라이브러리 없음.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/edgeSwipeCore.ts` | 순수 계산 — 가장자리 판정·진행도·커밋 판정·이전 화면 프레임 | 모든 프로젝트 |
| `assets/createEdgeSwipe.ts` | 코어 — 포인터 캡처·축 잠금·드래그 추종·커밋/취소 스프링 | 모든 프로젝트 |
| `assets/spring.ts` · `assets/animateSpring.ts` | 스프링 코어 (`spring-physics` 원본의 복사본 — 헤더 유지) | 모든 프로젝트 |
| `assets/edge-swipe-back.css` | 상자·화면·어둠 레이아웃, 정지 상태, reduced-motion | 모든 프로젝트 |
| `assets/useEdgeSwipeBack.ts` | React 훅 (ref 4개, onBack을 flushSync로 감쌈) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다 — 로직은 그대로다.

## 구조 — 상자 하나에 세 겹

```html
<div class="edge-swipe">                     <!-- 포인터를 받는 상자: position relative, overflow hidden -->
  <div class="edge-swipe-underlay">이전 화면</div>   <!-- 맨 아래(z 1), 정지 상태에서 −30% -->
  <div class="edge-swipe-dim"></div>               <!-- 어둠(z 2), 정지 상태에서 0.4, pointer-events none -->
  <div class="edge-swipe-screen">현재 화면</div>     <!-- 맨 위(z 3), 왼쪽 그림자, 불투명 배경 -->
</div>
```

세 요소는 **한 번 마운트하면 그대로 두고 안의 내용만 바꾼다.** 코어가 요소를 붙잡고 있어서, 화면이 바뀔 때 요소를 새로 만들면(React라면 `key`로 갈아 끼우면) 코어는 사라진 요소를 움직인다. 현재 화면에는 반드시 불투명한 배경(`--edge-screen-bg`)을 준다 — 투명하면 아래 화면이 비친다.

## 사용 방법 — React (page-transition과 함께)

들어갈 때는 `page-transition`의 `runPageTransition`으로 오른쪽에서 덮으며 들어오고, 제스처로 돌아올 때는 **전환 없이 즉시 pop**한다 — 화면은 이미 손가락이 오른쪽 끝까지 밀어 둔 상태라, 여기서 뒤로 전환을 한 번 더 재생하면 두 번 움직인다. 버튼으로 돌아갈 때는 손가락이 움직인 적이 없으니 뒤로 전환을 재생한다.

```tsx
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useEdgeSwipeBack } from './useEdgeSwipeBack'
import { runPageTransition } from './runPageTransition' // page-transition 패턴
import './page-transition.css'

type Screen = { name: 'list' } | { name: 'detail'; id: string }

const App = () => {
  const [stack, setStack] = useState<Screen[]>([{ name: 'list' }])
  const current = stack[stack.length - 1]
  const previous = stack.length > 1 ? stack[stack.length - 2] : null

  const push = (screen: Screen) =>
    runPageTransition({ direction: 'forward', update: () => flushSync(() => setStack((prev) => [...prev, screen])) })
  const popNow = () => setStack((prev) => prev.slice(0, -1)) // 제스처 커밋 — 훅이 flushSync로 감싼다
  const popWithTransition = () =>
    runPageTransition({ direction: 'back', update: () => flushSync(() => setStack((prev) => prev.slice(0, -1))) })

  const { containerRef, screenRef, underlayRef, dimRef } = useEdgeSwipeBack({ canGoBack: stack.length > 1, onBack: popNow })

  return (
    <div className="app">
      <header>{stack.length > 1 && <button type="button" onClick={popWithTransition}>← 뒤로</button>}</header>
      <div ref={containerRef} data-page-view className="edge-swipe">
        <div ref={underlayRef} className="edge-swipe-underlay" aria-hidden="true">{previous && <Render screen={previous} />}</div>
        <div ref={dimRef} className="edge-swipe-dim" aria-hidden="true" />
        <div ref={screenRef} className="edge-swipe-screen"><Render screen={current} onSelect={(id) => push({ name: 'detail', id })} /></div>
      </div>
    </div>
  )
}
```

- `onBack`은 setState만 하면 된다 — 훅이 `flushSync`로 감싸 DOM을 동기적으로 바꾼 뒤 코어가 transform을 걷어 낸다. 이 순서가 어긋나면 옛 화면이 제자리로 튀어 한 프레임 깜빡인다.
- `usePageStack`을 그대로 쓰지 않는 이유: 그 훅의 `back`은 항상 뒤로 전환을 재생한다. 즉시 pop이 필요한 제스처 경로에는 위처럼 상태를 직접 쥔다(`push`·`popWithTransition`은 `usePageStack`과 같은 동작이다).
- 이전 화면(`underlay`)은 `aria-hidden` — 화면 아래에 있어 보조 기술이 읽으면 혼란스럽다. 뒤로가기의 접근 가능한 경로는 헤더의 **← 뒤로 버튼**이다. 제스처를 쓸 수 없는 사용자(키보드·스위치·일부 보조 기기)를 위해 버튼을 반드시 남긴다.

## 사용 방법 — 순수 JS (React 없음)

```js
import { createEdgeSwipe } from './createEdgeSwipe.js'

const container = document.querySelector('.edge-swipe')
const swipe = createEdgeSwipe({
  container,
  screen: container.querySelector('.edge-swipe-screen'),
  underlay: container.querySelector('.edge-swipe-underlay'),
  dim: container.querySelector('.edge-swipe-dim'),
  canGoBack: () => stack.length > 1,
  onBack: () => {
    // 여기서 **동기적으로** DOM을 바꾼다 — 현재 화면 내용을 이전 화면으로, 이전 화면을 그 전 화면으로
    stack.pop()
    renderInto({ screen, underlay })
  },
})
// 화면을 그만 쓸 때
swipe.destroy()
```

`swipe.setOptions({ threshold: 0.3 })`로 임계·가장자리 폭·스프링을 도중에 바꿀 수 있다(다시 만들면 진행 중인 스프링이 끊긴다).

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 이전 화면이 물러나 있는 거리 | `--edge-shift` (상자에 선언, 코어가 읽는다) 또는 옵션 `shift`(0~1) | 30% (100%면 두 화면이 나란히 밀린다) |
| 이전 화면 위 어둠 | `--edge-dim` 또는 옵션 `dimOpacity` | 0.4 |
| 현재 화면 배경 | `--edge-screen-bg` | #fff |
| 가장자리 폭 | `edgeWidth` (px) | 24 |
| 커밋 거리 임계 | `threshold` (폭 대비 0~1) | 0.4 |
| 커밋 속도 임계 | `velocityThreshold` (px/ms — 짧게 끌어도 빠르게 튕기면 커밋) | 0.5 |
| 놓은 뒤 스프링 | `config` (`SpringConfig`) | stiffness 300 · damping 34 (거의 임계 감쇠 — 튀지 않고 빠르게 정착) |
| 그림자 | `.edge-swipe-screen`의 `box-shadow` | `-8px 0 24px rgba(0,0,0,.2)` |

왼쪽으로 되튕기며 놓으면(−0.3px/ms 이하) 거리를 넘겼어도 취소한다 — "끌다가 마음을 바꾼" 손짓을 존중하는 iOS 관례다. 바꾸려면 `edgeSwipeCore.ts`의 `CANCEL_VELOCITY`.

## 주의사항

- **Safari·Chrome의 전체 화면 히스토리 제스처는 막을 수 없다.** 모바일 브라우저는 화면 맨 가장자리에서 시작한 스와이프를 자기 뒤로가기로 먼저 가져간다 — 웹 페이지는 그 이벤트를 받지 못한다. 그래서 이 패턴은 **앱 안의 화면 스택(모달·상세·하위 설정)에만 쓰고 브라우저 히스토리에는 손대지 않는다.** 상자에 `overscroll-behavior-x: contain`과 `touch-action: pan-y`를 두어 크롬 안드로이드의 가로 당김 제스처는 상자 안에서 막지만, iOS Safari의 가장자리 제스처는 그래도 브라우저가 이긴다. 대안: 화면 폭 전체가 아니라 헤더 아래 상자에만 쓰거나, standalone PWA(브라우저 제스처 없음)에서 쓰거나, `edgeWidth`를 넓혀(48px) 브라우저가 가져간 뒤 남는 영역에서도 잡히게 한다.
- **`onBack`은 동기적으로 DOM을 바꿔야 한다.** React 훅은 `flushSync`로 감싸 준다. 순수 JS에서는 `onBack` 안에서 바로 렌더한다. 비동기로 바꾸면 코어가 transform을 걷어 낸 순간 옛 화면이 제자리로 튄다.
- **세 요소를 `key`로 갈아 끼우지 말 것.** 코어는 마운트 시점의 요소를 붙잡는다. 내용만 바꾼다.
- **현재 화면 안에 가로 스크롤·가로 제스처(캐러셀 등)가 있으면** 가장자리 폭 안에서 시작한 것만 이 패턴이 가져간다(나머지는 통과). 캐러셀이 화면 왼쪽 끝에 붙어 있으면 그 24px은 캐러셀이 받지 못한다 — 캐러셀에 왼쪽 여백을 두거나 `edgeWidth`를 줄인다.
- **세로 스크롤과의 공존은 축 잠금으로 푼다** — 처음 6px의 방향이 세로면 이 드래그를 포기하고 포인터 캡처를 풀어 스크롤이 이어진다. `touch-action: pan-y`가 그 전제다 — 제거 금지.
- **드래그 중 화면 안의 클릭은 발생하지 않는다** — 포인터 캡처가 상자로 옮겨 가므로 버튼 위에서 끌어도 버튼이 눌리지 않는다. 6px 안에서 놓으면 보통의 탭이다.
- **reduced-motion 대응 내장** — 드래그 추종은 그대로 두고(사용자가 움직이는 만큼만 움직인다), 놓으면 스프링 없이 즉시 커밋/취소한다(코어가 `matchMedia`로 판정). CSS는 그림자를 없앤다. 드래그까지 끄지 않는 이유는, 손가락을 따라오는 움직임은 "예상 못 한 모션"이 아니라 사용자 자신의 손짓이기 때문이다.
- 두 손가락(핀치)과 함께 쓰려면 `pointerdown`에서 활성 포인터 수를 세어 두 번째 포인터를 막아야 한다 — 포함하지 않았다.
