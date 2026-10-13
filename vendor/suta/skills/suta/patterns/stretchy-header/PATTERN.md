---
name: stretchy-header
description: 상세·프로필·앨범 상단의 큰 커버 이미지 헤더(stretchy header)를 구현한다 — 위로 올리면 이미지가 콘텐츠보다 느리게 밀리며 어두워지는 패럴랙스, 맨 위에서 아래로 당기면 이미지가 늘어났다가 놓으면 돌아온다. "당기면 늘어나는 이미지, 스트레치 헤더, 패럴랙스 커버, 프로필 상단 이미지 효과" 요청에 쓴다. 기존 적용분의 비율·높이·저항 수정에도 쓴다.
---

# stretchy-header — 늘어나는 이미지 헤더

라이브 데모: https://guksu.github.io/suta/#/stretchy-header

## 언제 쓰는가

앨범·프로필·가게 상세처럼 화면 상단에 큰 사진을 두는 페이지. iOS 앨범·연락처 상단 사진의 관례 — 위로 스크롤하면 사진이 본문보다 느리게 밀려 올라가며 어두워지고(깊이감), 맨 위에서 아래로 당기면 사진이 고무줄처럼 늘어났다가 놓으면 돌아온다(끝에 닿았다는 신호). 사진이 없는 화면에는 쓰지 않는다 — 제목만 큰 헤더라면 `sticky-header`가 맞다. 큰 사진이 콘텐츠를 밀어내는 것이 싫다면 헤더 높이를 줄이는 대신 이 효과 자체를 빼는 편이 낫다.

**기술 선택:** 포인터 이벤트 + rAF 스로틀 + CSS transition, 라이브러리 없음. 헤더 높이는 절대 바꾸지 않고 이미지의 `transform`(translateY·scale)과 `opacity`만 움직인다 — 높이 애니메이션은 매 프레임 레이아웃을 돌린다. 스크롤은 `scroll` 이벤트(passive) 한 프레임 한 번, 당김은 pointer 이벤트로 받고, 놓았을 때의 복귀만 CSS transition이 맡는다. 수치 계산(`stretchCore.ts`)은 DOM이 없어 그대로 테스트된다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/stretchCore.ts` | 순수 계산 — 패럴랙스 프레임·늘어남(저항) 프레임 | 모든 프로젝트 |
| `assets/createStretchyHeader.ts` | 코어 — 스크롤·당김 추적 → 이미지 transform 적용 | 모든 프로젝트 |
| `assets/stretchy-header.css` | 헤더·클립·이미지·제목 오버레이·복귀 전환 | 모든 프로젝트 |
| `assets/useStretchyHeader.ts` | React 훅 (ref 2개) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다.

## 사용 방법 — React

마크업은 4겹이다: 스크롤 컨테이너 > 헤더 > 클립 > 이미지. 제목은 헤더 안 오버레이에 둔다.

```tsx
import { useStretchyHeader } from './useStretchyHeader'

const ShopPage = () => {
  const { containerRef, imageRef } = useStretchyHeader<HTMLDivElement, HTMLImageElement>({ headerHeight: 240 })

  return (
    <div ref={containerRef} className="stretchy-container" style={{ height: '100dvh' }}>
      <div className="stretchy-header">
        <div className="stretchy-header-clip">
          <img ref={imageRef} className="stretchy-header-image" src="/shop.jpg" alt="" />
        </div>
        <div className="stretchy-header-overlay">
          <h1>성수동 손칼국수</h1>
        </div>
      </div>
      <main>…메뉴·본문…</main>
    </div>
  )
}
```

`headerHeight`는 CSS의 `--stretch-height`(기본 240px)와 같은 값을 준다 — 생략하면 마운트 시 `image.offsetHeight`를 한 번 잰다(이미지가 늦게 로드돼도 높이는 CSS가 고정하므로 안전).

## 사용 방법 — 순수 JS (React 없음)

같은 마크업을 만들고 코어를 붙인다:

```js
import { createStretchyHeader } from './createStretchyHeader.js'

const destroy = createStretchyHeader({
  container: document.querySelector('.stretchy-container'),
  image: document.querySelector('.stretchy-header-image'),
  headerHeight: 240,
  parallaxRatio: 0.5,
})
// 페이지를 떠날 때 destroy()
```

계산만 쓰고 싶다면(예: 다른 스크롤 라이브러리와 결합) `assets/stretchCore.ts`의 `parallaxFrame`·`stretchFrame`만 가져다 쓴다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 헤더 높이 | `--stretch-height` (기본 240px) + 코어 `headerHeight`를 같은 값으로 |
| 패럴랙스 속도 | `parallaxRatio` (기본 0.5 = 절반 속도. 0이면 같이 움직임, 1이면 화면 고정) |
| 어두워지는 색 | `--stretch-bg` (기본 짙은 남색 — 이미지가 opacity 0.3까지 옅어지며 이 색이 비친다) |
| 늘어남 상한 | `maxPull` (기본 headerHeight — scale이 2에 점근) |
| 복귀 속도 | `--stretch-duration` (기본 300ms, `cubic-bezier(0.22, 1, 0.36, 1)`) |
| 제목 오버레이 | `.stretchy-header-overlay`의 padding·그라디언트를 덮어쓴다 |

## 주의사항

- **`.stretchy-header-clip`을 빼지 마라.** 헤더보다 위로 길게 뻗은 이 클립 박스가 있어야 iOS 바운스(scrollTop 음수)에서 이미지를 위로 올려 붙여도 잘리지 않고, 패럴랙스로 이미지가 처져도 헤더 바닥에서 잘려 본문을 덮지 않는다. 헤더에 `overflow: hidden`을 주면 바운스 늘어남이 사라진다.
- 컨테이너의 `touch-action: pan-y`는 세로 스크롤을 브라우저에 맡기기 위한 것이다. 그래서 **안드로이드 크롬 등에서는 맨 위에서의 터치 당김이 브라우저 스크롤로 흡수돼(pointercancel) 늘어남이 안 보일 수 있다** — iOS 사파리는 scrollTop 음수 경로로, 데스크톱은 마우스 드래그로 동작한다. 모든 터치 브라우저에서 당김을 보장하려면 `touchmove`를 `passive: false`로 잡아 `preventDefault`하는 방식(pull-to-refresh 계열)으로 바꿔야 하고, 그만큼 스크롤 성능 비용을 진다.
- 가로로 먼저 움직인 드래그는 포기한다(축 잠금 6px) — 헤더 위에 캐러셀이 있어도 충돌하지 않는다.
- **reduced-motion 대응 내장** — JS가 `matchMedia`로 판정해 패럴랙스 이동과 늘어남을 건너뛰고 페이드만 남긴다. CSS 블록도 제거 금지.
- 이미지의 `transform-origin: top center`는 계산의 전제다 — 바꾸면 위 가장자리가 고정되지 않는다.
- 제목 오버레이는 이미지가 아니라 헤더 박스에 붙어 있어 본문과 같이 움직인다. 제목도 느리게 움직이길 원하면 오버레이를 클립 안 이미지 옆으로 옮기고 같은 ref를 감싸는 래퍼에 달아라.
