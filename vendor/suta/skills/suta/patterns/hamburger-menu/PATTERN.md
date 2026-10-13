---
name: hamburger-menu
description: 햄버거 버튼(≡, 삼선 아이콘)이 X로 모핑하며 옆에서 사이드 드로어가 밀려 나오는 모바일 내비게이션(hamburger menu)을 구현한다. "햄버거 메뉴, 사이드 메뉴, 드로어, 슬라이드 메뉴, 삼선 누르면 옆에서 메뉴 나오게, 모바일 전체 메뉴" 요청과 모바일 헤더의 내비게이션 패널에 쓴다. 기존 적용분의 방향(왼쪽/오른쪽)·속도·폭 수정에도 쓴다.
---

# hamburger-menu — 햄버거 메뉴 모핑 + 드로어

라이브 데모: https://guksu.github.io/suta/#/hamburger-menu

## 언제 쓰는가

모바일 헤더에서 전체 내비게이션을 옆에서 꺼내는 패턴. 버튼의 ≡가 X로 모핑해 "열림/닫힘" 상태를 버튼 스스로 말하고, 드로어가 옆에서 밀려 나온다. 대부분의 모바일 웹 헤더가 이 관례다 — 아이콘만 바꿔치기(≡ ↔ ✕ 두 아이콘 교체)하면 상태 전환이 보이지 않지만, 모핑은 같은 막대가 접히는 과정이 보인다.

**기술 선택:** CSS transition만 사용, JS는 상태 토글뿐. 아이콘 모핑은 `aria-expanded` 속성 하나에 반응한다 — 시각 상태와 접근성 상태가 같은 속성이라 어긋날 수 없다. 막대 이동·회전은 전부 transform/opacity(GPU 합성)이고 레이아웃 애니메이션이 없다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/hamburger-menu.css` | 아이콘 모핑·드로어 슬라이드·백드롭 정의 | 모든 프로젝트 |
| `assets/HamburgerMenu.tsx` | React 래퍼 (버튼 + 드로어: Esc·백드롭·스크롤 잠금) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { HamburgerButton, Drawer } from './HamburgerMenu'

const Header = () => {
  const [open, setOpen] = useState(false)

  return (
    <header>
      <HamburgerButton open={open} onToggle={() => setOpen(!open)} label="메뉴 열기" />
      <Drawer open={open} onClose={() => setOpen(false)}>
        <nav>
          <a href="/intro">소개</a>
          <a href="/menu">면 메뉴</a>
          <a href="/location">매장 안내</a>
        </nav>
      </Drawer>
    </header>
  )
}
```

- `side="right"`로 오른쪽에서 나오게 할 수 있다.
- 드로어는 언마운트하지 않고 `data-open`으로 여닫는다 — 닫힘 애니메이션이 공짜다.

## 사용 방법 — 순수 JS (React 없음)

버튼의 `aria-expanded`와 드로어·백드롭의 `data-open`만 토글하면 CSS가 나머지를 한다.

```html
<button class="hamburger" aria-expanded="false" aria-label="메뉴 열기">
  <span class="hamburger-bar"></span><span class="hamburger-bar"></span><span class="hamburger-bar"></span>
</button>
<div class="drawer-backdrop" data-open="false"></div>
<aside class="drawer" data-open="false" role="dialog" aria-modal="true"><!-- 링크들 --></aside>
```

```js
const button = document.querySelector('.hamburger')
const drawer = document.querySelector('.drawer')
const backdrop = document.querySelector('.drawer-backdrop')

const setOpen = (open) => {
  button.setAttribute('aria-expanded', String(open))
  drawer.dataset.open = String(open)
  backdrop.dataset.open = String(open)
  document.body.style.overflow = open ? 'hidden' : ''
}
button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'))
backdrop.addEventListener('click', () => setOpen(false))
window.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false))
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 아이콘 색 | `--hamburger-color` (기본 currentColor) |
| 아이콘 모핑 속도 | `--hamburger-duration` (기본 300ms) |
| 막대 폭·두께·간격 | `--hamburger-bar-width`(22px)·`--hamburger-bar-height`(2px)·`--hamburger-gap`(7px) |
| 드로어 폭 | `--drawer-width` (기본 min(300px, 80vw)) |
| 드로어 속도 | `--drawer-duration` (기본 300ms — 열림 거리가 길어 아이콘과 같은 값이 자연스럽다) |
| 드로어 배경 | `--drawer-bg` (기본 #fff) |

## 주의사항

- **버튼 상태는 `aria-expanded`가 유일한 스위치다** — 클래스 토글로 바꾸지 말 것. CSS가 이 속성을 보고 모핑하므로 접근성 상태가 시각과 함께 움직인다.
- 드로어가 열려 있는 동안 body 스크롤을 잠근다(React 래퍼 내장, 순수 JS는 위 예시처럼 직접). 잠그지 않으면 드로어 뒤 페이지가 스크롤되어 사용자가 위치를 잃는다.
- 위·아래 막대의 X 교차는 `--hamburger-gap`만큼 이동한 위치에서 시작하므로, 간격을 크게 키우면 회전 전 이동이 길어진다 — 그 경우 duration도 함께 늘린다.
- **reduced-motion 대응 내장** — 아이콘은 즉시 전환, 드로어는 슬라이드 대신 페이드. 블록 제거 금지.
- 완전한 포커스 트랩(드로어 안에 Tab 가두기)은 포함하지 않았다 — 필요하면 열릴 때 첫 링크로 포커스를 옮기고 닫힐 때 버튼으로 되돌리는 처리를 추가한다.
