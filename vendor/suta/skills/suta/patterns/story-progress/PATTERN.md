---
name: story-progress
description: 스토리 화면 상단의 구간별 진행 막대(story progress)를 구현한다 — 자동 재생으로 칸이 차오르면 다음 장면으로 넘어가고, 길게 누르면 멈추고, 탭으로 이전·다음 이동. "스토리 진행바, 인스타 스토리 상단 바, 자동으로 넘어가는 온보딩, 쇼츠 진행 표시" 요청과 스토리·온보딩 화면에 쓴다. 기존 적용분의 구간 시간·구간 수 수정에도 쓴다.
---

# story-progress — 스토리 프로그레스

라이브 데모: https://guksu.github.io/suta/#/story-progress

## 언제 쓰는가

여러 장면이 자동으로 넘어가는 스토리형 UI — 상단에 구간 막대가 차오르고, 길게 누르면 멈추고, 좌우 탭으로 이전/다음 장면으로 이동하는 관례. 온보딩 슬라이드 자동 재생에도 같은 패턴이 쓰인다.

**기술 선택:** rAF로 `transform: scaleX`를 직접 구동한다(GPU 속성만). CSS animation 대신 rAF인 이유: 일시정지·재개·임의 구간 이동을 프레임 정확도로 제어해야 하기 때문이다 — CSS animation의 play-state 제어는 재개 지점·구간 이동 조합에서 금세 꼬인다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createStoryProgress.ts` | 코어 — 진행·일시정지·이동 상태 머신 | 모든 프로젝트 |
| `assets/story-progress.css` | 막대 모양 정의 | 모든 프로젝트 |
| `assets/useStoryProgress.ts` | React 훅 | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js로 저장한다.

## 사용 방법 — React

```tsx
import { useStoryProgress } from './useStoryProgress'

const SCENES = ['첫 장면', '두 번째 장면', '세 번째 장면']

const Story = () => {
  const story = useStoryProgress({ count: SCENES.length, durationMs: 4000 })

  return (
    <div
      onPointerDown={story.pause}
      onPointerUp={story.resume}
      onPointerLeave={story.resume}
    >
      <div className="story-bars">
        {SCENES.map((scene, index) => (
          <span key={scene} className="story-bar">
            <span ref={story.registerBar(index)} className="story-bar-fill" />
          </span>
        ))}
      </div>
      <section>{SCENES[story.index]}</section>
      <button type="button" onClick={story.prev} aria-label="이전 장면" />
      <button type="button" onClick={story.next} aria-label="다음 장면" />
    </div>
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { createStoryProgress } from './createStoryProgress.js'

const story = createStoryProgress({
  bars: [...document.querySelectorAll('.story-bar-fill')],
  durationMs: 4000,
  onIndexChange: (index) => showScene(index),
  onComplete: () => closeStory(),
})
story.start()
viewer.addEventListener('pointerdown', story.pause)
viewer.addEventListener('pointerup', story.resume)
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 구간 시간 | `durationMs` (기본 5000ms — 텍스트 장면은 길게, 이미지 장면은 짧게) |
| 막대 두께·색 | `--story-bar-height`·`--story-bar-color` |
| 장면 전환 | `onIndexChange(index)`에서 배경 콘텐츠를 갈아 끼운다 |
| 끝났을 때 | `onComplete` — 닫기·다음 스토리로 |

## 주의사항

- **길게 눌러 일시정지는 필수 관례다** — 사용자가 읽는 속도를 통제할 수단이 없으면 접근성 문제다(WCAG 2.2.2). 예시처럼 pointerdown/up에 pause/resume을 연결하라.
- 진행 막대는 상태 표시이므로 reduced-motion에서도 유지한다 — 끄면 "언제 넘어가는지"를 알 수 없게 되어 오히려 해롭다. 대신 장면 전환 효과를 넣는다면 그쪽을 완화하라.
- `.story-bar-fill`에 transition을 추가하지 마라 — rAF가 매 프레임 값을 쓰므로 뒤처져 보인다.
- 배경 콘텐츠(이미지 프리로드 등)는 이 패턴 범위 밖이다 — 진행 상태 머신만 담당한다.
