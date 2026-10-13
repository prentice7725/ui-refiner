---
name: spring-physics
description: 스프링 물리 모션 유틸(spring physics)을 구현한다 — duration·easing 대신 stiffness·damping(감쇠)·mass로 정의하고, 드래그를 놓는 순간의 속도를 이어받아 튕기며 정착하며, 도중에 목표가 바뀌어도 현재 위치·속도에서 다시 출발한다. "스프링 애니메이션, 탄성 복귀, 튕기는 모션, 드래그 놓으면 제자리로, 속도 이어받기, 물리 기반 애니메이션" 요청과 제스처 뒤 복귀·팝 모션에 쓴다. 기존 적용분의 강성·감쇠(출렁임) 조절에도 쓴다.
---

# spring-physics — 스프링 물리 모션

라이브 데모: https://guksu.github.io/suta/#/spring-physics

## 언제 쓰는가

드래그하다 놓은 카드가 제자리로 돌아갈 때, 바텀시트가 스냅 위치로 정착할 때, 좋아요 하트가 팝할 때. 이런 모션에 `transition: 300ms ease-out`을 쓰면 두 가지가 안 된다 — (1) **놓는 순간의 손가락 속도를 이어받지 못한다**(빠르게 던져도 느리게 던져도 같은 300ms), (2) **도중에 목표가 바뀌면 뚝 끊긴다**(연타·재드래그). 스프링은 "얼마나 걸리게"가 아니라 "얼마나 단단하고 얼마나 감쇠하게"를 정하므로 둘 다 자연스럽다. iOS 전반·Linear·Vercel의 모션 성격이 이것이다.

**기술 선택:** 감쇠 조화진동의 **닫힌 해**(`spring.ts`) — 시간 t를 넣으면 위치가 바로 나오므로 프레임 누적 오차가 없고, 어느 순간에든 속도를 알 수 있어 재타게팅이 정확하다. 재생은 두 경로: **rAF 애니메이터**(`animateSpring.ts` — 인터럽트·속도 이어받기)와 **CSS `linear()` 생성기**(`springToLinear` — 곡선을 사전 샘플링해 transition/animation에 얹음, 메인 스레드 부담 0, 대신 인터럽트 불가). 라이브러리 없음.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/spring.ts` | 닫힌 해·정착 판정·duration 추정·`linear()` 생성 (프레임워크 무관) | 모든 프로젝트 |
| `assets/animateSpring.ts` | rAF 애니메이터 — retarget·stop·current | 모든 프로젝트 |
| `assets/useSpring.ts` | React 훅 (값을 state로 올리지 않고 onUpdate로 DOM에 직접) | React 프로젝트만 |

`spring.ts`·`animateSpring.ts`는 다른 패턴(swipe-dismiss-viewer 등)의 assets에 **같은 파일이 복사되어** 들어간다 — 설치 시 패턴 단독 완결 원칙 때문이다. 파일 첫 줄의 `@shared-core` 헤더를 지우지 말 것(저장소 검증이 원본과 해시를 비교한다). TS가 아닌 프로젝트는 타입을 벗겨 .js로 저장한다.

## 사용 방법 — React (드래그 놓으면 제자리로)

```tsx
import { useRef } from 'react'
import { useSpring } from './useSpring'

const Card = () => {
  const el = useRef<HTMLDivElement>(null)
  const x = useSpring({ onUpdate: (v) => { el.current!.style.transform = `translateX(${v}px)` } })
  let lastX = 0, lastT = 0, velocity = 0

  return (
    <div
      ref={el}
      onPointerDown={(e) => { lastX = e.clientX; lastT = e.timeStamp; e.currentTarget.setPointerCapture(e.pointerId) }}
      onPointerMove={(e) => {
        if (!e.buttons) return
        velocity = ((e.clientX - lastX) / Math.max(1, e.timeStamp - lastT)) * 1000 // px/s
        lastX = e.clientX; lastT = e.timeStamp
        x.set(x.get() + e.movementX) // 손가락에 붙는 동안은 스프링을 멈추고 값만 기록
      }}
      onPointerUp={() => x.to(0, velocity)} // 놓는 순간 속도를 이어받아 0으로 정착
    >
      끌어 보세요
    </div>
  )
}
```

- `to(target, velocity)` — 목표로 출발. velocity를 생략하면 진행 중인 스프링의 현재 속도를 이어받는다(연타 안전).
- `set(value)` — 제스처가 값을 직접 쓸 때. 애니메이션을 멈추고 값만 기록한다.

## 사용 방법 — CSS transition에 스프링 곡선 얹기 (React 없음)

인터럽트가 필요 없는 단발 모션(팝·등장)은 rAF 대신 CSS로 재생한다.

```js
import { springToLinear } from './spring.js'

const { easing, duration } = springToLinear({ config: { stiffness: 300, damping: 20 } })
el.style.transition = `transform ${duration}ms ${easing}`
el.style.transform = 'scale(1)' // 이전 값이 scale(0.8)이면 스프링 곡선으로 커진다
```

`linear()` easing은 Safari 17.2+·Chrome 113+·Firefox 112+. 그 이하는 rAF 경로를 쓴다.

## 커스터마이즈 포인트 — 어떤 스프링이 어떤 느낌인가

| 느낌 | stiffness | damping | 용도 |
|---|---|---|---|
| 크리스프(기본) | 170 | 26 | 제자리 복귀, 스냅 — 살짝 넘쳤다 돌아옴 |
| 통통 | 300 | 15 | 좋아요 팝, 버튼 눌림 해제 |
| 묵직 | 120 | 30 | 시트·카드처럼 큰 요소 |
| 튀지 않음(임계) | k | 2·√k | 튐이 어색한 곳(텍스트·레이아웃). `dampingRatio` = 1 |

- `mass`는 보통 1로 두고 stiffness·damping만 만진다.
- `restDelta`·`restVelocity`는 정착 판정 — px 단위면 기본값(0.1px·1px/s)이 눈에 안 띄고, 0~1 진행도라면 0.001·0.01로 낮춘다.

## 주의사항

- **값은 React state로 올리지 않는다** — 매 프레임 렌더가 되어 손가락에 늦게 붙는다. `onUpdate`에서 ref로 잡은 요소의 `transform`에 직접 쓴다.
- 속도 단위는 **단위/초**다. 포인터 이벤트에서 px/ms로 계산했다면 ×1000.
- `springToLinear`는 사전 샘플링이라 **도중 재타게팅을 못 한다** — 제스처가 끼어드는 모션은 `animateSpring` 경로. 시작 속도가 큰 곡선은 `samples`를 60 이상으로 올린다(초반 급변 구간이 뭉개진다).
- 감쇠비(`dampingRatio`)가 0.3 아래면 여러 번 튄다 — UI에서는 0.6~1.0 범위가 안전하다.
- **reduced-motion 대응은 호출부 책임** — `matchMedia('(prefers-reduced-motion: reduce)')`가 참이면 `to()` 대신 즉시 `set(target)`으로 점프시킨다. 데모가 그 예시다.
