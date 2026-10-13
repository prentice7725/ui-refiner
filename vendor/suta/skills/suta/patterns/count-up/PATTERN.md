---
name: count-up
description: 숫자가 목표값까지 굴러 올라가는 카운트업(count up) 애니메이션을 구현한다 — 잔액·포인트·통계 숫자에 쓴다. "숫자 올라가는 효과, 카운트업, 잔액/포인트 애니메이션, 숫자 롤링, 금액 촤르륵 올라가게" 요청과 대시보드 지표·금액 표시 UI에 쓴다. 기존 적용분의 속도·천 단위 콤마 포맷 수정에도 쓴다.
---

# count-up — 숫자 카운트업

라이브 데모: https://guksu.github.io/suta/#/count-up

## 언제 쓰는가

금액·포인트·통계 지표가 화면에 등장하거나 값이 바뀔 때, 숫자가 목표값까지 굴러 올라가는 연출. 토스의 잔액·송금 완료 화면이 대표 사례다 — 정적인 숫자 교체보다 "값이 변했다"는 사실이 강하게 전달된다.

**기술 선택:** requestAnimationFrame 보간 + `textContent` 갱신(의존성 0). CSS만으로는 숫자 텍스트 보간이 불가능한 영역이라 JS 코어가 필요하다. 자릿수별 슬롯 롤링(각 자리가 릴처럼 도는 연출)은 별도 패턴 영역이다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createCountUp.ts` | 코어 — rAF 보간, 포맷, reduced-motion | 모든 프로젝트 |
| `assets/count-up.css` | 고정폭 숫자(레이아웃 떨림 방지), 화면 낭독기용 최종값(`.count-up-sr`) | 모든 프로젝트 |
| `assets/CountUp.tsx` | React 래퍼 (코어 사용) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { CountUp } from './CountUp'

// value가 바뀔 때마다 직전 값에서 새 값으로 굴러간다 (최초 마운트는 0부터)
const Balance = ({ amount }: { amount: number }) => (
  <strong>
    <CountUp value={amount} format={(v) => `${Math.round(v).toLocaleString('ko-KR')}원`} />
  </strong>
)
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { createCountUp } from './createCountUp.js'

// <strong class="count-up"><span class="balance" aria-hidden="true"></span><span class="count-up-sr">1,234,567</span></strong>
const el = document.querySelector('.balance')
createCountUp({ element: el, to: 1234567, durationMs: 800 }).start()
// 값이 바뀌면: createCountUp({ element: el, from: 이전값, to: 새값 }).start()
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 지속 시간 | `durationMs` (기본 800ms — 금액 강조 연출은 600~1200ms가 무난) |
| 표시 형식 | `format` — `(value) => string`. 기본은 정수 반올림 + 천 단위 구분. 소수·단위·통화는 여기서 |
| 커브 | `easing` — 기본 ease-out cubic(끝에서 감속). 등속으로 세는 느낌이 필요하면 `(t) => t` |
| 시작값 | `from` (기본 0) — 값 갱신 연출은 직전 값을 넣어 이어지게 한다 |

## 주의사항

- **고정폭 숫자는 필수다** — `count-up.css`의 `font-variant-numeric: tabular-nums`가 없으면 자릿수 폭이 매 프레임 달라져 주변 레이아웃이 떨린다.
- **reduced-motion 대응 내장** — 굴러가는 연출 없이 최종값을 즉시 쓴다. 분기 제거 금지.
- **화면 낭독기에는 최종값만 닿게 한다.** 굴러가는 중간값은 보조기기에 소음이다. React 래퍼는 굴러가는 숫자를 `aria-hidden`으로 두고, 최종값을 숨긴 글자(`.count-up-sr`)로 따로 넣는다. 그래서 낭독 영역(`role="status"`·`aria-live`) 안에 두어도 최종값이 한 번만 읽힌다.
  - 순수 JS로 쓸 때도 같은 구조로 만든다: 굴러가는 요소에 `aria-hidden="true"`, 옆에 최종값을 담은 `.count-up-sr` 요소.
  - 낭독 영역에는 사건(포인트를 받았어요·목표 달성)만 넣는다. 매초 바뀌는 걸음 수·타이머·남은 거리는 낭독 영역 밖에 둔다 — 넣으면 바뀔 때마다 읽힌다.
- 서버에서 받은 문자열 금액을 그대로 넣지 마라 — 코어는 number를 보간한다. 파싱은 호출부 책임.
