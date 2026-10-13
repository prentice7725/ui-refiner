---
name: scroll-reveal
description: 스크롤로 뷰포트에 들어올 때 요소가 차례로 나타나는 스크롤 등장 애니메이션(scroll reveal, fade in on scroll)을 구현한다. "스크롤 내리면 섹션이 차례로 나타나게, 스크롤하면 나타나는 효과, 화면에 들어올 때 떠오르며 등장, 순서대로 등장" 요청과 랜딩 페이지·긴 콘텐츠에 쓴다. 기존 적용분의 등장 간격·타이밍·순서 수정에도 쓴다.
---

# scroll-reveal — 스크롤 리빌

라이브 데모: https://guksu.github.io/suta/#/scroll-reveal

## 언제 쓰는가

랜딩 페이지·소개 섹션처럼 스크롤을 내리며 콘텐츠가 순차적으로 드러나야 할 때. 섹션·카드·리스트가 뷰포트에 들어오는 순간 페이드+슬라이드로 공개된다.

**기술 선택:** IntersectionObserver + CSS transition. scroll 이벤트 리스너는 스크롤마다 메인 스레드를 깨워 성능을 깎지만, IntersectionObserver는 브라우저가 교차 판정을 대신 해줘 비용이 없다. 라이브러리 불필요. 2층 구조다:

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/revealOnScroll.ts` | 코어 — DOM API로 `data-revealed` 구동 | 모든 프로젝트 |
| `assets/scroll-reveal.css` | 애니메이션 정의 | 모든 프로젝트 |
| `assets/useScrollReveal.ts` + `assets/ScrollReveal.tsx` | React 래퍼 (코어 사용) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

1. 위 표의 파일들을 복사한다(전체 구현이 이 파일들 — 반드시 읽어라).
2. 공개할 블록을 `<ScrollReveal>`로 감싼다. 래퍼 div에 `data-revealed`가 걸리고 CSS가 반응한다.
3. 연쇄(stagger) 공개는 항목마다 `delayMs`를 증가시켜 준다.
4. 래퍼 div가 레이아웃을 깨는 경우(테이블·플렉스 자식 등)는 컴포넌트 대신 `useScrollReveal` 훅을 직접 써서 기존 요소에 ref와 data 속성을 단다.

```tsx
import { ScrollReveal } from './ScrollReveal'
import './scroll-reveal.css'

const Features = ({ items }: { items: string[] }) => (
  <section>
    {items.map((text, i) => (
      <ScrollReveal key={text} delayMs={i * 80}>
        <article className="card">{text}</article>
      </ScrollReveal>
    ))}
  </section>
)
```

## 사용 방법 — 순수 JS (React 없음)

코어(`revealOnScroll`)와 CSS만 복사한다. 공개할 요소에 `reveal` 클래스를 붙이고 코어에 등록하면 끝이다. 연쇄 공개는 인라인 CSS 변수로 준다.

```js
import { revealOnScroll } from './revealOnScroll.js'

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.setProperty('--reveal-delay', `${(i % 3) * 80}ms`)
  revealOnScroll({ element: el })
})
// SPA에서 요소를 제거할 때는 반환된 cleanup()을 호출해 옵저버를 해제한다
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 지속 시간·이동 거리 | CSS 변수 `--reveal-duration`·`--reveal-distance` |
| 공개 시점 | `threshold`(요소의 몇 %가 보일 때, 기본 0.15), `rootMargin`(경계 보정 — 미리 공개하려면 `'0px 0px -10% 0px'`) |
| 반복 여부 | `once`(기본 true — 한 번 공개 후 유지). false면 벗어날 때 다시 감춤 |
| 연쇄 간격 | `delayMs` — 항목 인덱스 × 30~80ms가 무난(초과하면 굼뜨게 느껴진다) |

## 주의사항

- **reduced-motion 대응 내장** — 이동을 끄고 페이드만 최소 시간으로 남긴다. 블록 제거 금지.
- IntersectionObserver가 없는 환경에서는 감추지 않고 즉시 공개한다(콘텐츠 실종 방지 폴백) — SSR 첫 페인트도 같은 원리로, 초기 화면 위 콘텐츠에는 쓰지 않는 게 좋다(첫 페인트에 감춰진 채 시작하면 LCP를 해친다).
- `once={false}`는 스크롤을 오르내릴 때마다 재생된다 — 본문 콘텐츠에는 산만하므로 장식 요소에만.
