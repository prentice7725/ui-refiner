---
name: glass-nav
description: 스크롤에 반응하는 유리 GNB(상단 내비게이션 바)를 구현한다 — 맨 위에서는 투명했다가 내려가면 유리로 변하고, 아래로 스크롤하면 숨고 올리면 나타나거나, 링크가 접혀 알약 하나로 줄어든다(glass nav, scroll-aware header). 링크를 누르면 그 섹션으로 스크롤하고 활성 알약이 따라온다(scroll spy). "스크롤하면 헤더 숨기기, 내리면 GNB 사라지고 올리면 나오게, 상단 바 유리로, 애플식 알약 탭 바, GNB 누르면 해당 메뉴로 이동" 요청에 쓴다. 기존 적용분의 임계 거리·모드 수정에도 쓴다.
---

# glass-nav — 스크롤에 반응하는 유리 GNB

라이브 데모: https://guksu.github.io/suta/#/glass-nav

## 언제 쓰는가

상단 바가 콘텐츠 위에 "떠 있다"는 느낌을 주고, 읽는 동안에는 자리를 비켜 줄 때. 세 관례를 한 패턴에 모았다.

| 모드 | 동작 | 어디서 보이나 |
|------|------|---------------|
| `elevate` | 맨 위에서는 투명, 조금 내려가면 유리(배경·흐림·테두리)로 변한다 | 배민 홈(배너 위 투명 → 스크롤 시 바), 카카오맵 검색 바 |
| `hide` | 아래로 스크롤하면 위로 숨고, 조금이라도 위로 올리면 다시 내려온다 | 배민·카카오 목록 화면 |
| `compact` | 아래로 스크롤하면 링크가 접혀 알약 하나(브랜드 + 현재 메뉴)로 줄고, 위로 올리면 펼쳐진다 | iOS 26 Liquid Glass 탭 바 |

`elevate`는 항상 켜져 있고, `hide`와 `compact` 중 하나를 고른다. 반박: 숨는 바는 "언제든 위로 올리면 나온다"를 사용자가 모르면 메뉴를 잃어버린 것처럼 느낀다. 첫 화면에서 한 번은 바를 보여 주고, 맨 위에서는 절대 숨기지 않는다(`hideAfterPx`).

**기술 선택:** 코어는 스크롤 위치와 방향으로 세 상태만 정하고 `data-elevated`·`data-hidden`·`data-compact`를 붙인다(프레임당 한 번, passive). 움직임은 전부 CSS transition이다 — 숨김은 `transform`, 유리 전환은 `background`·`backdrop-filter`, 축소는 `grid-template-columns 1fr→0fr`(accordion의 세로 기법을 가로로). 겉모습만 필요하면 glass-surface 패턴, 큰 제목이 작은 제목으로 바뀌는 헤더는 sticky-header 패턴을 쓴다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/navScrollCore.ts` | 순수 판정 — `reduceNavState` (위치·방향 → 세 상태) | 모든 프로젝트 |
| `assets/navSpyCore.ts` | 순수 계산 — `activeSectionFor`(스크롤 위치 → 활성 섹션)·`scrollTargetFor`(링크 → 스크롤 목표)·`pillFrame` | 모든 프로젝트 |
| `assets/createGlassNav.ts` | 코어 — scroll 리스너·rAF·data 속성·`spy`(링크 클릭 → 섹션 스크롤, 활성 추적)·`setOptions`·`destroy` | 모든 프로젝트 |
| `assets/glass-nav.css` | 투명→유리·숨김·축소 전이, 알약 모양 | 모든 프로젝트 |
| `assets/useGlassNav.ts` | React 훅 (`navRef`, `state`) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useGlassNav } from './useGlassNav'

const TopBar = ({ current }: { current: string }) => {
  const { navRef } = useGlassNav({ mode: 'hide' }) // 페이지 스크롤 기준. 컨테이너가 따로면 containerRef 전달

  return (
    <header ref={navRef} className="gnav">
      <div className="gnav-bar">
        <a className="gnav-brand" href="/">국수집</a>
        <nav className="gnav-links" aria-label="주메뉴">
          <div>
            <a href="/menu" aria-current={current === 'menu' ? 'page' : undefined}>메뉴</a>
            <a href="/stores">매장</a>
            <a href="/orders">주문 내역</a>
          </div>
        </nav>
        <span className="gnav-current" aria-hidden="true">메뉴</span> {/* compact에서만 보이는 현재 메뉴 */}
      </div>
    </header>
  )
}
```

`gnav`는 `position: sticky`라 스크롤 컨테이너의 **첫 자식**으로 둔다. 컨테이너가 `overflow: hidden`인 조상 안에 있으면 sticky가 동작하지 않는다.

## 링크 → 섹션 이동과 활성 추적 (`spy`)

한 페이지 안의 섹션을 GNB 링크로 오갈 때 쓴다. 링크의 `href="#섹션id"`와 같은 `id`를 가진 요소를 스크롤 컨테이너 안에서 찾아 짝짓는다.

```tsx
const { navRef, activeId } = useGlassNav({ mode: 'hide', spy: true }) // activeId: 지금 활성 섹션 id

<nav className="gnav-links" aria-label="주메뉴">
  <div>
    <span className="gnav-pill" aria-hidden="true" /> {/* 선택 — 활성 링크 아래로 미끄러지는 알약 */}
    <a href="#menu">메뉴</a>
    <a href="#stores">매장</a>
    <a href="#orders">주문 내역</a>
  </div>
</nav>
```

| 무엇이 일어나나 | 어떻게 |
|------|------|
| 링크 클릭 | 기본 이동(해시 변경)을 막고, 섹션 시작이 GNB 바로 아래(`offsetPx`, 기본 8) 오도록 `scrollTo({ behavior: 'smooth' })`. reduced-motion이면 즉시 이동 |
| 클릭 스크롤 중 | `lockMs`(기본 900) 동안 바를 숨기거나 줄이지 않고, 활성도 목표 섹션에 고정한다 — 지나가는 섹션마다 알약이 튀지 않게 |
| 사용자 스크롤 | 프레임당 한 번, 시작점이 GNB 아래로 들어온 마지막 섹션을 활성으로. 끝에 닿으면 마지막 섹션 |
| 활성 표시 | 활성 링크에 `aria-current="page"`, `.gnav-current` 텍스트 교체, `.gnav-pill`을 `transform`+`width`로 그 링크 위에 |

`aria-current`는 코어가 붙이므로 마크업에 직접 쓰지 않는다. 알약(`gnav-pill`)이 있으면 활성 링크 자체의 배경은 꺼지고 알약만 미끄러진다(segmented-control의 thumb과 같은 기법). 알약을 빼면 활성 링크의 배경이 즉시 바뀐다(미끄러짐 없음).

반박: 페이지가 여러 라우트라면 spy가 아니라 라우터의 활성 상태로 `aria-current`를 직접 준다(위 React 예시). spy는 "한 화면 안의 섹션"일 때만 켠다.

## 사용 방법 — 순수 JS (React 없음)

```js
import { createGlassNav } from './createGlassNav.js'

const nav = document.querySelector('.gnav')
const control = createGlassNav({ nav, mode: 'compact', hideAfterPx: 120, spy: { onActive: (id) => console.log(id) } }) // container 생략 = 페이지 스크롤
// 화면 전환 시 모드를 바꾸려면 control.setOptions({ mode: 'hide' }), 떼려면 control.destroy()
// 폰트 로드 등으로 링크 너비가 바뀌면 control.refresh()로 알약을 다시 맞춘다
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 모드 | `mode: 'elevate' | 'hide' | 'compact'` (기본 elevate) |
| 투명 → 유리 시작점 | `thresholdPx` (기본 8 — 거의 바로. 배너 높이만큼 두면 배너를 지나야 유리가 된다) |
| 숨김·축소 시작점 | `hideAfterPx` (기본 80 — 맨 위 근처에서는 절대 숨기지 않는다) |
| 미세 튐 무시 | `minDeltaPx` (기본 6) |
| 섹션 이동·활성 추적 | `spy: true` 또는 `{ offsetPx: 8, lockMs: 900, onActive }` |
| 속도 | `--gnav-duration` (250ms — 컴포넌트 전환 단계) |
| 유리 색·흐림 | `--gnav-tint`·`--gnav-border`·`--gnav-blur`(16px) |
| 알약 모서리 | `--gnav-radius` (999px — 각진 바를 원하면 8px) |
| 글자·활성 배경 | `--gnav-color`·`--gnav-active-bg` |

## 주의사항

- **맨 위(scrollTop 0)에서는 항상 펼친 투명 상태다.** 코어가 보장한다. 숨긴 채 맨 위에 도착하는 어색함이 없다.
- **`gnav`는 클릭을 통과시킨다**(`pointer-events: none`). 투명 띠가 배너의 버튼을 가리지 않기 위해서다. 유리 판(`gnav-bar`)만 클릭을 받는다.
- **compact의 현재 메뉴는 복제다.** 링크 묶음이 접히면 안의 `aria-current` 링크도 보이지 않으므로 `gnav-current`에 이름을 따로 적는다(`aria-hidden` — 스크린 리더에는 접힌 링크가 그대로 있다). 라우트가 바뀌면 이 텍스트도 바꿔야 한다.
- **spy의 링크·섹션 짝은 붙일 때 한 번 수집한다.** 링크나 섹션이 나중에 추가되면 다시 붙여야 한다(React는 `containerRef`가 바뀔 때만 다시 붙는다). 섹션이 컨테이너 밖에 있으면 그 링크는 보통 링크로 동작한다.
- **spy는 해시를 바꾸지 않는다.** 해시 라우터(`#/path`)와 부딪히지 않게 기본 이동을 막는다. 그래서 새 탭에서 열기·주소 복사로는 섹션에 못 간다. 주소로도 가고 싶으면 `onActive`에서 `history.replaceState`로 직접 쓴다.
- 마지막 섹션들이 짧으면 끝까지 스크롤해도 시작점이 GNB 아래로 못 들어온다. 그때는 끝에 닿은 순간 마지막 섹션을 활성으로 본다. 그 앞 섹션은 클릭해도 끝까지만 내려가고 활성은 마지막으로 넘어간다 — 마지막 섹션에 화면 높이만큼의 여백을 두면 해결된다.
- 스크롤 컨테이너가 `document`가 아니면 `containerRef`(React) 또는 `container`(JS)를 반드시 넘긴다. 안 넘기면 페이지 스크롤을 듣고 아무 반응이 없다.
- 유리 전환의 `backdrop-filter`는 뒤에 무언가 있어야 보인다 — 단색 배경 위에서는 배경·테두리만 바뀐다. 흐림 미지원 브라우저·투명도 줄이기 설정 대응은 glass-surface 패턴의 폴백 블록을 같이 쓴다.
- **reduced-motion 대응 내장** — 세 상태 모두 전이 없이 즉시 바뀐다. 숨김 자체는 유지한다(움직임이 아니라 자리 비움).
- 축소(`grid-template-columns` 전이)는 Chrome 107·Safari 16·Firefox 66 이상. 그 아래에서는 전이 없이 즉시 접힌다.
