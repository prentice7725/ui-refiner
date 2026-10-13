---
name: card-expand
description: 카드가 제자리에서 자라나 상세 화면이 되는 공유 요소 전환(shared element transition)을 구현한다 — 누른 카드의 사진·제목이 상세로 이어져 움직이고, 닫으면 원래 자리로 줄어든다. "카드 클릭하면 커지면서 상세로, 앱스토어 카드 전환, 히어로 전환, 목록에서 상세로 자연스럽게" 요청에 쓴다. 기존 적용분의 확대 속도·모서리·이어지는 부위 수정에도 쓴다.
---

# card-expand — 카드 확장(공유 요소 전환)

라이브 데모: https://guksu.github.io/suta/#/card-expand

## 언제 쓰는가

목록의 카드 하나가 **그 자체로 상세 화면이 되는** 구조에 쓴다 — 추천 카드, 특집 기사, 상품 큐레이션, 앨범/플레이리스트. App Store "투데이" 탭이 이 관례를 만들었다: 누른 카드가 자라나 화면이 되고, 닫으면 그 자리로 돌아간다. 카드 안의 그림과 제목이 그대로 상세의 그림·제목으로 **이어져 움직이기** 때문에 "내가 누른 그것이 열렸다"는 확신이 생기고, 돌아왔을 때 어디를 보고 있었는지도 잃지 않는다.

같은 목록→상세라도 **카드가 상세와 닮지 않았다면** 이 전환은 거짓말이 된다(작은 한 줄짜리 행이 통째로 자라나 전혀 다른 화면이 되면 어색하다). 그런 경우는 page-transition(밀려 들어오는 화면)이 맞다. 상세가 화면을 채우지 않고 카드 위에 잠깐 떠오르는 정도면 zoom-lightbox나 modal-dialog를 본다.

**기술 선택:** View Transitions API(`document.startViewTransition`)의 **이름 짝짓기**. 바뀌기 전 화면에서 `view-transition-name`을 가진 사각형과, 바뀐 뒤 같은 이름을 가진 사각형을 브라우저가 찾아 위치·크기를 알아서 보간한다. 카드 좌표를 재고 클론을 만들어 FLIP으로 옮기는 코드가 통째로 필요 없고, 그림·제목처럼 따로 움직일 부위도 이름만 더 주면 된다. 지원하지 않는 브라우저에서는 전환 없이 즉시 바뀐다(기능은 그대로).

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/runCardExpand.ts` | 코어 — 이름 부여 순서 관리 + View Transitions 호출 + 폴백 (`assignTransitionNames`/`clearTransitionNames` 포함) | 모든 프로젝트 |
| `assets/useCardExpand.ts` | React 훅 — 열림 상태·flushSync·Esc·포커스 복귀 | React 프로젝트만 |
| `assets/card-expand.css` | 세 그룹(루트·그림·제목)의 움직임, 컨테이너·상세 배치, reduced-motion | 모든 프로젝트 |

## 원리 — 이름은 한 번에 한 요소에만

```
[누르기 전]  카드 A ─ view-transition-name: card-expand  ← 누른 그 카드에만 (다른 카드는 없음)
   ↓ 사진(old) 찍힘
[DOM 갱신]  카드 A 이름 제거 → 상세 루트에 card-expand 부여
   ↓ 사진(new) 찍힘 → 브라우저가 두 사각형 사이를 보간
[전환 끝]   이름 전부 제거
```

`view-transition-name`은 한 순간에 문서 안에서 유일해야 한다 — 같은 이름이 둘 있으면 브라우저는 전환을 **통째로 건너뛴다**. 그래서 목록의 카드마다 이름을 미리 박아 두면 안 되고, 코어가 누른 순간에만 붙였다가 옮기고 뗀다. 카드 안의 `data-card-expand-part="media"`·`"title"` 요소는 `card-expand-media`·`card-expand-title`을 받아 따로 움직인다.

## 사용 방법 — React

카드에는 `data-card-id`, 따로 움직일 부위에는 `data-card-expand-part`, 상세 루트에는 `detailRef`를 단다. 카드와 상세 **양쪽에** 같은 부위 표시가 있어야 그 부위가 이어진다.

```tsx
import { useRef } from 'react'
import { useCardExpand } from './useCardExpand'

const Today = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const { expandedId, expand, collapse } = useCardExpand({ containerRef, detailRef })
  const current = PICKS.find((pick) => pick.id === expandedId)

  return (
    // 상세는 창 전체가 아니라 이 컨테이너를 채운다. 스크롤은 안쪽 목록이 한다
    <div ref={containerRef} className="card-expand-container">
      <ul inert={expandedId !== null}>
        {PICKS.map((pick) => (
          <li key={pick.id}>
            <button type="button" data-card-id={pick.id} onClick={(e) => expand({ id: pick.id, card: e.currentTarget })}>
              <img data-card-expand-part="media" src={pick.photo} alt="" />
              <span data-card-expand-part="title">{pick.title}</span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <article ref={detailRef} className="card-expand-detail" role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <button type="button" className="card-expand-close" aria-label="닫기" onClick={collapse}>×</button>
          <div className="card-expand-detail-scroll">
            <img data-card-expand-part="media" src={current.photo} alt={current.title} />
            <h2 id="detail-title" data-card-expand-part="title">{current.title}</h2>
            <div className="card-expand-detail-body">…소개·가격·버튼…</div>
          </div>
        </article>
      )}
    </div>
  )
}
```

- `inert`는 상세가 열린 동안 목록을 키보드·스크린 리더에서 빼낸다(상세가 덮고 있어도 DOM에는 남아 있다 — 닫을 때 돌아갈 자리이므로 언마운트하면 안 된다).
- 훅이 Esc 닫기와, 닫힌 뒤 눌렀던 카드로 포커스 복귀를 처리한다. 열릴 때 닫기 버튼으로 포커스를 옮기는 것은 화면 쪽에서 `useEffect`로 한다.
- `.card-expand-detail-body`에 감싼 내용은 상자가 다 자란 뒤(200ms 지연) 페이드 인된다 — 자라는 동안 글자까지 늘어나면 어지럽다.

## 사용 방법 — 순수 JS (React 없음)

DOM 교체를 직접 하되 **동기적으로** 하면 된다.

```js
import { runCardExpand } from './runCardExpand.js'

const container = document.querySelector('.card-expand-container')

container.addEventListener('click', (event) => {
  const card = event.target.closest('[data-card-id]')
  if (!card) return
  runCardExpand({
    direction: 'open',
    from: card,
    update: () => container.appendChild(buildDetail(card.dataset.cardId)), // 동기 DOM 삽입
    to: () => container.querySelector('.card-expand-detail'),
  })
})

const close = (id) =>
  runCardExpand({
    direction: 'close',
    from: container.querySelector('.card-expand-detail'),
    update: () => container.querySelector('.card-expand-detail').remove(),
    // 새 사진을 찍을 때 목록의 그 카드가 이름을 가져야 "그 자리로 돌아간다"
    to: () => container.querySelector(`[data-card-id="${id}"]`),
  })
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 자라나는 시간 | `--card-expand-duration` (`:root`에 선언) | 420ms |
| 모서리(카드 값과 같게) | `--card-expand-radius` (`:root`에 선언) | 16px |
| 상세 배경 | `--card-expand-bg` (컨테이너에 선언 가능) | `#fff` |
| 닫기 버튼 색 | `--card-expand-close-bg`·`--card-expand-close-color` | 반투명 검정 / 흰색 |
| 이름 충돌 회피(한 화면에 목록 둘) | `names: { root: 'today' }` — 부위는 `today-media`·`today-title`로 파생 | `card-expand` |
| 따로 움직이는 부위 | `data-card-expand-part="media" \| "title"` — 둘 다 선택 사항 | 없음 |
| 이징 | `::view-transition-group(card-expand)`의 `animation-timing-function` | `cubic-bezier(0.32, 0.72, 0, 1)` |

```css
/* 변수는 :root에 선언한다 — 전환되는 요소나 컨테이너에 걸면 적용되지 않는다 */
:root {
  --card-expand-duration: 360ms;
  --card-expand-radius: 20px;
}
```

## 주의사항

- **`update`는 동기적으로 DOM을 바꿔야 한다.** React라면 `flushSync`가 필수다(`useCardExpand`는 이미 그렇게 한다). 그냥 `setState`하면 브라우저가 새 사진을 찍는 시점에 아직 옛 화면이라 전환이 "카드 → 카드"가 된다.
- **커스터마이즈 변수는 `:root`에 선언해야 한다.** `::view-transition-*` 가상 요소는 문서 루트에 붙는다 — 컨테이너에 선언하면 조용히 무시된다. `--card-expand-bg`만 예외(실제 요소에 걸리는 값).
- **`--card-expand-radius`는 카드의 `border-radius`와 같은 값이어야 한다.** 전환 중 모서리는 이 변수에서 0으로 변하므로, 다르면 시작 순간에 모서리가 한 번 튄다.
- **카드는 닫을 때까지 DOM에 남아 있어야 한다.** 상세를 열 때 목록을 언마운트하면 돌아갈 사각형이 없어 그냥 사라진다. `inert`로 막되 없애지 마라.
- **컨테이너가 아니라 안쪽 목록이 스크롤해야 한다.** 컨테이너(`position: relative`)가 스크롤되면 `absolute` 상세가 스크롤된 내용의 맨 위에 붙어 화면 밖으로 나간다. 목록에 `overflow-y: auto`, 컨테이너는 `overflow: hidden`.
- **루트 사진 두 장은 교차 페이드하지 않는다.** 카드와 상세는 종횡비가 달라 겹쳐 섞으면 중간 프레임이 뭉개진다 — 한 장만 보이게 하고 상자 밖은 잘라낸다(`::view-transition-image-pair(card-expand) { overflow: clip }`). 그래서 열 때는 처음부터 상세가, 닫을 때는 마지막까지 상세가 보이다가 ease-in으로 빠진다. 그림 부위는 `object-fit: cover`로 상자를 채운다.
- **전환 중 사용자 입력은 잠긴다**(View Transitions API의 동작). 420ms는 화면을 덮는 큰 상자에 필요한 시간이지만 그 이상은 "느린 앱"이 된다. 훅은 전환 중 겹쳐 들어온 expand/collapse를 무시한다.
- **미지원 브라우저(구형 사파리·파이어폭스)에서는 전환이 없다.** 상세는 정상적으로 열리고 닫힌다 — 연출만 빠진다. 폴백 애니메이션을 따로 만들지 않은 것은 의도다(두 벌의 전환 코드는 반드시 어긋난다).
- **page-transition·theme-toggle 패턴과 함께 써도 된다.** 코어는 전환하는 그 순간만 `:root`의 이름을 `none`으로 두고 끝나면 원래 값으로 되돌린다.
- **reduced-motion 대응 내장** — 상자가 화면을 가로질러 자라는 대신 120ms 겹침으로 바뀌고, 본문 지연 페이드도 꺼진다. 전환을 아예 없애지 않는 이유는, 갑자기 내용만 바뀌면 같은 화면인지 다른 화면인지 알기 어렵기 때문이다.
- 상세는 `role="dialog"` + `aria-modal="true"` + `aria-labelledby`로 표시한다 — 목록이 `inert`이므로 스크린 리더에는 상세만 남는다.
