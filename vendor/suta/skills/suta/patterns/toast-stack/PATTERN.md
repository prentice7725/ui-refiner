---
name: toast-stack
description: 화면 하단(또는 상단 배너 위치)에 토스트(toast) 알림이 쌓이고 몇 초 뒤 스스로 사라지는 시스템을 구현한다. "토스트 알림 띄워줘/추가해줘, 스낵바, 저장됨 메시지 잠깐 띄우기, 알림 쌓기, 상단 배너 알림, 밑에서 올라왔다 사라지는 메시지" 요청과 일시적 알림 UI에 쓴다. 기존 적용분의 표시 시간·개수·위치 수정에도 쓴다.
---

# toast-stack — 토스트 스택

라이브 데모: https://guksu.github.io/suta/#/toast-stack

## 언제 쓰는가

"저장되었습니다" 같은 일시적 알림. 연속으로 발생하면 서로 덮어쓰는 대신 쌓였다가 각자 소멸해야 유실이 없다 — 이 스택 관리(밀어 올리기·최대 개수·자동 소멸)가 이 패턴의 본체다.

**기술 선택:** 코어가 스택 위치를 transform으로 직접 구동(레이아웃 애니메이션 없음)하고, 등장/퇴장은 enter-exit 패턴과 같은 data-state 규약으로 CSS가 그린다. 라이브 영역(role="status", aria-live="polite")에 쌓여 스크린 리더에도 알림이 전달된다. 위치는 하단(기본, 최신이 아래·위로 쌓임)과 상단(iOS 푸시 배너처럼 위에서 내려옴·최신이 위·아래로 쌓임) 둘 — 코어는 쌓이는 방향의 부호만 바꾸고, 등장 방향은 코어의 transform과 겹치지 않도록 CSS `translate` 속성으로 그린다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createToastStack.ts` | 코어 — 스택·자동 소멸·재배치 | 모든 프로젝트 |
| `assets/toast-stack.css` | 토스트 모양·등장/퇴장 정의 | 모든 프로젝트 |
| `assets/useToastStack.ts` | React 훅 (수명 관리) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다.

## 사용 방법 — React

```tsx
import { useToastStack } from './useToastStack'

const SavePanel = () => {
  const { toast } = useToastStack()

  return (
    <button type="button" onClick={() => toast('저장되었습니다 ✓')}>
      저장
    </button>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { createToastStack } from './createToastStack.js'

const toasts = createToastStack({ durationMs: 3500, maxVisible: 3 })
document.querySelector('#save').addEventListener('click', () => {
  toasts.show('저장되었습니다 ✓')
})
// 되돌리기 버튼 등에서 조기 종료가 필요하면: const dismiss = toasts.show('...'); dismiss()
// 상단 배너(위에서 내려옴): createToastStack({ position: 'top' }) — React는 useToastStack({ position: 'top' })
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 소멸 시간 | `durationMs` (기본 3500ms — 읽을 문장 길이에 비례해 늘려라) |
| 최대 개수 | `maxVisible` (기본 3 — 넘치면 가장 오래된 것부터 밀려난다) |
| 색·모양 | `--toast-bg`·`--toast-color`, `.toast-item` 스타일 덮어쓰기 |
| 위치 | `position` 옵션 — `'bottom'`(기본, 위로 쌓임) · `'top'`(상단 배너, `data-position="top"`이 붙고 아래로 쌓이며 위에서 내려온다). 좌우 정렬은 `.toast-region`의 left/translate를 바꾼다 — 코어는 무관하다 |

## 주의사항

- **토스트는 조작 수단이 아니다** — 버튼·링크를 토스트 안에 넣으면 사라지기 전에 눌러야 하는 시간 압박 UI가 된다(접근성 문제). 행동이 필요하면 토스트가 아니라 배너·다이얼로그를 써라.
- 같은 이유로 중요한 오류를 토스트로만 알리지 마라 — 사라지고 나면 복구 경로가 없다.
- **reduced-motion 대응 내장** — 이동·확대 없이 페이드만 남는다. 라이브 영역이라 스크린 리더 전달은 모션과 무관하게 동작한다.
- 스택 이동(transform) 값은 코어가 관리한다 — CSS에서 `.toast-item`에 transform을 덮어쓰지 마라. 등장 방향을 바꾸고 싶으면 `translate` 속성을 쓴다(상단 모드가 그렇게 한다).
- **화면이 바뀌면 토스트를 비운다** — 앞 화면의 "담았어요"가 다음 화면(장바구니)까지 따라오면 엉뚱한 알림이 된다. 라우터의 경로가 바뀔 때 `clearToasts()`(코어는 `clear()`)를 부른다.
- 하단 탭 바(`bottom-nav`)나 하단 고정 바가 있는 화면에서는 그 위에 띄운다 — `.toast-region { bottom: calc(24px + var(--bottom-nav-height, 56px) + env(safe-area-inset-bottom)) }`.
- 상단 모드는 상단 바·안전 영역과 겹친다 — 필요하면 `.toast-region[data-position="top"] { top: calc(24px + env(safe-area-inset-top)) }`로 내린다.
