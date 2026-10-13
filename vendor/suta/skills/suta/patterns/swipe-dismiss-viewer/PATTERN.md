---
name: swipe-dismiss-viewer
description: 전체화면 이미지 뷰어를 끌어내려 닫는 제스처(swipe to dismiss)를 구현한다 — 사진을 아무 방향으로 끌면 손가락을 따라 작아지고 배경이 투명해지며, 놓으면 거리·속도로 판정해 썸네일 자리로 돌아가며 닫히거나 중앙으로 복귀한다. "끌어서 닫기, 사진 뷰어 드래그 닫기, 아래로 당겨 닫기, 이미지 뷰어" 요청에 쓴다. 기존 뷰어의 닫히는 드래그 거리·속도 임계값 수정에도 쓴다.
---

# swipe-dismiss-viewer — 끌어내려 닫는 이미지 뷰어

라이브 데모: https://guksu.github.io/suta/#/swipe-dismiss-viewer

## 언제 쓰는가

갤러리·피드에서 사진을 크게 본 뒤 **닫기 버튼을 찾지 않고 그냥 끌어내려 닫는** 경험. iOS 사진 앱·인스타그램·트위터 뷰어가 전부 이 관례라 설명 없이 통한다. 끌수록 이미지가 작아지고 뒤 화면이 비쳐 "돌아가는 중"임을 몸으로 알 수 있고, 놓으면 **출발했던 썸네일 자리로** 돌아가 맥락이 끊기지 않는다. 탭으로 열고 버튼으로 닫는 단순 확대는 `zoom-lightbox`가 맞다 — 이 패턴은 그 위에 제스처·물리를 얹은 완성판이다.

**기술 선택:** Pointer Events + 스프링(`spring-physics` 코어 복사본). 드래그 중엔 이미지 transform과 뷰어의 `--dismiss-progress`를 프레임마다 직접 쓰고(배경 딤·닫기 버튼 페이드는 CSS가 진행도로 계산), 놓으면 **스프링 t(0→1)로 현재 프레임에서 목표 프레임(썸네일 rect 또는 중앙)까지 보간**한다 — 열기·취소·닫기가 전부 같은 보간기라 어느 순간에 끊고 잡아도 이어진다. 썸네일 프레임은 FLIP 계산(`frameFromRect`)이다. 화면 좌우 가장자리 24px에서 시작한 제스처는 무시한다 — 브라우저 뒤로/앞으로 스와이프와 겹친다. 라이브러리 없음.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/dismissCore.ts` | 진행도·배율·닫기 판정·가장자리 판정·프레임 보간·FLIP 계산 (순수) | 모든 프로젝트 |
| `assets/createSwipeDismiss.ts` | 포인터 처리·열기/닫기/취소 스프링 코어 | 모든 프로젝트 |
| `assets/spring.ts` · `assets/animateSpring.ts` | 스프링 코어 (`spring-physics` 원본의 복사본 — 헤더 유지) | 모든 프로젝트 |
| `assets/swipe-dismiss-viewer.css` | 뷰어 레이아웃·배경 딤·크롬 페이드 | 모든 프로젝트 |
| `assets/SwipeDismissViewer.tsx` | React 래퍼 (마운트=열림, Esc·버튼 닫기, reduced-motion) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다.

## 사용 방법 — React

```tsx
import { useRef, useState } from 'react'
import { SwipeDismissViewer } from './SwipeDismissViewer'

const Gallery = ({ photos }) => {
  const [openId, setOpenId] = useState<string | null>(null)
  const thumbs = useRef<Record<string, HTMLImageElement | null>>({})
  const open = photos.find((p) => p.id === openId)

  return (
    <>
      {photos.map((photo) => (
        <img key={photo.id} ref={(el) => { thumbs.current[photo.id] = el }} src={photo.thumb} alt={photo.alt} onClick={() => setOpenId(photo.id)} />
      ))}
      {open && (
        <SwipeDismissViewer
          src={open.src}
          alt={open.alt}
          returnTo={{ current: thumbs.current[open.id] }}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  )
}
```

- **마운트가 곧 열림**이다. `onClose`는 복귀 애니메이션이 끝난 뒤 오므로 거기서 언마운트한다.
- `returnTo`를 주면 그 썸네일에서 열리고 그리로 돌아간다. 없으면 살짝 작은 상태에서 페이드로 열리고 끌던 방향으로 빠져나간다.

## 사용 방법 — 순수 JS (React 없음)

```html
<div class="viewer" id="viewer">
  <div class="viewer-backdrop"></div>
  <img class="viewer-image" src="big.jpg" alt="들깨칼국수" draggable="false" />
  <button type="button" class="viewer-chrome viewer-close" aria-label="닫기">✕</button>
</div>
```

```js
import { createSwipeDismiss } from './createSwipeDismiss.js'

const viewer = document.getElementById('viewer')
const swipe = createSwipeDismiss({
  viewer,
  image: viewer.querySelector('.viewer-image'),
  returnTo: () => document.querySelector('#thumb-3'),
  onDismiss: () => viewer.remove(),
})
swipe.open()
viewer.querySelector('.viewer-close').addEventListener('click', swipe.close)
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 닫기 판정 | `thresholdPx`(120) · `velocityThreshold`(800px/s — 짧게 튕겨도 닫힘) |
| 작아지는 정도 | `minScale`(0.65) · `progressDistance`(240px에서 진행도 1) |
| 복귀 느낌 | `spring`(260/28 — 크리스프. 더 통통하게는 damping 20) |
| 배경·쌓임 | `--viewer-bg`(#000), `--viewer-z`(100) |
| 크롬 페이드 속도 | `.viewer-chrome`의 `× 3.3` — 진행도 0.3에서 완전 투명 |
| 닫기 버튼 이름 | `closeLabel` (기본 "닫기") |

## 주의사항

- **이미지에 `transition: transform`을 두지 말 것** — 코어가 프레임마다 쓴다. 뷰어 안 다른 요소는 `--dismiss-progress`로 반응하게 한다.
- 썸네일이 스크롤로 화면 밖에 있으면 그리로 "날아가는" 복귀가 어색하다 — 열 때 `scrollIntoView({ block: 'nearest' })`로 썸네일을 보이게 해 두거나, 화면 밖이면 `returnTo`가 `null`을 돌려주게 한다.
- 가장자리 24px 무시는 iOS Safari 뒤로가기 제스처 때문이다 — 전체화면 PWA(standalone)라면 `isEdgeStart`를 끄고 싶을 수 있다.
- 핀치줌과 함께 쓰려면 두 손가락일 때 이 코어의 드래그를 막아야 한다(`pointerdown`에서 활성 포인터 수 확인) — 포함하지 않았다.
- **reduced-motion 대응 내장(래퍼)** — 손가락 추종은 유지하고 열림·복귀 스프링을 고강성·임계 감쇠(600/50)로 바꿔 즉시 정착시킨다.
