---
name: skeleton
description: 로딩 중 콘텐츠 자리를 잡아주는 스켈레톤 UI(skeleton loader)와 시머(반짝임) 애니메이션을 구현한다. "스켈레톤, 로딩 뼈대, 플레이스홀더, 시머 효과, 회색 박스가 반짝거리는 로딩, 데이터 불러오는 동안 자리 표시" 요청과 fetch 대기 UI에 쓴다. 기존 적용분의 반짝임 속도·색·형태 수정에도 쓴다.
---

# skeleton — 스켈레톤 시머

라이브 데모: https://guksu.github.io/suta/#/skeleton

## 언제 쓰는가

데이터를 기다리는 동안 실제 콘텐츠와 같은 자리·크기의 뼈대를 보여줄 때. 스피너와 달리 "무엇이 어디에 나타날지"를 미리 보여줘 체감 대기 시간을 줄이고, 로드 완료 시 레이아웃 이동(CLS)이 없다. 토스·당근·배민·인스타그램 전부 목록/카드 로딩에 쓴다.

**기술 선택:** 순수 CSS. 시머는 `::after` 오버레이의 `translateX`만 움직여 GPU 합성으로 처리된다(`background-position` 애니메이션은 페인트를 유발하므로 쓰지 않는다). JS 로직이 없어 코어 파일도 없다 — CSS가 곧 정본이다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/skeleton.css` | 전부 — 시머·형태 변형·reduced-motion | 모든 프로젝트 |
| `assets/Skeleton.tsx` | React 편의 래퍼(로직 없음) | React 프로젝트만(선택) |

## 사용 방법

1. `assets/skeleton.css`를 복사한다(반드시 읽어라 — 전체 구현이 이 파일이다).
2. 로딩 중일 때 실제 콘텐츠와 **같은 크기**의 요소에 `skeleton` + 형태 클래스를 붙인다:
   - `skeleton-text` — 글줄 (연속으로 두면 마지막 줄이 자동으로 짧아진다)
   - `skeleton-circle` — 아바타 (aspect-ratio 1)
   - (기본) — 사각형 썸네일·카드
3. 스켈레톤 묶음의 컨테이너에 `aria-busy="true"`를 달고, 로드 완료 시 실제 콘텐츠로 교체한다.

```html
<!-- 순수 HTML/JS -->
<article aria-busy="true">
  <div class="skeleton skeleton-circle" style="width: 48px"></div>
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text"></div>
</article>
```

```tsx
// React — 편의 래퍼 사용
import { Skeleton } from './Skeleton'

const ProfileCard = ({ user }: { user?: User }) =>
  user ? (
    <article>…</article>
  ) : (
    <article aria-busy="true">
      <Skeleton variant="circle" width={48} />
      <Skeleton variant="text" lines={2} />
    </article>
  )
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 바탕색·반짝임 색 | `--skeleton-base`·`--skeleton-sheen` (라이트 테마면 밝은 회색 계열로) |
| 시머 속도 | `--skeleton-speed` (기본 1.4s — 1~2s 밖은 산만하거나 멈춰 보인다) |
| 모서리 | `border-radius` 덮어쓰기 — 실제 콘텐츠와 맞춘다 |

## 주의사항

- **크기를 실제 콘텐츠와 맞춰라** — 스켈레톤의 목적은 레이아웃 예고다. 크기가 다르면 교체 순간 CLS가 생겨 목적을 잃는다.
- **reduced-motion 대응 내장** — 시머(이동)를 끄고 느린 불투명도 맥동으로 완화한다. 블록 제거 금지.
- 200ms 안에 끝나는 로딩에는 스켈레톤을 띄우지 마라 — 깜빡이고 사라지는 뼈대는 오히려 산만하다(지연 후 표시하거나 아예 생략).
- 시머는 장식이다 — 스켈레톤 개수가 많은 화면(수십 개)에서는 `--skeleton-speed`를 늦추거나 시머 없이 정적 뼈대만 써도 된다.
