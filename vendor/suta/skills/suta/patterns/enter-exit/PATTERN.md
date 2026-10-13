---
name: enter-exit
description: React 요소의 진입/퇴장(enter/exit) 애니메이션을 구현한다 — 나타날 때 페이드·슬라이드·스케일로 들어오고, 사라질 때 그냥 없어지지 않고 스르륵 퇴장한 뒤 언마운트된다. "페이드 인/아웃, 등장/퇴장 효과, 사라질 때 애니메이션, 나타날 때 부드럽게" 요청과 알림·팝오버·목록 항목 등 나타나고 사라지는 컴포넌트 전환에 쓴다. 기존 적용분의 타이밍·방향 수정에도 쓴다.
---

# enter-exit — 진입/퇴장 애니메이션

라이브 데모: https://guksu.github.io/suta/#/enter-exit

## 언제 쓰는가

조건부로 나타나고 사라지는 요소(모달·토스트·드롭다운·배너)에 CSS 전환을 붙일 때. 핵심 문제는 **퇴장**이다: React는 조건이 false가 되는 즉시 언마운트하므로, CSS만으로는 사라지는 애니메이션이 보일 틈이 없다. 이 패턴의 `Presence` 컴포넌트가 언마운트를 애니메이션 종료까지 지연시킨다.

**기술 선택:** CSS transition + 프레임워크 무관 상태 머신 코어(의존성 0). 진입/퇴장은 CSS가 가장 싸고 빠른 영역이고, 코어는 상태 전이 타이밍만 푼다. 2층 구조다:

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createPresence.ts` | 코어 — DOM API로 `data-state` 구동 | 모든 프로젝트 |
| `assets/enter-exit.css` | 애니메이션 정의 | 모든 프로젝트 |
| `assets/Presence.tsx` | React 래퍼 (코어 사용) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기(`type`·제네릭·`as`)를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

1. 위 표의 세 파일을 복사한다(전체 구현이 이 파일들에 있다 — 반드시 읽어라).
2. 조건부 렌더링 `{open && <Modal />}`을 `Presence`로 감싼다.
3. 자식 요소에 `fx` + 변형 클래스(`fx-fade`·`fx-slide-up`·`fx-scale`)를 붙인다. 순수 페이드(`fx-fade`)는 딤 배경·오버레이용이다 — 콘텐츠(카드·토스트·모달)는 약간의 이동·스케일이 있는 `fx-slide-up`/`fx-scale`이 덜 평평하게 느껴진다.

`Presence`는 자식에 `data-state`(entering→entered→exiting)를 주입하고, CSS는 그 속성에만 반응한다. 상태 흐름과 스타일이 분리되어 있어 변형 추가는 CSS만으로 된다.

```tsx
import { Presence } from './Presence'
import './enter-exit.css'

const Toast = ({ open, message }: { open: boolean; message: string }) => (
  <Presence show={open} timeoutMs={400}>
    <div className="fx fx-slide-up" role="status">
      {message}
    </div>
  </Presence>
)
```

## 사용 방법 — 순수 JS (React 없음)

코어(`createPresence`)와 CSS만 복사한다. 요소를 직접 만들고 `show()`/`hide()`로 구동하며, `onChange(null)`이 "퇴장이 끝나 제거해도 안전한 시점"이다.

```js
import { createPresence } from './createPresence.js'

const toast = document.createElement('div')
toast.className = 'fx fx-slide-up'
toast.textContent = '저장되었습니다'
document.body.appendChild(toast)

const presence = createPresence({
  element: toast,
  timeoutMs: 400,
  onChange: (state) => {
    if (state === null) toast.remove() // 퇴장 완료 후에만 제거
  },
})
presence.show()
// 닫을 때: presence.hide()
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 지속 시간·이징 | CSS 변수 `--fx-duration`·`--fx-ease` 덮어쓰기 |
| 이동 거리(슬라이드) | `--fx-distance` |
| 시작 배율(스케일) | `--fx-from-scale` |
| 새 변형 추가 | `.fx-{이름}[data-state='entering'], [data-state='exiting']`에 시작 상태 CSS만 추가 |
| 언마운트 폴백 | `timeoutMs` prop — CSS duration보다 길게 (기본 500ms) |

## 주의사항

- **reduced-motion 대응 내장** — `prefers-reduced-motion: reduce`에서 이동·확대를 끄고 페이드만 남긴다. 이 블록을 지우지 마라.
- `timeoutMs`가 CSS duration보다 짧으면 애니메이션이 잘린 채 언마운트된다.
- (React) 자식은 단일 엘리먼트여야 하며, `Presence`가 ref와 `data-state`를 주입하므로 자식의 기존 ref는 덮어써진다.
- (순수 JS) `hide()` 후 `onChange(null)`을 기다리지 않고 즉시 `remove()`하면 퇴장 애니메이션이 잘린다 — 제거는 반드시 null 알림에서.
- 자식 내부 요소의 transition이 있으면 그 `transitionend`가 버블링되어 퇴장이 조기 종료될 수 있다 — 상세는 `references/edge-cases.md`.
