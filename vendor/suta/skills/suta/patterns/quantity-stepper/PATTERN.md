---
name: quantity-stepper
description: 수량 조절 스테퍼(quantity stepper, − / + 버튼) 컴포넌트를 구현한다 — 꾹 누르고 있으면 점점 빨리 올라가고, 숫자를 직접 입력할 수 있으며, 1에서 −를 누르면 삭제로 이어진다. "수량 늘리고 줄이는 버튼, 플러스 마이너스로 개수 바꾸기, 장바구니 수량, 수량 버튼" 요청에 쓴다. 기존 적용분의 최대·최소 제한과 길게 누를 때 속도 수정에도 쓴다.
---

# quantity-stepper — 수량 스테퍼

라이브 데모: https://guksu.github.io/suta/#/quantity-stepper

## 언제 쓰는가

장바구니 수량, 인원수, 옵션 개수처럼 **작은 정수를 오르내리며 고칠 때**. 값의 범위가 넓거나(1~1000) 정확한 숫자를 아는 경우에는 입력창이 낫다 — 이 패턴도 숫자를 직접 칠 수 있게 열어 둔 이유가 그것이다.

**기술 선택:** 네이티브 `<button>` + `<input>`. 반복 타이밍만 의존성 0 코어로 분리했다 — "누르고 있으면 빨라진다"는 눈으로 맞출 수 없고 테스트로 고정해야 하는 규칙이기 때문이다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createHoldRepeat.ts` | 코어 — 길게 누르면 가속 반복 (수량 말고도 쓸 수 있다) | 모든 프로젝트 |
| `assets/QuantityStepper.tsx` | React 컴포넌트 | React 프로젝트만 |
| `assets/quantity-stepper.css` | 버튼·숫자 칸·값 전환 | 모든 프로젝트 |

## 이 패턴이 챙기는 것

| 상황 | 처리 |
|------|------|
| 20까지 올려야 한다 | 누르고 있으면 반복되고, 오래 누를수록 빨라진다(0.4초 뒤 시작 → 간격이 45ms까지 줄어듦) |
| 짧게 한 번 눌렀다 | 딱 한 칸만 오른다 — 반복은 0.4초 뒤부터라 연타로 바뀌지 않는다 |
| 손가락이 버튼 밖으로 미끄러졌다 | 반복이 멈춘다(`pointerleave`·`pointercancel`) |
| 정확한 수를 안다 | 숫자 칸에 직접 친다 — 다 치면 눈금·범위에 맞춰 정리된다 |
| 수량 1에서 −를 눌렀다 | `onBelowMin`을 주면 **삭제**로 이어진다(장바구니 관례) |
| 끝에 닿았다 | 버튼이 흐려지되 포커스는 받는다 — 왜 못 누르는지 알 수 있게 |

## 사용 방법 — React

```tsx
import { QuantityStepper } from './QuantityStepper'

const CartRow = ({ item }: { item: CartItem }) => (
  <div className="cart-row">
    <span>{item.name}</span>
    <QuantityStepper
      value={item.count}
      onChange={(count) => updateCount({ id: item.id, count })}
      min={1}
      max={20}
      label={`${item.name} 수량`}
      // 수량 1에서 −를 누르면 빼기 대신 삭제 — 배달앱에서 익숙한 동작이다
      onBelowMin={() => removeFromCart(item.id)}
    />
  </div>
)
```

`label`은 그룹과 버튼의 접근성 이름이 된다 — 목록에 스테퍼가 여러 개면 "수량 늘리기" 버튼이 전부 같은 이름으로 읽히므로 **항목 이름을 넣는다**.

### 수량 말고 다른 것에 쓰기

가속 반복만 필요하면 코어만 가져다 쓴다(볼륨, 시간 설정, 지도 확대 등):

```js
import { createHoldRepeat } from './createHoldRepeat.js'

const held = createHoldRepeat({ onRepeat: () => zoomIn(), delayMs: 300, intervalMs: 120 })

button.addEventListener('pointerdown', () => {
  zoomIn() // 첫 실행은 즉시
  held.start()
})
button.addEventListener('pointerup', held.stop)
button.addEventListener('pointerleave', held.stop)
button.addEventListener('pointercancel', held.stop)
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 범위·눈금 | `min`·`max`·`step` | 1 / 99 / 1 |
| 반복 시작까지 | `delayMs` (코어) | 400ms |
| 반복 간격·가속 | `intervalMs`·`acceleration`·`minIntervalMs` (코어) | 160ms / 0.82배 / 45ms |
| 높이·색 | `--qty-height`·`--qty-bg`·`--qty-border`·`--qty-accent` | 2.5rem / 흰색 / 회색 / 거의 검정(#1b1e24) |
| 숫자 칸 너비 | `--qty-value-width` | 3rem |
| 버튼 이름 | `buttonLabels` — `{ decrease, remove, increase }`, 각각 그룹 이름(label)을 받는다 | "{label} 줄이기·삭제·늘리기" |

## 주의사항

- **값의 정리 순서가 중요하다.** 범위로 먼저 가둔 뒤 눈금에 맞춘다 — 반대로 하면 999가 눈금에 맞춰진 뒤 최댓값으로 잘려, 눈금에 없는 값이 남는다(`step=2`인데 20이 되는 식).
- **반복 중에는 다시 그려지기를 기다리지 않는다.** React가 여러 변경을 묶어 처리하면 그동안의 반복이 모두 같은 값에서 출발해 한 번만 오른다. 그래서 다음 값을 즉시 기록한 뒤 알린다.
- **빈 입력은 0이 아니다.** `Number('')`는 0이라, 사용자가 지우거나 글자만 친 경우를 걸러내지 않으면 수량이 최솟값으로 튄다.
- **버튼에 `disabled`를 쓰지 않는다.** 포커스가 닿지 않으면 "왜 더 못 줄이는지"를 알 수 없다. `aria-disabled`로 알리고 동작만 막는다.
- **`touch-action: manipulation`이 걸려 있다** — 빠르게 두 번 누를 때 모바일 브라우저가 화면을 확대하지 않게 한다.
- **서버 반영은 이 패턴 밖이다.** 누르고 있으면 값이 초당 스무 번 바뀌므로, 그대로 요청을 보내면 서버를 때린다. 값이 멎은 뒤에 보내거나(디바운스), 화면만 먼저 바꾸고 나중에 맞추는 방식으로 감싼다.
- **reduced-motion 대응 내장** — 숫자가 밀려 들어오는 연출만 사라지고 값은 그대로 바뀐다.
