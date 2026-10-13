---
name: loading-button
description: 제출(submit) 버튼의 진행 상태 표시(loading button)를 구현한다 — 누르면 라벨이 스피너(spinner)로 바뀌고 완료되면 체크가 그려지며, 진행 중 재클릭은 무시돼 요청이 한 번만 나간다. "로딩 버튼, 버튼에 로딩 돌게, 저장/결제 버튼 스피너, 중복 제출 막기, 두 번 눌러도 요청 한 번만, 저장 중 표시" 요청에 쓴다. 문구·완료 체크 유지 시간 수정에도 쓴다.
---

# loading-button — 제출 버튼 진행 표시

라이브 데모: https://guksu.github.io/suta/#/loading-button

## 언제 쓰는가

주문·결제·저장·로그인처럼 **누른 뒤 서버 응답을 기다리는 버튼**에. 응답이 오기 전까지 버튼이 그대로면 사용자는 눌린 줄 모르고 한 번 더 누른다 — 그 결과가 중복 주문·중복 결제다.

이 패턴이 다루는 것은 스피너 그림이 아니라 **시간**이다. 세 가지 문제를 함께 푼다:

| 문제 | 이 패턴의 처리 |
|------|----------------|
| 기다리는 동안 또 누른다 | 진행 중 클릭을 무시한다 (`disabled` 대신 `aria-disabled` — 포커스를 뺏지 않아 완료 안내를 들을 수 있다) |
| 응답이 80ms만에 와서 스피너가 깜빡인다 | 최소 로딩 시간(기본 400ms)을 지켜 "지나간 깜빡임"을 없앤다 |
| 완료를 못 보고 지나간다 | 완료 표시를 1.2초 유지한 뒤 원래 버튼으로 돌아온다 |

**기술 선택:** 상태 판정은 의존성 0인 코어(`createAsyncAction`), 모습 전환은 CSS. 애니메이션 라이브러리를 쓰지 않는다 — 필요한 것은 opacity/transform 전환과 SVG 획 그리기뿐이다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createAsyncAction.ts` | 코어 — 상태 기계(중복 차단·최소 로딩·표시 유지) | 모든 프로젝트 |
| `assets/useAsyncAction.ts` | React 훅 | React 프로젝트만 |
| `assets/LoadingButton.tsx` | 버튼 컴포넌트 | React 프로젝트만 |
| `assets/loading-button.css` | 상태 레이어·스피너·체크·흔들림 | 모든 프로젝트 |

## 사용 방법 — React

1. 위 4개 파일을 프로젝트로 복사한다(TS가 아니면 타입을 벗겨 `.js`/`.jsx`로).
2. 버튼을 `LoadingButton`으로 바꾸고, `onClick` 대신 `onAction`에 **비동기 함수**를 준다.

```tsx
import { LoadingButton } from './LoadingButton'

const OrderForm = () => (
  <LoadingButton
    onAction={() => placeOrder({ menu: 'myeolchi', count: 2 })}
    loadingLabel="주문 중"
    successLabel="주문 완료"
  >
    주문하기
  </LoadingButton>
)
```

`onAction`이 던지는 예외가 곧 실패다 — `fetch`를 쓴다면 `res.ok`를 확인해 직접 던져야 한다(fetch는 404·500에서도 예외를 던지지 않는다).

```tsx
const placeOrder = async () => {
  const res = await fetch('/api/orders', { method: 'POST' })
  if (!res.ok) throw new Error('주문 실패')
  return res.json()
}
```

### 버튼이 아닌 곳에 쓰기

폼 `submit`이나 아이콘 액션처럼 이 버튼 UI가 맞지 않으면 훅만 쓴다:

```tsx
const action = useAsyncAction()

<form onSubmit={(e) => { e.preventDefault(); void action.run(save) }}>
  <input aria-busy={action.isBusy} />
  <button type="submit" aria-disabled={action.isBusy}>
    {action.isBusy ? '저장 중…' : '저장'}
  </button>
</form>
```

## 사용 방법 — 순수 JS (React 없음)

코어와 CSS만 쓰고 DOM은 직접 갱신한다:

```js
import { createAsyncAction } from './createAsyncAction.js'

const button = document.querySelector('.loading-button')
const action = createAsyncAction({
  onChange: (status) => {
    button.dataset.status = status
    button.setAttribute('aria-disabled', String(status === 'loading'))
  },
})

button.addEventListener('click', () => action.run(placeOrder))
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 상태별 문구 | `loadingLabel`·`successLabel`·`errorLabel` | 전송 중 / 완료 / 실패 |
| 최소 로딩 시간 | `minLoadingMs` | 400ms |
| 완료·실패 표시 유지 | `successHoldMs`·`errorHoldMs` | 1200ms / 1800ms |
| 색 | `--loading-button-bg`·`--loading-button-success`·`--loading-button-error` | 거의 검정 / 짙은 초록 / 빨강 — 강조색 토큰(`--color-accent`)에 연결한다 |
| 전환 속도 | `--loading-button-duration` | 220ms |

## 주의사항

- **버튼 폭은 고정된다.** 상태 레이어 4개를 grid 한 칸에 겹쳐 두어 가장 넓은 레이어가 폭을 정하기 때문이다 — 문구를 크게 바꿔도 레이아웃이 출렁이지 않는다. 반대로 아주 긴 문구를 넣으면 idle 상태에서도 그만큼 넓어진다.
- **버튼 이름은 상태와 무관하게 고정된다.** 진행·완료·실패 레이어는 눈에만 보이고 `aria-hidden`이라 스크린 리더에는 언제나 "주문하기"로 읽힌다 — 대신 `role="status"` 영역이 상태 변화를 따로 알린다. 버튼 이름 자체가 "전송 중"으로 바뀌면 무슨 버튼이었는지 알 수 없게 되기 때문이다.
- **`disabled`를 쓰지 않는 것은 의도다.** 진행 중 버튼을 `disabled`로 잠그면 포커스가 body로 튕겨 나가 스크린 리더 사용자가 완료 안내를 놓친다. 대신 `aria-disabled`로 알리고 클릭은 코어가 무시한다.
- **실패 후 재시도는 사용자가 다시 누르는 것이다** — 자동 재시도는 넣지 않았다. 실패 원인 문구는 버튼이 아니라 폼의 에러 영역에 띄우고(form-shake-error 패턴), 버튼은 상태만 보여주는 편이 낫다.
- **reduced-motion 대응 내장** — 흔들림·체크 그려짐·레이어 전환은 사라지지만 스피너 회전은 남는다(느리게). 회전은 연출이 아니라 "아직 진행 중"이라는 유일한 신호다.
- 언마운트 뒤 늦게 도착한 응답은 상태를 건드리지 않는다(`destroy`).
