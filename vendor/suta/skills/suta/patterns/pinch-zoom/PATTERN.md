---
name: pinch-zoom
description: 피드 이미지를 두 손가락으로 벌려 확대하는 핀치줌(pinch to zoom)을 구현한다 — 손가락 중점 기준으로 커지고 따라 움직이며 배경이 어두워지고, 놓으면 제자리로 돌아온다(확대 유지 없음). "핀치줌, 핀치 확대, 두 손가락 확대, 사진 벌려서 키우기, 인스타처럼 피드 사진 확대, 놓으면 돌아오는 확대" 요청과 모바일 피드·갤러리 이미지의 잠깐 보기 확대에 쓴다. 기존 적용분의 최대 배율·딤·복귀 속도 수정에도 쓴다.
---

# pinch-zoom — 피드 핀치줌

라이브 데모: https://guksu.github.io/suta/#/pinch-zoom

## 언제 쓰는가

인스타그램 피드에서 사진을 두 손가락으로 벌리면 **화면 전환 없이 그 자리에서** 사진이 커진다 — 손가락 중점이 확대 원점이고, 손가락을 옮기면 사진도 따라오며, 뒤 피드는 어두워지고, 손을 떼면 원래 크기·위치로 돌아온다. 확대가 유지되지 않는 "잠깐 들여다보기"라 별도 화면·닫기 버튼이 없다. 확대를 유지하고 넘겨 보는 갤러리는 `zoom-lightbox` 패턴이 맞다.

**기술 선택:** 터치 이벤트 + 인라인 transform + CSS transition 복귀. 두 손가락 거리 비율이 배율, 중점 이동이 평행이동이며(`pinchCore.ts` 순수 계산), 시작 중점을 `transform-origin`으로 잡아 손가락 사이가 확대 중심이 되게 한다. 터치 이벤트를 쓰는 이유: 포인터 이벤트는 브라우저가 두 손가락 제스처를 가로채면 `pointercancel`로 끊기지만, `touchmove`를 `passive: false`로 등록하면 우리가 취소권을 갖고 페이지 확대를 막을 수 있다. 한 손가락은 건드리지 않아(`touch-action: pan-y`) 세로 스크롤이 그대로 된다. 라이브러리 없음.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/pinchCore.ts` | 배율·이동·딤 진행도 순수 계산 | 모든 프로젝트 |
| `assets/createPinchZoom.ts` | 터치 처리 코어 (시작/추종/복귀) | 모든 프로젝트 |
| `assets/pinch-zoom.css` | 복귀 전이·z-index 승격·배경 딤 | 모든 프로젝트 |
| `assets/PinchZoom.tsx` | React 래퍼 | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { PinchZoom } from './PinchZoom'

const FeedItem = ({ post }) => (
  <article className="post">
    <header>{post.author}</header>
    <PinchZoom maxScale={4}>
      <img src={post.image} alt={post.alt} draggable={false} />
    </PinchZoom>
    <p>{post.caption}</p>
  </article>
)
```

- 자식은 확대될 콘텐츠 하나(`<img>`)다. 캡션·버튼은 밖에 둔다 — 같이 커진다.
- 확대 중 다른 UI를 숨기거나 스크롤을 잠그고 싶으면 `onChange={({ active }) => …}`를 쓴다. 배율은 매 이동마다 오니 React state로 올리지 말 것.

## 사용 방법 — 순수 JS (React 없음)

```html
<div class="pinch">
  <div class="pinch-target"><img src="noodle.jpg" alt="들깨칼국수" draggable="false" /></div>
  <div class="pinch-backdrop" aria-hidden="true"></div>
</div>
```

```js
import { createPinchZoom } from './createPinchZoom.js'

const element = document.querySelector('.pinch')
const destroy = createPinchZoom({ element, target: element.querySelector('.pinch-target'), maxScale: 4 })
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 최대 배율 | `maxScale` (4 — 사진 해상도가 낮으면 3) |
| 딤 세기·시점 | `--pinch-dim`(0.8), `dimAtScale`(2 — 이 배율에서 최대 딤) |
| 복귀 속도 | `--pinch-duration` (300ms) |
| 쌓임 순서 | `--pinch-z` (50 — 확대 중 형제 카드 위로 올라오는 z-index) |

## 주의사항

- **조상에 `overflow: hidden`이 있으면 확대된 사진이 잘린다** — 카드 둥근 모서리는 카드가 아니라 이미지에 `border-radius`를 준다. 조상에 `transform`·`filter`가 있으면 스태킹 컨텍스트가 생겨 형제 카드 위로 올라오지 못하고, 배경 딤(`position: fixed`)도 어긋난다.
- 한 손가락 스크롤 중 두 번째 손가락이 닿으면 그 시점부터 핀치가 시작된다. 핀치 중 한 손가락을 떼면 즉시 복귀한다(인스타그램과 동일).
- `<img draggable={false}>`를 권장한다 — 데스크톱에서 이미지 드래그 고스트가 뜨는 것을 막는다. 데스크톱에는 핀치가 없으므로 필요하면 `zoom-lightbox`를 클릭 경로로 병행한다.
- 확대 중 페이지가 스크롤되면 `getBoundingClientRect` 기준 원점이 어긋난다 — `touchmove`를 preventDefault하므로 두 손가락 중에는 스크롤이 일어나지 않는다. 이 preventDefault를 빼면 페이지 확대와 사진 확대가 동시에 일어난다.
- **reduced-motion 대응 내장** — 손가락 추종은 조작이라 유지하고, 복귀·딤 페이드만 즉시로 바꾼다. 블록 제거 금지.
