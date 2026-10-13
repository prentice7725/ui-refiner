---
name: pull-to-refresh
description: 목록·피드를 맨 위에서 아래로 당기면 새로고침하는 pull to refresh 제스처(당김 저항·스피너·복귀)를 구현한다. "당겨서 새로고침, 위에서 당기면 새로고침, 끌어내리면 다시 불러오기, 피드 당김 갱신, 끌어내려 리로드" 요청에 쓴다. 기존 적용분의 당김 임계값·저항 수정에도 쓴다.
---

# pull-to-refresh — 당겨서 새로고침

라이브 데모: https://guksu.github.io/suta/#/pull-to-refresh

## 언제 쓰는가

피드·목록 화면에서 최상단을 아래로 당겨 콘텐츠를 갱신하는 모바일 관례. 당길수록 무거워지는 고무줄 저항과, 임계를 넘겼을 때의 스피너가 "놓으면 새로고침된다"를 몸으로 알려준다.

**기술 선택:** 포인터 이벤트 + CSS transition, 라이브러리 없음. 코어는 당김 추적·저항 계산(지수 감쇠)·임계 판정만 하고, 진행률을 `--pull-progress`(0~1)와 `data-refreshing`으로 노출한다 — 인디케이터가 어떻게 생겼는지는 전적으로 CSS 몫이라 스피너를 마음대로 갈아 끼울 수 있다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createPullToRefresh.ts` | 코어 — 당김 추적·저항·판정 | 모든 프로젝트 |
| `assets/pull-to-refresh.css` | 인디케이터·복귀 이동 정의 | 모든 프로젝트 |
| `assets/PullToRefresh.tsx` | React 래퍼 (Promise 연동) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다.

## 사용 방법 — React

```tsx
import { PullToRefresh } from './PullToRefresh'

const Feed = ({ reload }: { reload: () => Promise<void> }) => (
  <PullToRefresh onRefresh={reload} className="feed-scroll">
    <ul>…피드 항목…</ul>
  </PullToRefresh>
)
```

`onRefresh`가 반환한 Promise가 끝나면 인디케이터가 복귀한다.

## 사용 방법 — 순수 JS (React 없음)

마크업 구조(컨테이너 > 인디케이터 + 콘텐츠)를 만들고 코어를 붙인다:

```js
import { createPullToRefresh } from './createPullToRefresh.js'

createPullToRefresh({
  container: document.querySelector('.ptr-container'),
  content: document.querySelector('.ptr-content'),
  onRefresh: async (done) => {
    await reloadFeed()
    done() // 반드시 호출 — 잊으면 스피너가 영원히 돈다
  },
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 판정 거리 | `thresholdPx` (기본 70px) |
| 최대 당김 | `maxPx` (기본 threshold×2 — 고무줄이 점근하는 한계) |
| 인디케이터 모양 | `.ptr-indicator` 내용물 교체 — 진행률은 `--pull-progress`로 온다 |
| 복귀 속도 | `--ptr-duration` (기본 300ms) |
| 영역 이름 | `label` — 주면 스크롤 상자가 이름 있는 영역(region)이 된다. 상자는 늘 키보드 초점을 받는다(`tabIndex=0`) |

## 주의사항

- **`done()`(또는 Promise 종료)을 잊으면 스피너가 영원히 돈다** — 실패 경로에서도 반드시 끝내라(React 래퍼는 finally로 보장).
- `overscroll-behavior: contain`은 브라우저 자체 당김 새로고침과의 충돌을 막는다 — 제거 금지.
- 모바일 브라우저 자체의 pull-to-refresh(크롬 안드로이드)와 이중이 될 수 있다 — 페이지 전체에 쓸 때는 브라우저 쪽을 끄는 정책(`overscroll-behavior-y: contain`을 body에)과 함께 검토하라.
- 스피너 회전은 상태 표시이므로 reduced-motion에서도 유지한다(복귀 이동만 즉시로 완화).
- 데스크톱에서는 마우스 드래그로 동작한다 — 데모용으로는 자연스럽지만, 실서비스에서 데스크톱에 노출할지는 제품 판단이다(새로고침 버튼 병행 권장).
