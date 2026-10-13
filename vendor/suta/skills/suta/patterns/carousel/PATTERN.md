---
name: carousel
description: 캐러셀(carousel) 컴포넌트 — 스와이프로 옆으로 넘기면 한 장씩 딱 걸리는 스냅 슬라이더, 아래 점(도트) 내비게이션, 자동 넘김(autoplay)을 구현한다. "캐러셀, 슬라이더, 배너 슬라이드, 배너 자동으로 넘어가게, 이미지 넘겨보기, 카드 슬라이더" 요청과 가로 스크롤 배너·카드 목록 UI에 쓴다. 기존 적용분의 폭·간격·스냅 위치·자동 넘김 간격 수정에도 쓴다.
---

# carousel — 스냅 캐러셀

라이브 데모: https://guksu.github.io/suta/#/carousel

## 언제 쓰는가

배너·추천 카드·이미지 묶음을 가로로 넘겨 볼 때. 스와이프하면 슬라이드 경계에 자석처럼 정렬(스냅)되는 관례다.

**기술 선택:** CSS `scroll-snap`이 스크롤·스냅·감속·터치 물리를 전부 브라우저 네이티브로 처리한다 — JS 슬라이더 라이브러리가 흉내 내는 것을 공짜로, 더 자연스럽게 얻는다. JS는 두 가지만 한다: 활성 슬라이드 추적(IntersectionObserver)과 도트 클릭 이동(scrollTo). scroll 이벤트 리스너 없음.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/carouselCore.ts` | 코어 — 활성 추적·이동 | 모든 프로젝트 |
| `assets/createCarouselAutoplay.ts` | 자동재생 확장(선택 — 정지 조건 내장) | 자동재생 쓸 때만 |
| `assets/carousel.css` | 트랙·스냅·도트 정의 | 모든 프로젝트 |
| `assets/useCarousel.ts` | React 훅 (autoplayMs 옵션 포함) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다.

## 사용 방법 — React

```tsx
import { useCarousel } from './useCarousel'

const Banner = ({ items }: { items: string[] }) => {
  const { trackRef, activeIndex, goTo } = useCarousel()

  return (
    <div>
      <div ref={trackRef} className="carousel-track">
        {items.map((item) => (
          <div key={item} className="carousel-slide">
            {item}
          </div>
        ))}
      </div>
      <div className="carousel-dots" role="tablist" aria-label="슬라이드 선택">
        {items.map((item, index) => (
          <button
            key={item}
            type="button"
            className="carousel-dot"
            data-active={index === activeIndex ? 'true' : 'false'}
            aria-label={`${index + 1}번째 슬라이드`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { observeActiveSlide, scrollToSlide } from './carouselCore.js'

const track = document.querySelector('.carousel-track')
const dots = [...document.querySelectorAll('.carousel-dot')]

observeActiveSlide({
  track,
  onChange: (index) => dots.forEach((dot, i) => (dot.dataset.active = String(i === index))),
})
dots.forEach((dot, index) => dot.addEventListener('click', () => scrollToSlide({ track, index })))
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 슬라이드 폭 | `--slide-width` (기본 80% — 다음 슬라이드가 살짝 보여 "더 있다"는 힌트가 된다) |
| 간격 | `--carousel-gap` (기본 12px) |
| 스냅 위치 | `.carousel-slide`의 `scroll-snap-align` — center(기본)/start |
| 풀폭 배너 | `--slide-width: 100%` + `scroll-snap-align: start` |

## 주의사항

- **자동재생은 접근성 조건과 한 몸이다** — `createCarouselAutoplay`(React는 `useCarousel({ autoplayMs })`)는 호버·키보드 포커스 시 정지, reduced-motion 시 미재생을 내장한다. 단 **일시정지 버튼은 호출부 책임**이다 — `toggleAutoplay`/`autoplayOn`으로 반드시 노출하라(WCAG 2.2.2).
- **reduced-motion 대응 내장** — 도트 클릭 이동이 부드러운 스크롤 대신 즉시 점프한다(코어의 matchMedia 판정). 스와이프 자체는 사용자가 만든 모션이라 제한하지 않는다.
- **트랙에 CSS `scroll-behavior: smooth`를 걸지 마라** — 크롬에서 프로그램적 scrollTo가 무시되는 문제가 있다. 부드러운 이동은 코어가 scrollTo 옵션으로 처리한다.
- `.carousel-track`의 `position: relative`는 슬라이드 offsetLeft의 좌표 기준이다 — 제거하면 도트 이동이 엉뚱한 위치로 간다.
- 활성 판정은 "트랙 안에서 60% 이상 보임"이다 — 슬라이드 폭이 트랙보다 크면(100% 초과) 판정이 흔들릴 수 있다.
- 슬라이드 안에 세로 스크롤 콘텐츠를 넣지 마라 — 가로 스냅과 세로 스크롤 제스처가 경합한다.
