---
name: motion-principles
description: 앱 전체의 애니메이션 시간·이징·스태거·reduced-motion 기준을 한 벌의 토큰(motion tokens)으로 정하고, 어떤 움직임에 어느 값을 쓰는지 고르는 원칙을 제공한다. "애니메이션 속도 기준 잡아줘, 이징 뭐 써야 해, 모션 가이드라인, 전환 시간 통일, 애니메이션이 제각각이야" 요청과 새 프로젝트에 모션 기준을 세우거나 suta 패턴들의 --{skill}-duration 값을 맞출 때 쓴다.
---

# motion-principles — 모션 원칙과 토큰

라이브 데모: https://guksu.github.io/suta/#/motion-principles

## 언제 쓰는가

애니메이션이 화면마다 제각각일 때, 또는 새 프로젝트에서 "얼마나 빠르게, 어떤 곡선으로" 움직일지 기준을 세울 때. suta의 다른 패턴들은 각자 `--{skill}-duration` 같은 공개 변수를 두는데, 이 패턴의 토큰을 그 변수에 넘기면 앱 전체가 한 손으로 만든 것처럼 읽힌다.

iOS·Material 모두 같은 원칙을 쓴다: 작은 것은 짧게, 큰 것은 길게, 들어올 때는 감속(ease-out), 나갈 때는 더 짧게, 목록은 차례로. 반박도 있다 — 브랜드 개성을 위해 일부러 느리거나 튀는 모션을 쓰는 제품도 있다. 그 경우에도 "기본값을 정해 두고 의도적으로 벗어나는" 쪽이 "처음부터 제각각"보다 낫다. 이 패턴은 기본값이다.

**기술 선택:** CSS 변수(`:root`)와 같은 값의 TS 상수 두 벌. 값이 곧 문서이고, 다른 패턴들의 CSS가 이미 `var(--x-duration, 기본값)` 폴백 패턴이라 토큰을 얹기만 하면 된다. 라이브러리가 아니므로 의존성 0.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/motion-tokens.css` | 토큰 정본 — 시간 5단계·이징 5종·스태거·reduced-motion | 모든 프로젝트 |
| `assets/motionTokens.ts` | 같은 값의 TS 상수 + `durationFor`·`exitDuration`·`staggerDelay`·`cubicBezier` | JS 애니메이션(rAF·스프링)을 쓰는 프로젝트 |
| `references/decision-table.md` | 움직임 종류 → 시간·이징·담당 패턴 대응표 | 필요할 때 |

## 사용 방법

1. `assets/motion-tokens.css`를 복사해 전역 CSS 맨 앞에서 불러온다(반드시 읽어라 — 값마다 이유가 적혀 있다).
2. 패턴들의 공개 변수를 토큰에 연결한다. 한 곳(`:root`)에서:

```css
@import './motion-tokens.css';

:root {
  --sheet-duration: var(--motion-duration-slow);
  --modal-duration: var(--motion-duration-slow);
  --toast-duration: var(--motion-duration-base);
  --tooltip-duration: var(--motion-duration-fast);
  --tab-indicator-duration: var(--motion-duration-base);
  --page-transition-duration: var(--motion-duration-page);
  --fx-duration: var(--motion-duration-base);
  --fx-ease: var(--motion-ease-out);
}
```

3. 직접 쓰는 CSS에서도 숫자 대신 토큰을 쓴다:

```css
.card {
  transition:
    transform var(--motion-duration-base) var(--motion-ease-out),
    opacity var(--motion-duration-base) var(--motion-ease-out);
}
.card[data-state='exiting'] {
  transition-duration: calc(var(--motion-duration-base) * var(--motion-exit-ratio));
}
.list-item {
  transition-delay: calc(var(--i) * var(--motion-stagger));
}
```

```ts
// JS 애니메이션(rAF·스프링)에서 같은 값을 쓸 때
import { DURATION, EASE, SPRING, durationFor, exitDuration, staggerDelay } from './motionTokens'

const ms = durationFor({ distancePx: 320 }) // 350 — 멀리 갈수록 길게
const out = exitDuration(ms) // 265
el.style.transition = `transform ${ms}ms ${EASE.out}`
items.forEach((item, i) => (item.style.transitionDelay = `${staggerDelay({ index: i })}ms`))
```

## 원칙 — 어느 값을 고르는가

| 무엇이 움직이는가 | 시간 | 이징 | 예 |
|---|---|---|---|
| 색·불투명도 상태 변화 | `instant` 100ms | `ease-out` | hover, pressed, 포커스 링 |
| 작은 요소 등장·퇴장 | `fast` 150ms | `ease-out` | 툴팁, 토글 손잡이, 체크 표시 |
| 컴포넌트 전환 | `base` 250ms | `ease-out` | 탭 인디케이터, 아코디언, 드롭다운, 토스트 |
| 화면 크기의 이동 | `slow` 350ms | `drawer` | 바텀시트, 모달, 사이드 패널 |
| 화면 전환·공유 요소 확장 | `page` 420ms | `drawer` | 페이지 전환, 카드 확장 |
| 한 자리에서 다른 자리로 | 거리 기준 | `in-out` | 리스트 재배치, 캐러셀 스냅 |
| 살짝 넘쳤다 돌아옴 | `fast`~`base` | `overshoot` | 좋아요 팝, 체크 팝 |
| 시간에 비례해야 하는 것 | 내용 길이 | `linear` | 진행률, 스피너, 스토리 진행 |

규칙 다섯 가지:

1. **퇴장은 진입의 3/4.** 사용자는 결과를 이미 안다. 퇴장에 ease-in을 쓰지 마라 — 첫 순간이 늦어 굼뜨게 느껴진다. 퇴장도 ease-out.
2. **짝지어진 요소는 같은 시간·이징.** 백드롭과 시트, 아이콘과 라벨이 따로 움직이면 두 개로 읽힌다.
3. **목록은 30ms 간격으로 차례로, 10개까지만.** 20개를 30ms씩 벌리면 마지막이 600ms 뒤에 나온다.
4. **움직이는 속성은 `transform`·`opacity`뿐.** `width`·`height`·`top`·`left`·`margin`은 매 프레임 레이아웃을 돌린다. 높이가 변하는 것은 accordion 패턴의 `grid-template-rows` 기법, 위치가 변하는 것은 flip-list 패턴의 FLIP 기법을 쓴다.
5. **하루에 100번 보는 것은 움직이지 않는다.** 키 입력 반응, 목록 스크롤 중 항목 등장은 즉시. 모션은 "무슨 일이 일어났는지"를 알려줄 때만 가치가 있다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 전체 속도감 | 다섯 시간 값을 같은 비율로(예: 모두 ×0.8) — 하나만 바꾸면 크기 순서가 깨진다 |
| 브랜드 이징 | `--motion-ease-out`만 바꾼다. drawer·overshoot는 기능(감속 길이·넘침)이라 유지 |
| 스태거 간격 | `--motion-stagger` 20~50ms. 그 밖은 산만하거나 느리다 |
| reduced-motion 시간 | 하단 미디어 쿼리 블록 — 1ms/80ms/120ms. 0ms로 두지 마라(transitionend 유실) |

## 주의사항

- **토큰은 패턴의 reduced-motion을 대신하지 않는다.** 각 패턴의 CSS가 이동·확대를 끄는 블록을 갖고 있고, 이 토큰은 남은 페이드의 시간만 줄인다. 패턴의 블록을 지우지 마라.
- **스프링과 duration을 섞지 마라.** 제스처 뒤 복귀(spring-physics·edge-swipe-back·swipe-dismiss-viewer)는 놓는 순간의 속도를 이어받아야 해서 스프링을 쓴다. 그 옆의 백드롭 페이드는 `--motion-duration-slow`로 두면 서로 어긋난다 — 스프링의 예상 정착 시간(`springDuration`)을 페이드 길이로 쓴다.
- `cubicBezier()`는 데모·테스트용 계산기다. 런타임 애니메이션은 CSS가 직접 곡선을 계산하므로 이 함수를 매 프레임 호출하지 마라.
- 화면 크기가 큰 데스크톱에서는 이동 거리가 길어져 같은 250ms가 빨라 보인다. `durationFor({ distancePx })`로 거리 기준을 쓰거나 `--motion-duration-slow`를 400ms로 올린다.
