---
name: drag-to-reorder
description: 목록 항목을 잡고 끌어서 순서를 바꾸는 드래그 정렬(drag and drop reorder) 리스트를 구현한다 — 끌면 항목이 떠오르고 지나친 항목들이 자리를 비켜 주며, 방향키로도 순서를 바꿀 수 있다. "순서 바꾸기, 드래그로 정렬, 끌어서 이동, 목록 순서 변경, 할 일 순서 바꾸기" 요청에 쓴다. 기존 적용분의 손잡이·길게 누르기·속도 수정에도 쓴다.
---

# drag-to-reorder — 끌어서 순서 바꾸기

라이브 데모: https://guksu.github.io/suta/#/drag-to-reorder

## 언제 쓰는가

할 일 목록·재생 목록·설정 항목·이미지 순서처럼 **사용자가 직접 정한 순서가 데이터인 목록**에. 정렬 기준이 서버에 있는 목록(최신순·인기순)에는 쓰지 않는다.

flip-list 패턴과 헷갈리기 쉬운데 다루는 것이 다르다:

| 패턴 | 순서를 바꾸는 주체 | 하는 일 |
|------|-------------------|---------|
| flip-list | 코드 (정렬 버튼·필터) | 바뀐 결과를 미끄러지게 보여준다 |
| **drag-to-reorder** | 사용자 (손가락·방향키) | 끄는 동안 자리를 비켜 주고, 놓은 자리를 새 순서로 확정한다 |

**기술 선택:** Pointer Events + transform. 드래그 중에는 DOM 순서를 건드리지 않고 `transform`으로 자리만 비켜 둔다 — 끄는 도중 목록을 다시 그리면 손가락 아래의 요소가 바뀌어 제스처가 끊긴다. 놓고 정착이 끝난 뒤에 한 번만 실제 순서를 바꾼다. 라이브러리 불필요.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createDragReorder.ts` | 코어 — 드래그·자리 비키기·정착·방향키 이동 | 모든 프로젝트 |
| `assets/useDragReorder.ts` | React 훅 | React 프로젝트만 |
| `assets/drag-to-reorder.css` | 비켜 주는 이동·들어올린 모습·손잡이 | 모든 프로젝트 |

## 사용 방법 — React

1. 세 파일을 프로젝트로 복사한다(TS가 아니면 타입을 벗겨 `.js`로).
2. 목록에 `containerRef`, 각 항목에 **고유한 `data-reorder-id`**, 손잡이 버튼에 `getHandleProps()`를 준다.

```tsx
import { useDragReorder } from './useDragReorder'

const TodoList = () => {
  const [todos, setTodos] = useState([
    { id: 'broth', text: '육수 내리기' },
    { id: 'noodle', text: '면 삶기' },
    { id: 'garnish', text: '고명 올리기' },
  ])

  const reorder = useDragReorder<HTMLUListElement>({
    describe: (id) => todos.find((todo) => todo.id === id)?.text ?? '',
    onReorder: ({ from, to }) => {
      setTodos((prev) => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    },
  })

  return (
    <>
      <ul ref={reorder.containerRef} className="reorder-list">
        {todos.map((todo) => (
          <li key={todo.id} data-reorder-id={todo.id} className="reorder-item">
            <button {...reorder.getHandleProps({ label: todo.text })}>⠿</button>
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>

      {/* 방향키로 순서를 바꾸는 사람에게는 이 안내가 유일한 피드백이다 */}
      <p role="status" aria-live="polite" className="reorder-announcement">
        {reorder.announcement}
      </p>
    </>
  )
}
```

**항목은 컨테이너의 직계 자식이어야 한다.** `<li>` 안에 다시 감싸면 코어가 항목을 찾지 못한다.

### 손잡이 없이 항목 전체를 끌게 하려면

```tsx
const reorder = useDragReorder({ onReorder, longPressMs: 250 })
```

0.25초 누르고 있으면 드래그가 시작된다. 손가락이 그 전에 움직이면 스크롤로 보고 물러난다 — 그렇지 않으면 목록을 스크롤할 수 없게 된다. 마우스는 기다리지 않고 곧바로 시작한다.

이 방식을 쓰더라도 **손잡이 버튼은 남겨 두라.** 방향키 이동의 진입점이 손잡이이기 때문이다.

## 사용 방법 — 순수 JS (React 없음)

```js
import { createDragReorder } from './createDragReorder.js'

createDragReorder({
  container: document.querySelector('.reorder-list'),
  onReorder: ({ from, to }) => {
    const rows = [...list.children]
    list.insertBefore(rows[from], to > from ? rows[to].nextSibling : rows[to])
  },
})
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 끌기 시작 방식 | `longPressMs` (0이면 손잡이로만) | 0 |
| 들어올린 크기 | `liftScale` | 1.02 |
| 비켜 주기·정착 속도 | `settleMs` + CSS `--reorder-duration` (같이 맞춘다) | 200ms |
| 들어올린 그림자 | `--reorder-lift-shadow` | 0 12px 28px rgb(0 0 0 / 0.28) |
| 손잡이 색 | `--reorder-handle-color` | 회색 |
| 화면 낭독 문구 | `messages` — `{ moved({ name, to, total }), handle(label) }`. `to`는 1부터 | 한국어 |

## 주의사항

- **손잡이는 반드시 `<button>`이어야 한다.** 마우스가 없는 사람에게 드래그는 존재하지 않는 기능이다 — 손잡이에 포커스한 뒤 위/아래 방향키로 옮기는 경로가 유일한 대안이고, 그 경로는 버튼일 때만 열린다. `getHandleProps()`가 `aria-label`에 조작 방법까지 넣어 주는 이유다.
- **방향키 이동은 애니메이션 없이 즉시 확정된다.** 방향키는 연타·길게 누르기로 들어오는데, 이동마다 0.2초를 기다리면 입력이 밀려 어디까지 옮겼는지 알 수 없게 된다. 대신 `announcement`가 "면 삶기 — 3개 중 1번째로 이동"처럼 결과를 읽어 준다.
- **항목 간 간격은 균일하다고 가정한다.** 비켜 주는 거리를 첫 두 항목 사이로 재기 때문이다. 항목의 높이는 서로 달라도 되지만(비켜 주는 거리는 끌리는 항목 기준), 간격이 들쭉날쭉하면 정착 위치가 어긋난다.
- **목록 밖으로 끌 때 자동 스크롤은 없다.** 화면에 보이는 범위 안에서 옮기는 것을 전제한다 — 항목이 수십 개라면 방향키 이동이나 "맨 위로 보내기" 메뉴를 함께 두는 편이 실용적이다.
- **가로 목록은 범위 밖이다** — 세로 이동만 계산한다.
- **reduced-motion 대응 내장** — 손가락 추적은 그대로 두고(조작이지 연출이 아니다) 비켜 주기·정착만 즉시 처리한다.
- 드래그 중 `user-select`를 잠근다 — 그렇지 않으면 드래그가 글자 선택으로 바뀐다.
