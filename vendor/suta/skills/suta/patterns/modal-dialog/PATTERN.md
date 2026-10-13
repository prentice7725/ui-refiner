---
name: modal-dialog
description: 화면 가운데 창을 띄우고 뒤 배경을 어둡게 잠그는 모달 다이얼로그(modal dialog) 컴포넌트를 구현한다 — 백드롭 페이드, 패널 스케일 진입, 포커스 트랩·Esc·포커스 복귀 포함. "모달, 다이얼로그, 팝업, 확인창, 알림창, 가운데 뜨는 창, 오버레이" 요청과 확인·입력·안내를 배경 위에 띄울 때 쓴다. 기존 적용분의 모달 열리는 속도·크기·닫기 방식 수정에도 쓴다.
---

# modal-dialog — 모달 다이얼로그

라이브 데모: https://guksu.github.io/suta/#/modal-dialog

## 언제 쓰는가

주문 취소 확인, 로그인 요구, 약관 안내처럼 **사용자의 답을 받기 전엔 뒤 화면을 만질 수 없어야 하는** 순간. 배경이 어두워지며 패널이 떠오르는 모션은 "지금 이 결정에 집중하라"는 신호다. 바텀시트(모바일 목록 선택)·토스트(답 필요 없음)와 구분한다 — 모달은 반드시 답(확인/취소)이 있다.

**기술 선택:** 네이티브 `<dialog>` + `showModal()` + CSS animation. 포커스 트랩·배경 inert·Esc 닫기·닫힌 뒤 포커스 복귀를 브라우저가 전부 처리하므로 접근성을 직접 재구현하지 않는다. 유일한 JS 역할은 `dialog.close()`가 즉시 사라지는 문제를 `data-closing` 애니메이션 뒤로 미루는 것. 진입은 transition이 아니라 **animation**이다 — `display: none → block`으로 바뀌는 순간에는 transition이 걸리지 않기 때문이다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/modal-dialog.css` | 패널·백드롭 진입/퇴장 키프레임, reduced-motion | 모든 프로젝트 |
| `assets/Modal.tsx` | React 래퍼 (open 동기화, 닫힘 지연, Esc·백드롭 라우팅) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { Modal } from './Modal'

const CancelOrder = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>주문 취소</button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="cancel-title">
        <h2 id="cancel-title">주문을 취소할까요?</h2>
        <p>조리가 시작되면 취소할 수 없습니다.</p>
        <button type="button" onClick={() => setOpen(false)}>돌아가기</button>
        <button type="button" onClick={confirmCancel}>취소하기</button>
      </Modal>
    </>
  )
}
```

- `open`은 부모가 소유한다. Esc·백드롭 클릭은 `onClose`를 부를 뿐 스스로 닫지 않는다 — "정말 닫을까요?"처럼 닫기를 거부하는 로직을 부모가 넣을 수 있다.
- `labelledBy`에 제목 요소 id를 넘기면 스크린 리더가 모달 진입 시 제목을 읽는다.
- 파괴적 확인(삭제·결제)이면 `dismissOnBackdrop={false}`로 실수 닫힘을 막는다.

## 사용 방법 — 순수 JS (React 없음)

```html
<dialog class="modal" id="cancel-dialog" aria-labelledby="cancel-title">
  <div class="modal-body">
    <h2 id="cancel-title">주문을 취소할까요?</h2>
    <button type="button" data-close>돌아가기</button>
  </div>
</dialog>
```

```js
const dialog = document.getElementById('cancel-dialog')
const closeAnimated = () => {
  dialog.setAttribute('data-closing', '')
  dialog.addEventListener('animationend', () => {
    dialog.removeAttribute('data-closing')
    dialog.close()
  }, { once: true })
}
dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeAnimated() }) // Esc
dialog.addEventListener('click', (e) => { if (e.target === dialog) closeAnimated() }) // 백드롭
dialog.querySelector('[data-close]').addEventListener('click', closeAnimated)
document.getElementById('open').addEventListener('click', () => dialog.showModal())
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 속도 | `--modal-duration` (기본 240ms — 닫힘은 자동으로 0.75배, 퇴장은 진입보다 짧게) |
| 크기 | `--modal-width`(min(420px, 100vw-32px)), 높이는 내용 기준·최대 80vh |
| 배경·모서리 | `--modal-bg`, `--modal-radius`(16px), `--modal-backdrop`(rgba 0.55) |
| 진입 방향 | `modal-in` 키프레임의 `translateY(12px)` — 아래에서 떠오름. 위에서 내려오게 하려면 음수로 |

## 주의사항

- **`showModal()`이지 `show()`가 아니다** — `show()`는 배경 잠금·포커스 트랩·`::backdrop`이 없다.
- 백드롭 클릭 판정은 `event.target === dialog`다. `.modal-body`가 dialog를 꽉 채우고 있어야 패널 안쪽 클릭이 백드롭으로 오인되지 않는다 — padding을 dialog가 아니라 `.modal-body`에 둔 이유다.
- 모달 안 첫 포커스는 브라우저가 첫 포커스 가능 요소에 준다. 파괴적 버튼이 첫 번째면 실수 Enter로 실행될 수 있으니 안전한 버튼(돌아가기)을 앞에 둔다.
- 스크롤은 `.modal-body`가 담당한다 — dialog 자체에 `overflow: hidden`을 둔 것은 둥근 모서리 안으로 내용을 자르기 위해서다.
- 페이지 스크롤 잠금은 내장하지 않았다 — 배경은 inert지만 스크롤은 된다. 필요하면 `body:has(dialog[open]) { overflow: hidden }` 한 줄을 추가한다.
- **reduced-motion 대응 내장** — 이동·스케일 없이 100ms 페이드로 대체한다. 애니메이션을 완전히 없애면 닫힘이 `animationend`에 걸리므로(폴백 500ms 뒤 닫힘) 페이드를 남긴 것이다. 블록 제거 금지.
