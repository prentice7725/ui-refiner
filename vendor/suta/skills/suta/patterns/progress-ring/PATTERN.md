---
name: progress-ring
description: 원이 채워지는 원형 진행률 표시(progress ring, 애플워치 활동 링) 컴포넌트를 구현한다. "원형 진행률, 프로그레스 링, 도넛 진행 표시, 동그란 링이 목표 달성률만큼 차오르게, 원형 로딩 스피너" 요청과 목표 달성·업로드 진행률 UI에 쓴다. 기존 적용분의 링 두께·색·속도 수정에도 쓴다.
---

# progress-ring — 원형 진행 링

라이브 데모: https://guksu.github.io/suta/#/progress-ring

## 언제 쓰는가

목표 달성률·업로드·준비 진행률처럼 "얼마나 찼는가"를 한눈에 보여줄 때. 애플워치 활동 링이 대표 관례다 — 막대 진행바보다 자리를 덜 차지하고, 가운데에 숫자·아이콘을 넣을 수 있으며, 여러 지표를 겹친 링으로 한 덩어리에 담을 수 있다. 반대로 단계가 명확한 절차(1/4 → 2/4)나 긴 시간의 다운로드처럼 정확한 수치 읽기가 중요하면 막대 진행바가 낫다 — 원은 길이를 눈으로 비교하기 어렵다.

**기술 선택:** 순수 SVG `<circle>` + CSS transition. `stroke-dasharray`를 둘레로, `stroke-dashoffset`을 둘레 × (1 − 진행률)로 두면 획이 그만큼만 보인다. 두 값을 CSS 변수로 넘기고 `stroke-dashoffset`에 transition을 걸면 값이 바뀔 때 브라우저가 직전 위치에서 새 위치로 알아서 보간한다 — JS 프레임 루프도, 애니메이션 라이브러리도 필요 없다. JS는 반지름·둘레·클램프 계산(순수 함수)만 한다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/ringGeometry.ts` | 코어 — 둘레·offset·클램프·다중 링 반지름 계산(의존성 0) | 모든 프로젝트 |
| `assets/progress-ring.css` | 트랙·진행 원, transition, 무한 로딩 회전, reduced-motion | 모든 프로젝트 |
| `assets/ProgressRing.tsx` | React 단일 링 (가운데 슬롯·indeterminate·over 판정) | React 프로젝트만 |
| `assets/ActivityRings.tsx` | React 다중 링 (3중 링, 링마다 개별 progressbar) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

1. 위 파일을 프로젝트로 복사한다(단일 링만 쓰면 `ActivityRings.tsx`는 생략).
2. 값이 바뀌는 곳에 `value`를 넘긴다 — 직전 값에서 새 값으로 링이 따라간다.

```tsx
import { ProgressRing } from './ProgressRing'
import { ActivityRings } from './ActivityRings'

// 단일 링 — 가운데에 퍼센트 숫자
const OrderProgress = ({ percent }: { percent: number }) => (
  <ProgressRing value={percent} max={100} size={140} stroke={12} label="주문 준비 진행률">
    <strong>{Math.round(percent)}%</strong>
  </ProgressRing>
)

// 3중 링 — 배열 순서가 바깥 → 안쪽
const TodayGoals = () => (
  <ActivityRings
    size={180}
    stroke={16}
    gap={5}
    rings={[
      { value: 96, max: 120, color: '#ff6b6b', label: '판매 그릇 수' },
      { value: 130, max: 200, color: '#ffd166', label: '만두 빚기' },
      { value: 52, max: 80, color: '#4ecdc4', label: '육수 끓이기' },
    ]}
  />
)

// 무한 로딩 — value를 비우면 짧은 호가 돈다
const Loading = () => <ProgressRing label="불러오는 중" size={40} stroke={4} />
```

`ProgressRing` props: `value`(없으면 무한 로딩) · `max`(기본 100) · `size`(기본 120) · `stroke`(기본 12) · `color` · `trackColor` · `label`(aria-label) · `children`(가운데 슬롯).

## 사용 방법 — 순수 JS (React 없음)

마크업은 트랙 원과 진행 원 두 개다. 둘레·offset을 `--ring-circumference`·`--ring-offset`에 px로 넣으면 CSS가 나머지를 한다.

```html
<div class="progress-ring" role="progressbar" aria-label="주문 준비" aria-valuemin="0" aria-valuemax="100" aria-valuenow="45" style="width:120px;height:120px">
  <svg class="progress-ring-svg" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
    <circle class="progress-ring-track" cx="60" cy="60" r="54" stroke-width="12" />
    <circle class="progress-ring-bar" cx="60" cy="60" r="54" stroke-width="12" />
  </svg>
  <div class="progress-ring-center"><strong>45%</strong></div>
</div>
```

```js
import { circumference, dashOffset, clampProgress } from './ringGeometry.js'

const ring = document.querySelector('.progress-ring')
const radius = 54 // size/2 − stroke/2
ring.style.setProperty('--ring-circumference', `${circumference({ radius })}px`)

const update = (value) => {
  const { progress, over } = clampProgress({ value, max: 100 })
  ring.style.setProperty('--ring-offset', `${dashOffset({ radius, progress })}px`)
  ring.setAttribute('aria-valuenow', value)
  ring.toggleAttribute('data-over', over) // 초과 시 번짐 표시
}
update(45)
// 무한 로딩: ring.dataset.indeterminate = 'true' + aria-valuenow 제거
```

다중 링은 `ringRadii({ size, stroke, gap, count })`로 반지름 배열을 받아 원 쌍을 count개 그린다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 속도 | `--ring-duration` (기본 600ms — 목표 달성 연출은 600~900ms, 실시간 갱신 지표는 300ms 안쪽) |
| 진행 색 | `--ring-color` 또는 `color` prop (다중 링은 `rings[].color`) |
| 트랙 색 | `--ring-track` 또는 `trackColor` prop (기본 반투명 회색 — 배경이 어둡든 밝든 살짝 보인다) |
| 두께·크기 | `stroke`·`size` prop — 반지름은 `size/2 − stroke/2`로 자동 계산 |
| 링 간격 | `ActivityRings`의 `gap` (기본 4px) |
| 이징 | `progress-ring.css`의 `--_ease` — 기본 `cubic-bezier(0.22, 1, 0.36, 1)`(끝에서 감속해 "안착") |
| 시작 방향 | `.progress-ring-svg`의 `rotate(-90deg)` — 12시 시작. 반시계로 채우려면 `scaleX(-1)`을 추가 |

## 주의사항

- **100% 초과는 클램프한다.** 애플 활동 링은 초과분을 한 바퀴 더 그려 겹치지만, 여기서는 100%에서 멈추고 `data-over="true"`(은은한 번짐)로만 알린다 — 겹친 획은 "얼마나 넘었는지"가 보이지 않고, `stroke-dashoffset` 하나로는 두 바퀴째를 다른 색으로 그릴 수 없기 때문이다. 초과분을 꼭 그려야 하면 링을 하나 더 얹고(`ringRadii` 같은 반지름) 그 링에 `value − max`를 넘겨라.
- **`--ring-circumference`·`--ring-offset`은 px 단위로 넣는다** — 단위 없는 숫자는 브라우저에 따라 transition 보간이 안 된다. React 래퍼는 내장 처리.
- **첫 마운트는 0에서 채워진다.** 진입 연출이 필요 없으면(예: 페이지 복귀) 마운트 직후 한 프레임만 `--ring-duration: 0ms`를 주고 풀어라.
- **다중 링은 `label`을 서로 다르게** — 링마다 개별 `progressbar`이므로 같은 이름이면 스크린 리더가 구분하지 못한다.
- `aria-valuenow`에는 클램프 전 실제 값이 들어간다. 보조기기는 max를 넘는 값을 max로 읽으니, 초과를 말로 알리려면 `label`에 넣어라("판매 그릇 수, 목표 초과").
- **reduced-motion 대응 내장** — 채워지는 이동은 즉시 반영하고, 무한 로딩은 회전 대신 느린 opacity 맥동으로 "진행 중" 신호만 남긴다. 블록 제거 금지.
- `stroke-linecap: round`는 획 두께의 절반만큼 양끝을 늘린다 — 진행률 1~2%에서도 점이 보이는 것은 정상이다. 정확히 0에서 아무것도 안 보여야 하면 `butt`로 바꿔라.
