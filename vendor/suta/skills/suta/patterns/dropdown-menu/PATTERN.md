---
name: dropdown-menu
description: ⋯ 버튼을 누르면 열리는 액션 드롭다운 메뉴(dropdown menu, kebab)를 구현한다 — 화면 아래쪽에서는 위로 뒤집혀 열리고, 방향키·첫 글자로 항목을 옮기며, 바깥 누름·Esc로 닫으면 포커스가 버튼으로 돌아온다. "드롭다운 메뉴, 더보기 메뉴, 케밥 메뉴, 액션 메뉴, 점 세 개 버튼, 수정/삭제 메뉴" 요청에 쓴다. 기존 적용분의 열리는 방향·항목 수정에도 쓴다.
---

# dropdown-menu — 액션 드롭다운 메뉴

라이브 데모: https://guksu.github.io/suta/#/dropdown-menu

## 언제 쓰는가

카드·행·헤더의 `⋯` 버튼을 눌렀을 때 나오는 **동작 목록**에. 이름 바꾸기·공유·삭제처럼 **누르면 무언가가 일어나는** 항목들이다.

이 저장소의 비슷한 패턴들과 역할이 다르다:

| 패턴 | 무엇인가 | ARIA |
|------|---------|------|
| select | 값을 **고른다** (면 종류 선택) | listbox — 포커스는 입력창에 남고 `aria-activedescendant`로 가리킨다 |
| tooltip | **설명**한다 (읽기만) | tooltip — 포커스를 가져가지 않는다 |
| **dropdown-menu** | 동작을 **실행한다** | menu — 포커스가 항목으로 실제로 옮겨 간다 |

패턴을 섞으면 스크린 리더가 엉뚱하게 읽는다. 값을 고르는 UI라면 select 패턴이 맞다.

**기술 선택:** 네이티브 `<button>` + `position: fixed` + 순수 함수 위치 계산. 라이브러리 없이도 되지만, 위치 계산은 눈으로 맞출 수 없어 순수 함수로 분리해 테스트했다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/placeMenu.ts` | 위치 계산 (순수 함수, DOM 없음) | 모든 프로젝트 |
| `assets/createMenu.ts` | 코어 — 열기·닫기·로빙 포커스·첫 글자 점프 | 모든 프로젝트 |
| `assets/DropdownMenu.tsx` | React 컴포넌트 | React 프로젝트만 |
| `assets/dropdown-menu.css` | 패널·항목·등장 방향 | 모든 프로젝트 |

## 어려운 부분은 "어디에 열리는가"다

모양은 쉽고, 실무에서 무너지는 곳은 위치와 포커스다.

| 상황 | 이 패턴의 처리 |
|------|---------------|
| 화면 아래쪽 버튼에서 연다 | 아래가 좁으면 위로 뒤집는다 (`data-side`로 등장 방향도 바뀐다) |
| 화면 오른쪽 끝 버튼에서 연다 | 가로로 넘치면 화면 안으로 밀어 넣는다 |
| 메뉴가 `overflow: hidden` 안에 있다 | `position: fixed`라 잘리지 않는다 |
| 연 채로 스크롤한다 | 트리거를 따라다닌다 |
| Esc로 닫는다 | 포커스가 트리거로 돌아온다 — 키보드 사용자가 처음부터 다시 찾지 않게 |
| 바깥을 눌러 닫는다 | 포커스를 뺏지 않는다 — 그 사람은 **그곳**을 누르려던 것이다 |

## 사용 방법 — React

```tsx
import { DropdownMenu } from './DropdownMenu'

const OrderRow = ({ order }: { order: Order }) => (
  <div className="row">
    <span>{order.name}</span>
    <DropdownMenu
      label="주문 관리"
      align="end"
      items={[
        { id: 'receipt', label: '영수증 보기', onSelect: () => openReceipt(order.id) },
        { id: 'repeat', label: '같은 메뉴 다시 주문', onSelect: () => reorder(order.id) },
        { id: 'cancel', label: '주문 취소', onSelect: () => cancel(order.id), danger: true },
      ]}
    />
  </div>
)
```

`label`은 트리거의 접근성 이름이다 — `⋯`만 있는 버튼은 스크린 리더에 "점 세 개"로 읽히므로 반드시 준다.

**항목을 고르면 메뉴가 먼저 닫히고(포커스가 트리거로 돌아간 뒤) `onSelect`가 실행된다.** 실행이 화면을 갈아 끼워도 포커스를 잃지 않게 하기 위한 순서다.

## 사용 방법 — 순수 JS (React 없음)

```html
<button id="more">⋯</button>
<div id="menu" role="menu" class="menu-panel">
  <button role="menuitem" class="menu-item" tabindex="-1">영수증 보기</button>
  <button role="menuitem" class="menu-item" tabindex="-1">주문 취소</button>
</div>
```

```js
import { createMenu } from './createMenu.js'

const menu = createMenu({
  trigger: document.querySelector('#more'),
  menu: document.querySelector('#menu'),
  align: 'end',
})

document.querySelector('#menu').addEventListener('click', (event) => {
  if (event.target.matches('[role="menuitem"]')) menu.close()
})
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 가로 정렬 | `align` — `'start'`(왼쪽 맞춤) / `'end'`(오른쪽 맞춤) | start |
| 트리거와의 간격 | `gap` (코어 옵션) | 6px |
| 화면 가장자리 여백 | `padding` (`placeMenu` 옵션) | 8px |
| 최소 너비·색 | `--menu-min-width`·`--menu-bg`·`--menu-border`·`--menu-active-bg`·`--menu-danger` | 11rem / 흰색 / 회색 / 연회색 / 빨강 |
| 펼침 속도 | `--menu-duration` | 140ms |

## 주의사항

- **항목은 `<button role="menuitem">`이고 `tabindex="-1"`이다.** 탭 순서에는 트리거만 남고, 메뉴 안 이동은 방향키가 맡는다(로빙 포커스). 항목까지 탭으로 훑게 만들면 메뉴가 열릴 때마다 탭 순서가 늘어난다.
- **비활성 항목에 `disabled`를 쓰지 않고 `aria-disabled`를 쓴다.** `disabled`는 포커스가 닿지 않아 "왜 못 누르는지" 알 수 없다. 방향키는 건너뛰되 스크린 리더에는 존재와 이유가 남는다.
- **되돌리기 어려운 항목(`danger`)은 붉게 표시하되, 확인은 이 패턴 밖이다.** 삭제 확인이 필요하면 modal-dialog 패턴과 조합한다.
- **하위 메뉴(submenu)는 범위 밖이다.** 필요해졌다면 메뉴가 아니라 화면 구조를 다시 볼 시점인 경우가 많다.
- **마우스 hover만으로 열지 않는다.** 터치 기기에는 hover가 없고, 스치는 커서에 열리는 메뉴는 방해가 된다.
- **reduced-motion 대응 내장** — 펼쳐지는 연출만 사라지고 메뉴는 그대로 나타난다.
- 열려 있는 동안 스크롤·창 크기 변화를 따라다닌다. 목록이 아주 긴 화면에서 성능이 걱정되면 스크롤 시 닫는 방식으로 바꿔도 된다.
