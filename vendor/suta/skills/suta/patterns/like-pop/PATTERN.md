---
name: like-pop
description: 좋아요 하트가 토글 시 튀어오르고 게시물을 더블탭(double tap like)하면 큰 하트가 팡 터지는 인스타그램식 반응 애니메이션을 구현한다. "좋아요 애니메이션, 하트 튀게, 하트 효과, 두 번 두드리면 하트, 더블탭 좋아요, 하트 팡 터지는 효과" 요청과 피드·게시물·상품 카드의 좋아요 버튼에 쓴다. 기존 적용분의 하트 색·크기·더블탭 판정 시간 수정에도 쓴다.
---

# like-pop — 좋아요 팝 + 더블탭 버스트

라이브 데모: https://guksu.github.io/suta/#/like-pop

## 언제 쓰는가

좋아요·찜·하트 토글에 반응 피드백을 줄 때. 두 가지를 담는다: ① 버튼 하트가 움츠렸다 튀어오르는 **팝**, ② 콘텐츠를 더블탭하면 탭 지점에 큰 하트가 떠올랐다 사라지는 **버스트**(인스타그램 피드·당근 찜의 관례).

**기술 선택:** 팝·버스트는 CSS keyframes(원샷 연출이므로 transition이 아니라 keyframes가 맞다 — transform/opacity만 사용). 더블탭 판정만 JS 코어다 — `dblclick` 이벤트는 모바일 지원이 일관되지 않고 판정 시간을 조절할 수 없어 click 두 번을 직접 판정한다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createDoubleTap.ts` | 코어 — 더블탭 판정(시간·이동 허용치) | 모든 프로젝트 |
| `assets/like-pop.css` | 팝·버스트 애니메이션 정의 | 모든 프로젝트 |
| `assets/LikeButton.tsx` + `assets/DoubleTapArea.tsx` | React 래퍼 | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { LikeButton } from './LikeButton'
import { DoubleTapArea } from './DoubleTapArea'

const Post = ({ image }: { image: string }) => {
  const [liked, setLiked] = useState(false)

  return (
    <article>
      <DoubleTapArea onDoubleTap={() => setLiked(true)}>
        <img src={image} alt="" draggable={false} />
      </DoubleTapArea>
      <LikeButton liked={liked} onChange={setLiked} count={128} />
    </article>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

버튼 팝은 `aria-pressed`만 갈아 끼우면 CSS가 반응한다. 버스트는 더블탭 지점에 하트 요소를 만들고 애니메이션 종료 시 제거한다:

```js
import { createDoubleTap } from './createDoubleTap.js'

const area = document.querySelector('.double-tap-area')
createDoubleTap({
  element: area,
  onDoubleTap: ({ x, y }) => {
    const rect = area.getBoundingClientRect()
    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    heart.setAttribute('class', 'burst-heart')
    heart.setAttribute('viewBox', '0 0 24 24')
    heart.innerHTML = '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>'
    heart.style.left = `${x - rect.left}px`
    heart.style.top = `${y - rect.top}px`
    heart.addEventListener('animationend', () => heart.remove())
    area.appendChild(heart)
  },
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 하트 색 | `--like-color` (기본 #ff3040 — 인스타그램 계열) |
| 팝 시간 | `--like-pop-duration` (기본 400ms) |
| 버스트 크기 | `--burst-size` (기본 96px) |
| 더블탭 판정 시간 | `thresholdMs` (기본 300ms — 시스템 더블클릭 관례) |
| 이동 허용치 | `maxDistancePx` (기본 24px — 넘으면 스와이프로 보고 무시) |
| 화면 낭독 문구 | `labels` — `{ like, unlike }` (기본 "좋아요"·"좋아요 취소". 다른 언어면 넘긴다) |

## 주의사항

- **reduced-motion 대응 내장** — 확대·이동을 끄고 불투명도 페이드만 남긴다. 블록 제거 금지.
- `double-tap-area`에는 `touch-action: manipulation`이 걸려 있다 — 없으면 모바일에서 더블탭이 브라우저 확대로 먹힌다. 제거 금지.
- 더블탭은 항상 "좋아요 설정"이다(토글 아님) — 인스타그램 관례. 취소는 버튼으로만.
- 이미지 위에서 쓸 때는 `draggable={false}`로 드래그를 막아야 두 번째 탭이 유실되지 않는다.
- 버스트 하트는 `animationend`에서 스스로 정리된다 — 수동으로 제거하면 연타 시 남은 하트가 누수처럼 쌓일 수 있다.
