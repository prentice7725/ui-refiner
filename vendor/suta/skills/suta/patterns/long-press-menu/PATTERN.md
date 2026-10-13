---
name: long-press-menu
description: 길게 누르면(long press) 항목이 살짝 떠오르고 뒤가 흐려지며 옆에 액션 메뉴가 나타나는 iOS식 미리보기 메뉴를 구현한다 — 데스크톱은 우클릭으로 열린다. "꾹 누르면 메뉴, 롱프레스 메뉴, 사진 길게 눌러 옵션, 아이폰 홈 화면 아이콘처럼 떠오르는 메뉴, 우클릭 context menu" 요청에 쓴다. 기존 적용분의 누르는 시간·흐림 강도·메뉴 위치·항목 수정에도 쓴다.
---

# long-press-menu — 길게 눌러 메뉴

라이브 데모: https://guksu.github.io/suta/#/long-press-menu

## 언제 쓰는가

목록·격자의 항목(메뉴 카드·사진·앱 아이콘)에 **부가 동작**(담기·즐겨찾기·숨기기)을 붙이고 싶은데, 항목마다 ⋯ 버튼을 그리면 화면이 지저분해질 때. iOS 홈 화면 아이콘·사진 앱·메시지 말풍선이 이 관례다 — 길게 누르면 항목이 살짝 떠오르고(scale 1.04 + 그림자) 뒤가 흐려지며 항목 옆에 메뉴가 자라 나온다. 데스크톱에서는 우클릭이 같은 메뉴를 연다(macOS의 "길게 누르기 = 우클릭" 관례).

반대 의견: 길게 누르기는 **보이지 않는 제스처**라 처음 온 사용자는 존재를 모른다. 필수 동작(삭제·결제)은 이 메뉴에만 두지 말고 상세 화면·⋯ 버튼(dropdown-menu 패턴)에도 두라. 이 메뉴는 "아는 사람이 빨리 가는 길"이다.

**기술 선택:** 포인터 이벤트 타이머 + CSS transition/animation, 라이브러리 없음. 길게 누르기는 "누르고 N ms 동안 움직이지 않음"이라는 판정 문제라 JS가 필요하지만, 떠오름·흐림·메뉴 등장은 전부 CSS다(`transform`·`opacity`·`backdrop-filter`). 메뉴 위치는 DOM 없는 순수 함수로 분리해 테스트가 명세를 대신한다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createLongPress.ts` | 코어 — 타이머·이동 허용치·우클릭·발화 후 click 억제 | 모든 프로젝트 |
| `assets/placeContextMenu.ts` | 코어 — 메뉴 위치(아래 왼쪽 정렬 → 위로 뒤집기 → 좌우 클램프) | 모든 프로젝트 |
| `assets/long-press-menu.css` | 떠오름·백드롭 흐림·메뉴 등장·reduced-motion | 모든 프로젝트 |
| `assets/LongPressMenu.tsx` | React 래퍼 (열기·백드롭·키보드·포커스 복귀) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

항목을 `LongPressMenu`로 감싼다. 복제본을 만들지 않고 **감싼 원본 자체가 떠오른다**.

```tsx
import { LongPressMenu } from './LongPressMenu'

const MenuCard = ({ item }) => (
  <LongPressMenu
    label={`${item.name} 동작`}
    items={[
      { label: '장바구니 담기', onSelect: () => addToCart(item) },
      { label: '즐겨찾기', onSelect: () => favorite(item) },
      { label: '숨기기', onSelect: () => hide(item), destructive: true },
    ]}
  >
    <article className="menu-card">
      <h3>{item.name}</h3>
      <p>{item.price}</p>
    </article>
  </LongPressMenu>
)
```

- 열림: 길게 누르기(기본 450ms, `delayMs`) 또는 우클릭. 키보드는 카드에 포커스한 뒤 Shift+F10(또는 메뉴 키).
- 열리면 첫 항목에 포커스, ArrowUp/Down 순환, Home/End, Esc 닫기. 항목을 고르면 `onSelect` 뒤 닫히고 포커스가 카드로 돌아온다.
- 닫힘: 백드롭 클릭·Esc·스크롤·항목 선택.
- `destructive: true` 항목은 붉은 글자로 표시된다(맨 아래에 두라).

## 사용 방법 — 순수 JS (React 없음)

카드·백드롭·메뉴를 **같은 부모 아래 형제**로 두고, 코어 두 개를 붙인다. 열림 상태는 `data-open`과 요소 표시로만 바꾸면 CSS가 연출한다:

```js
import { createLongPress } from './createLongPress.js'
import { placeContextMenu } from './placeContextMenu.js'

const card = document.querySelector('.lpm-item')
const backdrop = document.querySelector('.lpm-backdrop')
const menu = document.querySelector('.lpm-menu')

const setOpen = (open) => {
  card.dataset.open = String(open)
  backdrop.hidden = !open
  menu.hidden = !open
  if (!open) {
    card.focus()
    return
  }
  const rect = card.getBoundingClientRect()
  const { top, left, side } = placeContextMenu({
    anchor: rect,
    menu: { width: menu.offsetWidth, height: menu.offsetHeight },
    viewport: { width: window.innerWidth, height: window.innerHeight },
  })
  menu.style.top = `${top}px`
  menu.style.left = `${left}px`
  menu.dataset.side = side
  menu.querySelector('[role="menuitem"]').focus()
}

createLongPress({ target: card, onLongPress: () => setOpen(true) })
backdrop.addEventListener('click', () => setOpen(false))
window.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false))
window.addEventListener('scroll', () => setOpen(false), true)
```

메뉴 마크업은 `role="menu"` 안에 `role="menuitem"` 버튼(`class="lpm-menu-item"`, 붉은 항목은 `data-destructive="true"`)이다. 방향키 순환은 React 래퍼의 `onMenuKeyDown`을 그대로 옮기면 된다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 누르고 있어야 하는 시간 | `delayMs` (기본 450ms — 300 아래면 스크롤하려던 손가락이 메뉴를 열고, 700 위면 고장 난 줄 안다) |
| 이동 허용치 | `moveTolerancePx` (기본 10px — 손가락 떨림은 통과, 스크롤 시작은 취소) |
| 떠오름·등장 속도 | `--lpm-duration` (기본 220ms, 이징 `cubic-bezier(0.22, 1, 0.36, 1)` 내장) |
| 뒤 흐림 강도 | `--lpm-blur` (기본 12px — 0이면 어둡게만 됨) |
| 백드롭 색 | `--lpm-tint` (기본 검정 35%) |
| 메뉴 배경·모서리·글자색 | `--lpm-menu-bg`·`--lpm-radius`·`--lpm-menu-color` |
| 떠오른 항목 그림자 | `--lpm-lift-shadow` |
| 붉은 항목 색 | `--lpm-destructive` |
| 메뉴 간격·여백 | `placeContextMenu`의 `gap`·`padding` (기본 8px) |

## 주의사항

- **트리거에는 `role="button"`을 준다.** 역할이 없는 `div`에는 `aria-expanded`·`aria-haspopup`이 허용되지 않아 화면 낭독기가 메뉴가 있다는 것을 알리지 못한다. React 래퍼는 이미 그렇게 그린다.
- **트리거·백드롭·메뉴는 같은 부모 아래 형제여야 한다.** 원본 카드를 백드롭 위로 띄우는 방법이 z-index(카드 41 > 백드롭 40)인데, 이 비교는 같은 stacking context 안에서만 성립한다. 메뉴를 포털로 `body`에 보내면 카드 조상에 `transform`·`opacity`·`filter` 하나만 있어도 카드가 백드롭 밑으로 가라앉는다. React 래퍼는 이미 그렇게 그린다.
- **백드롭은 `position: fixed`** — 조상에 `transform`·`filter`·`will-change`가 있으면 fixed 기준이 그 조상으로 바뀌어 화면 전체를 못 덮는다. 격자 컨테이너에 그런 속성을 두지 마라.
- 카드의 `touch-action: manipulation`·`-webkit-touch-callout: none`·`user-select: none`은 터치 브라우저의 기본 길게누르기(링크 미리보기·이미지 저장·텍스트 선택)를 막는다 — 제거 금지. 카드 안 텍스트를 사용자가 복사해야 한다면 이 패턴이 맞지 않는다.
- 발화 뒤의 `click`은 **한 번** 억제된다. 카드 안에 링크·버튼이 있으면 길게 눌러도 그것이 눌리지 않는 이유다. 카드 클릭 이동(상세 화면)은 그대로 살아 있다 — 짧게 누르면 이동, 길게 누르면 메뉴.
- 안드로이드는 터치 길게누르기에도 `contextmenu`를 만든다. 코어가 타이머 발화 직후의 contextmenu를 무시해 두 번 열리지 않는다 — `delayMs`를 브라우저 기본(약 500ms)보다 길게 잡으면 우리 타이머 대신 contextmenu 경로로 먼저 열리는데, 결과는 같다.
- `backdrop-filter`는 비싸다. 열린 동안 한 장뿐이라 괜찮지만, `--lpm-blur`를 애니메이션하지 마라(등장은 opacity만 움직인다).
- 열린 채 스크롤되면 메뉴가 항목을 따라가지 않고 **닫힌다**(iOS도 그렇다). 따라다니게 하려면 `scroll` 리스너에서 닫는 대신 `placeContextMenu`를 다시 부르면 된다.
- **reduced-motion 대응 내장** — 떠오르는 스케일과 메뉴의 커지는 이동을 끄고 페이드만 남긴다. 블록 제거 금지.
- 포커스 트랩은 없다. 메뉴는 Tab으로 빠져나가면 닫힌다 — 메뉴 항목이 몇 개뿐인 액션 메뉴에는 그것이 관례다.
