---
name: zoom-lightbox
description: 썸네일을 누르면 그 요소가 화면 가운데로 커지는 라이트박스(lightbox) 확대 전환을 구현한다. "라이트박스, 이미지 크게 보기, 썸네일 클릭하면 확대, 갤러리 사진 크게 보기, 이미지 확대 보기 전환" 요청과 갤러리·상세 이미지 UI에 쓴다. 기존 적용분의 확대 크기·속도 수정에도 쓴다.
---

# zoom-lightbox — 확대 전환 라이트박스

라이브 데모: https://guksu.github.io/suta/#/zoom-lightbox

## 언제 쓰는가

갤러리 썸네일·상품 이미지를 눌러 크게 볼 때. 팝업이 "따로 뜨는" 게 아니라 **누른 썸네일 그 자체가 커지는 것처럼** 보이는 전환(공유 요소 전환의 최소형) — 출발지와 도착지가 시각적으로 이어져 맥락이 끊기지 않는다.

**기술 선택:** 썸네일 복제(고스트)를 제자리에 띄우고 화면 중앙 확대 크기로 transform 전환한다(FLIP의 확대판). transform·opacity만 사용, 닫으면 역방향으로 제자리 복귀 후 자체 정리. 라이브러리 불필요.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/openZoom.ts` | 코어 — 고스트 생성·확대/복귀·정리 | 모든 프로젝트 |
| `assets/zoom-lightbox.css` | 백드롭·커서 정의 | 모든 프로젝트 |

React 래퍼는 없다 — 코어를 클릭 핸들러에서 직접 부르면 끝이라 래퍼가 더할 것이 없다. TS가 아닌 프로젝트는 타입을 벗겨 .js로 저장한다.

## 사용 방법 — React

```tsx
import { openZoom } from './openZoom'
import './zoom-lightbox.css'

const Gallery = ({ images }: { images: string[] }) => (
  <div className="gallery">
    {images.map((src) => (
      <img
        key={src}
        src={src}
        className="zoomable"
        alt=""
        onClick={(event) => openZoom({ source: event.currentTarget })}
      />
    ))}
  </div>
)
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { openZoom } from './openZoom.js'

document.querySelectorAll('.gallery img').forEach((img) => {
  img.classList.add('zoomable')
  img.addEventListener('click', () => openZoom({ source: img }))
})
```

백드롭 클릭·Esc로 닫히고, `openZoom`이 돌려준 함수로 프로그램적으로도 닫을 수 있다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 전환 속도 | `durationMs` (기본 350ms) |
| 최대 크기 | `maxViewportRatio` (기본 0.9 — 뷰포트의 90%까지) |
| 배경 | `--zoom-backdrop` (기본 검정 80%) |
| 닫힌 뒤 처리 | `onClose` 콜백 |

## 주의사항

- **고스트는 복제본이다** — 원본이 저해상도 썸네일이면 확대본도 흐리다. 고해상도가 필요하면 원본 `src`를 큰 이미지로 두고 썸네일은 CSS 크기로 줄여라(또는 srcset).
- 확대 중 body 스크롤이 잠긴다(닫으면 복원) — 코어가 처리하므로 별도 작업 불필요.
- 텍스트·버튼이 든 카드도 확대할 수 있지만 고스트는 `pointer-events: none`이라 내부 조작은 안 된다 — 조작이 필요한 상세라면 이 패턴이 아니라 라우팅+공유 요소 전환(범위 밖)이다.
- **reduced-motion 대응 내장** — 이동 전환 없이 즉시 확대본이 뜬다(기능은 유지).
