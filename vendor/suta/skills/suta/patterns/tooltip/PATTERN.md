---
name: tooltip
description: 호버·포커스 시 잠시 뒤 떠오르는 툴팁(tooltip) 말풍선을 구현한다 — 페이드+슬라이드 등장, 4방향 배치, Esc 닫기. "툴팁 컴포넌트, 말풍선 설명, 마우스 올리면 설명, 아이콘에 갖다 대면 도움말, 물음표 도움말 아이콘" 요청과 버튼·아이콘·용어에 짧은 보조 설명을 붙일 때 쓴다. 기존 적용분의 위치·지연 시간·색 수정에도 쓴다.
---

# tooltip — 툴팁 말풍선

라이브 데모: https://guksu.github.io/suta/#/tooltip

## 언제 쓰는가

아이콘 버튼의 이름, 용어의 짧은 풀이, 축약된 정보의 원문처럼 **없어도 동작하지만 있으면 이해가 빨라지는** 한 줄 보조 설명. 호버하면 잠깐 뒤에 떠오르고, 벗어나면 즉시 사라진다. 필수 정보(에러 메시지·필수 입력 안내)는 툴팁에 넣지 않는다 — 터치 기기에서는 호버가 없어 아예 못 보는 사용자가 생긴다.

**기술 선택:** 이벤트 와이어링(JS 소량) + CSS transition. 열림 지연은 JS 타이머가 담당한다 — CSS `transition-delay`로도 흉내낼 수 있지만 "지연 중 이탈하면 취소" 판정과 포커스 즉시 열림을 함께 다루려면 타이머가 명확하다. 배치는 앵커 기준 절대 배치(CSS만)로, 위치 계산 JS가 없다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createTooltipTrigger.ts` | 코어 — 호버 지연·포커스 즉시·Esc 닫기 판정 | 모든 프로젝트 |
| `assets/tooltip.css` | 말풍선·화살표·4방향 배치·등장 모션 | 모든 프로젝트 |
| `assets/Tooltip.tsx` | React 래퍼 (aria-describedby 연결 포함) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { Tooltip } from './Tooltip'
import { Icon } from './Icon' // layout-principles의 선 아이콘 한 벌

const Toolbar = () => (
  <Tooltip label="장바구니에 담기" place="bottom">
    <button type="button" aria-label="담기"><Icon name="cart" /></button>
  </Tooltip>
)
```

- `children`은 포커스 가능한 단일 요소(버튼·링크)여야 한다 — 키보드 사용자도 포커스로 툴팁을 볼 수 있다.
- `place`: `top`(기본)·`bottom`·`left`·`right`. `showDelayMs`로 호버 지연 조절(기본 400ms).

## 사용 방법 — 순수 JS (React 없음)

```html
<span class="tooltip-anchor">
  <button type="button" aria-label="담기" aria-describedby="tip-cart"><!-- layout-principles icons.ts의 iconSvg({ name: 'cart' }) --></button>
  <span class="tooltip" id="tip-cart" role="tooltip" data-place="top">장바구니에 담기</span>
</span>
```

```js
import { createTooltipTrigger } from './createTooltipTrigger.js'

const anchor = document.querySelector('.tooltip-anchor')
const tooltip = anchor.querySelector('.tooltip')
const cleanup = createTooltipTrigger({ anchor, tooltip }) // 해제 시 cleanup() 호출
```

앵커는 래퍼 요소여도 된다 — 코어가 `focusin`/`focusout`(버블링되는 포커스 이벤트)을 쓰므로 안의 버튼 포커스도 잡는다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 배경·글자색 | `--tooltip-bg`(기본 #2b3440)·`--tooltip-color`(#fff) |
| 앵커와의 간격 | `--tooltip-offset` (기본 10px — 화살표 높이 포함) |
| 등장 속도 | `--tooltip-duration` (기본 150ms — 툴팁은 빠르게 뜨고 빠르게 진다) |
| 호버 지연 | `createTooltipTrigger`/`Tooltip`의 `showDelayMs` (기본 400ms) |

## 주의사항

- **호버는 지연, 포커스는 즉시** — 지연은 커서가 스쳐 지나갈 때 화면이 번쩍이는 것을 막기 위한 것이고, 키보드 포커스는 의도가 분명하므로 기다리게 할 이유가 없다. 코어에 내장된 규칙이니 바꾸지 말 것.
- **Escape 닫기는 WAI-ARIA 툴팁 패턴의 요구사항이다** — 제거하지 않는다.
- 말풍선은 `pointer-events: none` — 커서가 말풍선을 가로채 열림/닫힘이 깜빡이는 것을 막는다. 따라서 툴팁 안에 링크·버튼을 넣지 않는다(그건 popover/드롭다운 영역).
- `white-space: nowrap`이 기본이다 — 긴 문장을 넣으려면 `max-width`를 주고 nowrap을 풀되, 툴팁이 두 줄을 넘으면 툴팁이 아니라 다른 UI를 쓸 신호다.
- 앵커가 화면 가장자리에 있으면 뷰포트 밖으로 나갈 수 있다 — 이 패턴은 고정 배치(단순함 우선)이므로 가장자리 요소에는 `place`를 반대쪽으로 지정한다. 자동 플립이 필요한 밀도면 Floating UI 같은 위치 라이브러리 영역이다.
- **reduced-motion 대응 내장** — 슬라이드를 0으로 줄여 페이드만 남긴다. 블록 제거 금지.
