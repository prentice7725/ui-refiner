---
name: motion-audit
description: 프로젝트의 CSS·JS를 훑어 애니메이션 문제(크기·위치 속성 transition, transition: all, reduced-motion 누락, 시간 범위 밖, 이동에 linear, 퇴장에 ease-in, 무한 반복, setInterval 애니메이션)를 file:line으로 찾아 고치는 방법까지 알려주는 검사 도구(motion audit)다. "애니메이션 검토해줘, 모션 리뷰, 애니메이션 왜 버벅여, 성능 점검, 접근성 모션 확인, 전환 효과 코드 리뷰" 요청에 쓴다.
---

# motion-audit — 모션 검사

라이브 데모: https://guksu.github.io/suta/#/motion-audit

## 언제 쓰는가

"애니메이션이 버벅인다", "모션 코드를 검토해 달라", "접근성 설정을 지키는지 확인해 달라"는 요청. 그리고 suta 패턴을 적용한 뒤 마무리 점검. 눈으로 보면 주관이 섞이는 판단을 텍스트 규칙으로 바꿔, 스크립트 한 번으로 빠뜨림 없이 찾는다. 동작을 실행하지 않고 소스만 읽으므로 빌드 없이 어디서나 돈다.

반박: 텍스트 규칙은 "이 transition이 실제로 60fps인가"를 증명하지 못한다. 그래서 이 패턴은 **확실한 결함**(레이아웃 속성 애니메이션 등)만 error로 잡고, 판단이 갈리는 것(시간·이징 선택)은 warn으로 둔다. 진짜 프레임 성능은 브라우저 개발자 도구의 Performance 패널로 재야 한다.

**기술 선택:** 순수 함수(`auditMotion`) + 얇은 CLI. 브라우저와 Node 양쪽에서 같은 함수를 쓰므로 데모(붙여 넣기 검사)와 CLI(폴더 검사) 결과가 같다. 파서를 쓰지 않고 선택자 블록·선언 단위로 잘라 읽는다 — 의존성 0을 지키기 위해서이고, 그 대가로 중첩이 깊은 SCSS는 한 단계만 본다(주의사항).

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/auditMotion.ts` | 코어 — 규칙 9개, `auditMotion(sources)` → `Finding[]`, `formatFindings`, `summarize` | 모든 프로젝트 |
| `assets/auditCore.ts` | 공통 코어 — 결과 형식, CSS 블록 자르기, 예외 주석. layout-audit와 같은 파일 | 함께 복사 |
| `assets/audit.mjs` | CLI — 폴더 재귀, `--json`, `--warn-only`, error가 있으면 exit 1 | Node 22.18+ |

## 사용 방법

1. `assets/` 세 파일을 프로젝트(예: `tools/motion-audit/`)에 복사한다.
2. 검사한다:

```bash
node tools/motion-audit/audit.mjs src/
```

3. 출력을 위에서부터 고친다. 각 줄에 `file:line`, 규칙, 이유, 그리고 **어느 패턴·기법으로 고치는지**가 붙는다:

```text
src/styles/menu.css:41 [error] layout-animation — height를 transition — 매 프레임 레이아웃이 돈다
    → 높이 변화는 grid-template-rows: 0fr→1fr (accordion 패턴) 또는 transform: scaleY
src/styles/menu.css:1 [error] no-reduced-motion — 움직임이 있는데 prefers-reduced-motion 블록이 없다
    → @media (prefers-reduced-motion: reduce) { … } 에서 이동·확대를 끄고 페이드만 남긴다
src/components/Ticker.tsx:12 [warn] js-interval-anim — setInterval로 스타일을 갱신 — 프레임과 어긋나 끊긴다
    → requestAnimationFrame 루프(count-up·spring-physics 코어) 또는 CSS transition

검사한 파일 23개 — error 2, warn 1
```

4. error가 0이 될 때까지 반복한다. warn은 판단해서 남길 수 있다(예: 진행률 바의 linear).
5. CI에 넣으려면 `package.json`에 `"audit:motion": "node tools/motion-audit/audit.mjs src/"`를 추가한다. 기존 코드가 많으면 `--warn-only`로 시작해 error를 단계적으로 없앤다.

```ts
// 프로그램에서 쓰기 — 예: 커밋 훅, 에디터 확장, 브라우저
import { auditMotion, formatFindings } from './auditMotion'

const findings = auditMotion([{ file: 'menu.css', text: cssSource }])
console.log(formatFindings(findings))
```

## 규칙

| 규칙 | 심각도 | 잡는 것 | 고치는 법 |
|------|--------|---------|-----------|
| `layout-animation` | error | width·height·top·left·margin·padding·font-size 등을 transition/@keyframes/프레임 루프에서 변경 | 높이는 accordion의 `grid-template-rows`, 위치는 flip-list의 FLIP, 폭은 `scaleX` |
| `transition-all` | error | `transition: all` | 움직일 속성을 이름으로 나열 |
| `no-reduced-motion` | error | transition/animation이 있는 파일에 `prefers-reduced-motion` 블록 없음 | 이동·확대를 끄고 페이드만 남기는 블록 추가 |
| `duration-range` | warn | transition 60ms 미만·700ms 초과, 단발 animation 2초 초과 | motion-principles 토큰(100~420ms) |
| `linear-movement` | warn | transform 이동에 `linear` | ease-out. linear는 진행률·스피너에만 |
| `ease-in-exit` | warn | exiting·closing·hide 상태에 `ease-in` | 퇴장도 ease-out, 시간은 진입의 3/4 |
| `infinite-loop` | warn | `infinite` 반복 | reduced-motion에서 멈추거나 느린 페이드 |
| `js-interval-anim` | warn | `setInterval`로 style 갱신 | `requestAnimationFrame` 또는 CSS |
| `will-change-global` | warn | 상시 `will-change` | 움직이기 직전 상태에서만 |

## 의도적 예외

규칙이 틀린 게 아니라 이 자리에서는 감수하는 게 맞을 때가 있다(absolute 요소의 width 전이, 계속 끌리는 요소의 `will-change`). 그 줄이나 바로 앞 줄에 이유를 붙여 예외를 선언한다:

```css
.thumb {
  /* motion-audit-ignore: layout-animation — thumb는 absolute라 width 전이가 자기 자신만 레이아웃한다 */
  transition: width 200ms ease-out;
}
```

이유가 없는 예외는 두지 마라 — 다음 사람이 규칙을 되살릴지 판단할 근거가 없어진다. `0s`/`0ms` 전이(visibility 지연 같은 관용 표현), 주석 속 단어, reduced-motion 블록이 `animation`을 다루는 파일의 무한 반복은 예외 없이도 지적하지 않는다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 시간 범위 | `auditMotion.ts`의 `duration-range` 판정(60·700·2000) — 프로젝트 기준에 맞춰 바꾼다 |
| 레이아웃 속성 목록 | `LAYOUT_PROPS` 배열 |
| 퇴장 상태 판정 | `EXIT_STATE` 정규식(exit·closing·leave·hide·dismiss·collaps) — 프로젝트의 상태 이름을 추가 |
| 검사 확장자·제외 폴더 | `audit.mjs`의 `EXT`·`SKIP` |
| error만 게이트로 | 기본 동작. warn까지 막으려면 CLI의 종료 조건을 바꾼다 |

## 주의사항

- **CSS 파서가 아니다.** 선택자 블록을 중괄호로 세어 자르므로 SCSS의 두 단계 이상 중첩·`@mixin` 안의 선언은 한 단계까지만 본다. 컴파일된 CSS를 검사하면 정확하다.
- **`no-reduced-motion`은 파일 단위다.** 전역 CSS 한 곳에 reduced-motion 블록을 두고 컴포넌트 CSS에는 안 두는 구조라면 컴포넌트 파일마다 error가 난다. 그 경우 검사 대상에서 전역 파일을 같이 넣거나, 각 파일에 블록을 두는 suta 방식으로 바꾼다(패턴 단위로 복사해 쓰려면 파일마다 있어야 한다).
- **경고는 판단의 여지가 있다.** 진행률 바의 `width` transition은 error로 잡히지만, 값이 드물게 바뀌는 진행률이면 실제 비용이 작다 — 그래도 `transform: scaleX`가 같은 결과를 더 싸게 낸다.
- JS 규칙은 휴리스틱이다(`setInterval` 뒤 400자 안에 style 갱신, 프레임 루프 앞 600자 안의 `style.left` 대입). 놓치는 경우가 있고 오탐도 있다. 확신이 없으면 그 줄을 직접 읽는다.
- **스크립트의 주석과 템플릿 문자열은 읽지 않는다.** 문서·데모 페이지가 화면에 보여 주는 예시 코드(`` `setInterval(…)` ``)는 실행되지 않기 때문이다. 템플릿 문자열로 만드는 CSS(CSS-in-JS)도 이 JS 규칙의 대상이 아니다. `motion-audit-ignore` 주석은 CSS와 스크립트 모두에 적용된다.
- 코어는 Node가 바로 실행하도록 `.ts` 확장자를 붙여 import한다(`./auditCore.ts`). 앱의 tsconfig가 이 폴더를 포함하면 `allowImportingTsExtensions`를 켜거나 이 폴더를 제외한다.
- Node 22.18 미만에서는 CLI가 `.ts`를 못 읽는다 — `node --experimental-strip-types audit.mjs …`로 실행한다.
