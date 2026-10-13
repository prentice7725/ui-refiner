---
name: bottom-sheet
description: 바텀시트(bottom sheet) 컴포넌트 — 아래에서 올라오는 시트를 구현한다. 드래그로 끌어내려 닫기·백드롭·Esc 포함. "바텀시트, 하단 시트, 밑에서 올라오는 시트/메뉴, 끌어내려서 닫기" 요청과 모바일에서 옵션을 고르는 액션 시트·필터 UI에 쓴다. 기존 적용분의 닫히는 속도·임계값·높이 수정에도 쓴다.
---

# bottom-sheet — 바텀시트

라이브 데모: https://guksu.github.io/suta/#/bottom-sheet

## 언제 쓰는가

모바일에서 화면 하단에서 올라오는 패널 — 액션 메뉴·필터·상세 정보. 토스(송금 확인)·당근(카테고리 선택)·배민(옵션 선택) 전부 이 관례다. 손가락으로 끌어내려 닫는 제스처가 핵심이다.

**기술 선택:** 포인터 이벤트 직접 구현 + CSS transition, 라이브러리 없음. 드래그 제스처는 CSS만으로 안 되는 첫 영역이지만, "드래그 중에는 transition을 끄고 손가락을 따라가고, 놓으면 CSS transition이 스냅백/닫힘을 처리"하는 분업으로 JS는 판정만 담당한다 — 복사해 쓰는 패턴에 의존성을 들이지 않기 위한 선택이다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createSheetDrag.ts` | 코어 — 드래그 추적·거리/속도 닫기 판정 | 모든 프로젝트 |
| `assets/bottom-sheet.css` | 시트·백드롭·핸들·이동 정의 | 모든 프로젝트 |
| `assets/BottomSheet.tsx` | React 래퍼 (드래그+백드롭+Esc+스크롤 잠금) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { BottomSheet } from './BottomSheet'

const Menu = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>메뉴 열기</button>
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <ul>…메뉴 항목…</ul>
      </BottomSheet>
    </>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

시트·백드롭 요소를 만들어두고 `data-open`만 토글하면 CSS가 여닫는다. 드래그 닫기는 코어를 붙인다:

```js
import { createSheetDrag } from './createSheetDrag.js'

const sheet = document.querySelector('.bottom-sheet')
const backdrop = document.querySelector('.sheet-backdrop')
const setOpen = (open) => {
  sheet.dataset.open = String(open)
  backdrop.dataset.open = String(open)
  document.body.style.overflow = open ? 'hidden' : ''
}

backdrop.addEventListener('click', () => setOpen(false))
createSheetDrag({ sheet, onDismiss: () => setOpen(false) })
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 열림/닫힘 속도 | `--sheet-duration` (기본 350ms — 드로어 커브 `cubic-bezier(0.32, 0.72, 0, 1)` 내장) |
| 배경·모서리·최대 높이 | `--sheet-bg`·`--sheet-radius`·`--sheet-max-height` |
| 닫기 임계 거리 | `dismissThresholdPx` (기본 120px) |
| 닫기 임계 속도 | `dismissVelocity` (기본 0.5px/ms — 짧게 끌어도 빠르게 던지면 닫힘) |
| 드래그 영역 | `handle` 옵션 — 시트 내부에 스크롤 콘텐츠가 있으면 핸들 요소만 지정한다 |
| 스냅 포인트 | `snapOffsetsPx` — 예: `[0, 260]`(전체 열림·반열림). 마지막 스냅에서 시작해 드래그로 오가고, 마지막 스냅 아래로 끌면 닫힌다. 0을 반드시 포함 |

## 주의사항

- **시트 내부에 스크롤이 있으면 드래그 영역을 핸들로 한정하라** — 시트 전체가 드래그를 받으면(기본) 내부 스크롤과 제스처가 충돌한다. `createSheetDrag({ handle: 핸들요소 })`.
- **누른 뒤 8px 움직여야 끌기로 본다** — 누르는 순간 포인터를 잡으면(`setPointerCapture`) 브라우저가 뒤따르는 click을 시트로 넘겨 시트 안 버튼(장바구니 담기·바로 구매)이 눌리지 않는다. 코어를 고칠 때 이 순서를 지킨다.
- 시트의 `touch-action: none`은 모바일에서 페이지 스크롤과의 경합을 막는다 — 제거 금지. 내부 스크롤 영역에는 `touch-action: pan-y`를 별도로 준다.
- **reduced-motion 대응 내장** — 이동 대신 짧은 페이드로 완화. 블록 제거 금지.
- React 래퍼는 열림 중 body 스크롤을 잠근다(닫히면 복원). iOS 사파리의 고무줄 스크롤까지 완전히 막으려면 별도 처리가 필요하다(이 패턴 범위 밖).
- 포커스 트랩(Tab 순환 가두기)은 포함하지 않았다 — 폼이 든 시트를 만들면 포커스 트랩 라이브러리나 `inert`를 함께 검토하라.
- 스냅 포인트 사용 시 `--sheet-max-height`가 충분히 커야 반열림에서도 콘텐츠가 걸쳐 보인다 — 시트 높이가 스냅 오프셋보다 작으면 반열림이 의미를 잃는다.
