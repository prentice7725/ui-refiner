---
name: sticky-header
description: 스크롤하면 큰 제목이 밀려 나가고 상단 고정 헤더에 작은 컴팩트 제목이 나타나는 스티키 헤더(sticky header)를 구현한다. "스크롤하면 헤더 축소, 헤더 작아지게, 접히는/줄어드는 헤더, 내리면 큰 제목 사라지고 상단 바에 작은 제목, 고정 타이틀 전환" 요청과 상세 페이지·목록 상단에 쓴다. 기존 적용분의 축소 속도·배경 수정에도 쓴다.
---

# sticky-header — 스티키 헤더 전환

라이브 데모: https://guksu.github.io/suta/#/sticky-header

## 언제 쓰는가

상세 페이지 상단에 큰 제목을 크게 보여주다가, 스크롤을 내리면 상단 고정 바에 작은 제목이 나타나는 패턴 — 모바일 앱 상세 화면의 관례다.

**기술 선택:** 헤더 높이를 줄이는 방식은 쓰지 않는다 — 높이 애니메이션은 매 프레임 레이아웃을 돌린다. 대신 **큰 제목을 페이지 콘텐츠로 두고**(스크롤에 자연히 밀려 나감), 그 이탈을 IntersectionObserver로 감지해 고정 높이 헤더의 컴팩트 제목을 페이드 인한다. 움직이는 속성은 opacity·transform뿐이고 scroll 이벤트 리스너도 없다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/observeHeaderCollapse.ts` | 코어 — 센티널 이탈 감지 → data-collapsed | 모든 프로젝트 |
| `assets/sticky-header.css` | 헤더·제목 전환 정의 | 모든 프로젝트 |
| `assets/useStickyHeader.ts` | React 훅 | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다.

## 사용 방법 — React

```tsx
import { useStickyHeader } from './useStickyHeader'

const DetailPage = () => {
  const { headerRef, sentinelRef } = useStickyHeader()

  return (
    <>
      <header ref={headerRef} className="sticky-header">
        <span className="sticky-header-title">성수동 손칼국수</span>
      </header>
      <h1 ref={sentinelRef}>성수동 손칼국수</h1>
      <main>…본문…</main>
    </>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { observeHeaderCollapse } from './observeHeaderCollapse.js'

observeHeaderCollapse({
  header: document.querySelector('.sticky-header'),
  sentinel: document.querySelector('h1'),
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 전환 속도 | `--header-duration` (기본 250ms) |
| 헤더 배경 | `--header-bg` (기본 반투명 + blur — 배경 위로 콘텐츠가 비친다) |
| 전환 시점 | 센티널을 큰 제목이 아닌 다른 요소(히어로 이미지 등)로 지정 |

## 주의사항

- **헤더는 고정 높이다** — 높이가 변하는 축소 헤더가 필요하면 이 패턴 범위 밖(레이아웃 애니메이션 트레이드오프를 별도 검토).
- 센티널과 헤더가 같은 스크롤 컨테이너에 있어야 한다. 커스텀 스크롤 영역이면 코어에 `root` 옵션을 추가해 확장하라.
- **reduced-motion 대응 내장** — 이동을 끄고 페이드만 남긴다. 블록 제거 금지.
- 컴팩트 제목은 `aria-hidden`을 달지 마라 — 접힌 상태에서 그것이 유일한 제목 표시다.
