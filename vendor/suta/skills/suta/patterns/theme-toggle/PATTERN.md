---
name: theme-toggle
description: 다크모드 전환(dark mode toggle)을 구현한다 — 누른 지점에서 원이 퍼지며 테마가 바뀌고, 선택은 저장되며, 고르지 않았으면 기기 설정을 따른다. "다크모드, 라이트/다크 전환, 테마 토글, 야간 모드 버튼, 누르면 화면이 어두워지는 버튼" 요청에 쓴다. 기존 적용분의 새로고침 깜빡임·시스템 설정 연동 수정에도 쓴다.
---

# theme-toggle — 다크모드 전환

라이브 데모: https://guksu.github.io/suta/#/theme-toggle

## 언제 쓰는가

라이트/다크 테마를 사용자가 직접 고르게 할 때. 이 패턴이 다루는 것은 세 가지다 — **원이 퍼지는 전환**, **선택 기억**, **기기 설정 따라가기**. 색 팔레트 자체는 프로젝트 몫이다(아래 "테마 변수 준비하기").

화면 전체가 한 순간에 뒤집히면 "무슨 일이 일어났는지"가 안 보인다. 누른 지점에서 원이 퍼지며 새 테마가 덮이면 **원인(내가 누른 버튼)과 결과가 이어진다**.

**기술 선택:** View Transitions API. 이전 화면을 사진으로 남긴 뒤 새 화면의 `clip-path`를 점에서 원으로 키운다 — 색 변수를 하나씩 트랜지션하는 것이 아니라 스냅샷 두 장을 겹쳐 놓고 위쪽을 도려내므로, 테마 변수가 10개든 200개든 비용이 같다. 지원하지 않는 브라우저에서는 전환 없이 즉시 바뀐다.

> **`clip-path`는 px가 아니라 백분율로 준다.** `::view-transition-new()`가 그리는 것은 화면을 찍은 스냅샷이고, 그 안에서 길이는 장치 픽셀 기준으로 해석된다 — 레티나(dpr 2) 화면에서 px로 주면 원이 절반 위치에서 절반 크기로 자라, 엉뚱한 데서 시작해 다 덮기도 전에 끝나며 나머지가 툭 바뀐다. 코어가 백분율로 변환해 주므로 쓰는 쪽은 뷰포트 좌표만 주면 된다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/runThemeTransition.ts` | 코어 — 전환 범위 지정·원 확산·폴백 | 모든 프로젝트 |
| `assets/useTheme.ts` | React 훅 — 선택 기억·기기 설정 따라가기·data-theme 적용 | React 프로젝트만 |
| `assets/ThemeToggle.tsx` | 토글 버튼 (해↔달 아이콘) | React 프로젝트만 |
| `assets/theme-toggle.css` | 겹침 규칙·버튼·아이콘 교대 | 모든 프로젝트 |

## 1. 테마 변수 준비하기 (먼저 할 일)

이 패턴은 `<html>`에 `data-theme="light" | "dark"`를 붙일 뿐이다. 색은 프로젝트가 정의한다:

```css
:root {
  --bg: #ffffff;
  --text: #111827;
  --surface: #f9fafb;
}

:root[data-theme='dark'] {
  --bg: #0f1115;
  --text: #e8eaf0;
  --surface: #171a21;
}
```

**색을 CSS 변수로 모아 두는 것이 전제다.** 컴포넌트마다 색을 직접 쓰고 있으면 테마 전환 이전에 그 정리가 먼저다.

## 2. 새로고침 깜빡임 막기 (빼먹으면 티가 난다)

React가 실행되기 전까지 브라우저는 기본 테마로 화면을 그린다 — 다크를 고른 사용자는 새로고침마다 흰 화면이 번쩍인다. `<head>`에 **인라인 스크립트**를 넣어 자바스크립트 번들보다 먼저 테마를 정한다:

```html
<script>
  try {
    var saved = localStorage.getItem('theme')
    var dark = saved === 'dark' || (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  } catch (e) {}
</script>
```

`useTheme`이 쓰는 저장 키(`theme`)와 판정 규칙이 위 스크립트와 같아야 한다.

## 3. 사용 방법 — React

```tsx
import { ThemeToggle } from './ThemeToggle'

const Header = () => (
  <header>
    <h1>성수동 손칼국수</h1>
    <ThemeToggle />
  </header>
)
```

버튼 없이 상태만 필요하면 훅만 쓴다:

```tsx
const theme = useTheme()
// theme.choice: 'light' | 'dark' | 'system' (사용자의 선택)
// theme.resolved: 'light' | 'dark'          (실제로 적용된 것)
// theme.setTheme('system')                  (기기 설정 따라가기로 되돌리기)
```

### 특정 영역만 바꾸기

미리보기 패널처럼 화면 일부만 테마를 바꿔야 하면 그 요소를 준다 — 원은 그 영역 안에서만 퍼진다.

```tsx
const cardRef = useRef<HTMLDivElement>(null)

<div ref={cardRef} className="preview">
  <ThemeToggle scopeRef={cardRef} />
</div>
```

## 4. 사용 방법 — 순수 JS (React 없음)

```js
import { runThemeTransition } from './runThemeTransition.js'

button.addEventListener('click', (event) => {
  runThemeTransition({
    origin: { x: event.clientX, y: event.clientY },
    apply: () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      localStorage.setItem('theme', next)
    },
  })
})
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 원이 퍼지는 시간 | `durationMs` | 450ms |
| 퍼지는 가속 곡선 | `easing` | `cubic-bezier(0.4, 0, 0.2, 1)` (완만한 ease-in-out) |
| 저장 키 | `storageKey` | `'theme'` |
| 전환 범위 | `scopeRef` (없으면 문서 전체) | 문서 전체 |
| 버튼 크기·색 | `--theme-toggle-size`·`--theme-toggle-color`·`--theme-toggle-bg` | 2.25rem / 상속색 / 투명 |
| 스위치 이름 | `label` | "다크 모드" |

## 주의사항

- **`apply`는 동기적으로 DOM을 바꿔야 한다.** React라면 `flushSync`가 필수다(`ThemeToggle`은 이미 그렇게 한다). 그냥 `setState`하면 브라우저가 사진을 찍고 콜백이 끝난 뒤에야 테마가 바뀌어, 전환이 "안 바뀐 화면 → 안 바뀐 화면"이 된다.
- **이징은 ease-out이 아니라 완만한 ease-in-out이다.** 다른 등장 모션과 다른 이유는, 여기서 눈에 보이는 것이 반지름이 아니라 **원의 가장자리가 화면을 쓸고 가는 속도**이기 때문이다. 강한 ease-out을 쓰면 반지름이 초반에 폭발적으로 커졌다가 후반에 기어가서, 같은 시간이라도 매끄럽지 않게 읽힌다.
- **450ms는 UI 모션 예산(300ms)을 넘는 값이고, 의도된 것이다.** 화면 전체를 덮는 원이 300ms 안에 끝나면 급하게 스쳐 지나간다. 대신 테마 전환은 **드물게 일어나는 조작**이라 이 예산이 허용된다 — 자주 누르는 버튼이라면 짧게 줄여야 한다.
- **page-transition 패턴과 함께 써도 된다.** 그 패턴은 `:root { view-transition-name: none }`으로 전체 전환을 꺼 두는데, 이 코어는 전환하는 그 순간에만 인라인으로 이름을 켜고 끝나면 원래 값으로 되돌린다.
- **`data-theme`만으로는 브라우저 기본 UI(스크롤바·폼 컨트롤)가 따라오지 않는다.** `:root[data-theme='dark'] { color-scheme: dark; }`를 함께 선언한다.
- **모션 민감 설정에서는 원이 퍼지지 않고 즉시 바뀐다** — 화면 전체를 쓸고 지나가는 원은 대표적인 부담 모션이라 완화가 아니라 생략이 맞다. 테마 변경 자체는 그대로 동작한다.
- **저장이 막힌 환경(프라이빗 모드)에서도 동작한다** — 이번 세션 동안만 유지되고 기억하지 못할 뿐이다.
- 버튼은 `role="switch"` + `aria-checked`다 — 스크린 리더가 "다크 모드, 스위치, 켜짐"처럼 현재 상태까지 읽는다.
