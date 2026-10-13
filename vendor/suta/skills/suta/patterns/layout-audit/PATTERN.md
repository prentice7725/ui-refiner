---
name: layout-audit
description: CSS·JSX·HTML에서 AI가 흔히 만드는 레이아웃 문제를 file:line으로 찾는 정적 검사 도구(layout audit)다. 11px 미만 글자, 카드 안 카드, 효과 남발, 글자 크기·굵기·반경 종류 과다, 4px 척도 밖 간격, 문단 가운데 정렬, 늘어난 사진, 옅은 색 면, 색 계열 과다, 이모지 아이콘, 모바일 웹뷰의 100vh·입력칸 확대·확대 막기를 잡는다. "레이아웃 검사해줘, 디자인 규칙 점검, 카드 안 카드 잡아줘, 스타일 코드 리뷰, layout lint" 요청에 쓴다.
---

# layout-audit — 레이아웃 검사

라이브 데모: https://guksu.github.io/suta/#/layout-audit

## 언제 쓰는가

화면을 만들거나 고친 뒤의 마무리 점검. 그리고 "디자인이 AI 같다", "스타일 코드를 리뷰해 달라"는 요청. `layout-principles`의 원칙 12개 중 코드만 읽고 판정할 수 있는 것을 규칙으로 바꿨다. 스크립트 한 번으로 빠뜨림 없이 찾는다. 소스만 읽으므로 빌드 없이 어디서나 돈다.

반박: 레이아웃이 좋은지는 대부분 사람이 판단한다. 무엇을 먼저 보일지(P1), 관례를 따르는지(P11)는 코드에 드러나지 않는다. 그래서 이 패턴은 **읽히지 않는 글자**(11px 미만)만 error로 잡는다. 나머지는 warn으로 두고, 고칠지는 원칙을 보고 판단한다. 대비·터치 영역·좁은 폭 넘침처럼 렌더가 필요한 것은 범위 밖이다. 브라우저 개발자 도구로 잰다.

**기술 선택:** 순수 함수(`auditLayout`)와 얇은 CLI다. 브라우저와 Node에서 같은 함수를 쓰므로 데모(붙여 넣기 검사)와 CLI(폴더 검사)의 결과가 같다. 파서 없이 CSS는 선택자 블록 단위로, JSX·HTML은 태그 단위로 잘라 읽는다. 의존성을 두지 않기 위해서다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/auditLayout.ts` | 코어 — 규칙 16개, `auditLayout(sources)` → `Finding[]`, `formatFindings`, `summarize` | 모든 프로젝트 |
| `assets/auditCore.ts` | 공통 코어 — 결과 형식, CSS 블록 자르기, 예외 주석 | 함께 복사 |
| `assets/layoutTokens.ts` | 간격 척도·글자 하한 — `layout-principles`와 같은 파일 | 함께 복사 |
| `assets/audit.mjs` | CLI — 폴더 재귀, `--json`, `--warn-only`, error가 있으면 exit 1 | Node 22.18+ |

## 사용 방법

1. `assets/` 네 파일을 프로젝트(예: `tools/layout-audit/`)에 복사한다.
2. 검사한다. 한 번에 넘긴 파일끼리는 클래스를 공유한다. CSS의 `.card`가 상자이면 TSX의 `className="card"`도 상자로 안다.

```bash
node tools/layout-audit/audit.mjs src/
```

3. 출력을 위에서부터 고친다. 줄마다 `file:line`, 규칙, 이유, 고치는 법(원칙 번호)이 붙는다.

```text
src/components/OrderCard.tsx:14 [warn] nested-card — 상자 안에 상자 — 바깥 상자(9줄) 안에 테두리·배경·그림자가 있는 상자가 또 있다
    → 안쪽 상자를 걷어 내고 간격·얇은 선·정렬로 나눈다. 카드는 독립 단위에 한 겹만 (P5)
src/styles/menu.css:41 [error] tiny-text — 글자 10px — 읽히지 않는다(하한 12px)
    → 보조 글자도 12px(--text-caption) 이상. 자리가 모자라면 글자가 아니라 요소·열을 줄인다(P7)
src/styles/menu.css:3 [warn] spacing-off-scale — 4px 격자 밖 간격 5곳(3·8·12·20·31줄)
    → 척도(4·8·12·16·24·32·48·64)로 — 10px → 8px, 6px → 4px (P4·P10)

검사한 파일 23개 — error 1, warn 2
```

4. error가 0이 될 때까지 반복한다. warn은 원칙을 보고 판단한다. 남길 때는 이유를 주석으로 적는다(아래 의도적 예외).
5. CI에 넣으려면 `package.json`에 `"audit:layout": "node tools/layout-audit/audit.mjs src/"`를 추가한다.

```ts
// 프로그램에서 쓰기 — 예: 커밋 훅, 에디터 확장, 브라우저
import { auditLayout, formatFindings } from './auditLayout'

const findings = auditLayout([
  { file: 'menu.css', text: cssSource },
  { file: 'Menu.tsx', text: tsxSource },
])
console.log(formatFindings(findings))
```

## 규칙

| 규칙 | 심각도 | 잡는 것 | 원칙 |
|------|--------|---------|------|
| `tiny-text` | 11px 미만 error, 11px대 warn | CSS `font-size`·`font`, Tailwind `text-[10px]`, 인라인 스타일 `fontSize`. 화면 낭독기 전용(`sr-only`)과 아이콘 글꼴(`icon`·`fa-`·`material-icons` 등)은 뺀다 | P7 |
| `nested-card` | warn | 둥근 모서리 + 테두리·그림자·배경을 가진 요소 안의 같은 요소. JSX·HTML 태그 중첩(Tailwind 클래스, CSS가 상자로 정의한 클래스, `Card` 컴포넌트)과 CSS 자손 선택자·중첩으로 판정한다. 입력칸·버튼·링크·배지·컨트롤 부속은 뺀다 | P5 |
| `effect-overuse` | warn | 색 그라데이션·`backdrop-filter`·큰 그림자(흐림 16px 이상)가 한 파일에 3곳 이상. 검은 스크림·흰 반짝임, 전이의 시작 상태(`blur(0)`·완전히 투명한 그림자)는 세지 않는다 | P3 |
| `gradient-text` | warn | `background-clip: text`·`bg-clip-text` | P3 |
| `font-size-variety` | warn | 한 파일의 글자 크기 7종 이상 | P2·P10 |
| `font-weight-variety` | warn | 굵기 4종 이상 | P2 |
| `radius-variety` | warn | 모서리 반경 4종 이상. 0·원(50%)·알약(999px)·`calc()` 파생값은 뺀다 | P10 |
| `spacing-off-scale` | warn | 4px 격자 밖 margin·padding·gap(1·2px 선 두께는 허용). 파일마다 한 번 요약하고 가까운 척도를 제안한다 | P4·P10 |
| `centered-text-block` | warn | 문단의 가운데 정렬 — CSS는 문단·설명류 선택자, JSX·HTML은 `text-center` 안에서 글자로 적힌 부분이 40자 이상인 `<p>`(`{설명}` 같은 식은 길이를 몰라 세지 않는다) | P6 |
| `image-distort` | warn | `object-fit: fill`·`object-fill` | P9 |
| `tinted-surface` | warn | 옅은 유채색 바탕(연노랑·살구·연분홍·연민트·연파랑) — CSS `background`·변수 정의, Tailwind `bg-{색}-50~200`, 인라인 스타일. 반투명 색은 흰 면 위에 얹은 색으로 판정한다. OKLCH 밝기 0.9 이상 + 채도 0.012 이상이 기준이고, slate 같은 푸른 회색은 회색으로 둔다. 파일마다 한 번 요약 | P5·`tone.md` |
| `hue-count` | warn | 한 파일의 유채색 계열(빨강·주황·노랑·초록·청록·파랑·보라·분홍) 3종 이상 — 모든 색 속성·변수 정의·Tailwind 색 이름에서 센다. 다크 모드의 같은 계열은 하나로 센다. 시세의 등락 색 변수(`--color-rise`·`--color-fall`처럼 이름에 rise·fall·up·down)와 보상 색 변수(`--color-reward`처럼 이름에 reward·medal·coin·gold·silver·bronze)는 빼고 센다 | `tone.md` |
| `emoji-icon` | warn | JSX·HTML에 그림으로 그려지는 이모지(🏠 🛒 ❤️). 아이콘·사진 자리의 이모지는 기기마다 모양이 달라 AI가 만든 화면의 표시다. ★ ✓ × → © 같은 글자 기호와 주석은 뺀다. 파일마다 한 번 요약 | `tone.md` |
| `viewport-height` | warn | `height`·`min-height`·`max-height: 100vh`와 Tailwind `h-screen`·`min-h-screen` — 같은 블록·요소에 `dvh`·`svh` 짝이 없을 때. 모바일 브라우저·웹뷰에서 아래가 잘린다 | 웹뷰 |
| `input-zoom` | warn | 글자 입력칸(`input`·`textarea`·`select`, 이름이 `input`·`textarea`로 끝나는 클래스, Tailwind `text-sm`을 단 입력칸)의 16px 미만 글자. iOS는 초점이 갈 때 화면을 확대한다. 체크·라디오·버튼 입력, placeholder, `@media (pointer: fine)`·넓은 화면 묶음은 뺀다 | 웹뷰 |
| `zoom-disabled` | warn | viewport 메타의 `user-scalable=no`·`maximum-scale=1` — 글자를 키워 읽어야 하는 사람이 읽을 수 없다(WCAG 1.4.4) | 접근성 |

## 의도적 예외

규칙이 틀린 게 아니라 이 자리에서는 감수하는 게 맞을 때가 있다. 차트 축 눈금의 작은 글자, 유리 효과가 목적인 컴포넌트, 외부 서비스 고유 색(카카오 노랑 버튼), 콘텐츠 색(사진 자리·카드 테마)이 그 예다. 그 줄이나 바로 앞 줄에 이유를 붙여 예외를 선언한다.

```css
.axis-tick {
  /* layout-audit-ignore: tiny-text — 차트 축 눈금, 값은 툴팁으로도 읽힌다 */
  font-size: 10px;
}
```

파일 전체에서 한 규칙을 끄려면 파일 아무 곳에나 적는다.

```css
/* layout-audit-ignore-file: effect-overuse — 유리 효과가 이 컴포넌트의 목적이다 */
```

JSX는 `{/* layout-audit-ignore: nested-card — 이유 */}`로 적는다. 이유가 없는 예외는 두지 마라. 다음 사람이 규칙을 되살릴지 판단할 근거가 없어진다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 기준값 | `auditLayout.ts` 위쪽 상수 — `TINY_ERROR_PX`(11), `SIZE_VARIETY`(7), `WEIGHT_VARIETY`(4), `RADIUS_VARIETY`(4), `EFFECT_LIMIT`(3), `LONG_TEXT_CHARS`(40) |
| 간격 척도 | `layoutTokens.ts`의 `SPACE`·`isOnGrid` — 프로젝트가 8px 격자면 `isOnGrid`를 8의 배수로 |
| 상자에서 뺄 요소 | `EXCLUDED_NAME`·`EXCLUDED_CLASS` 정규식에 프로젝트의 컨트롤 이름을 더한다 |
| 검사 확장자·제외 폴더 | `audit.mjs`의 `EXT`·`SKIP` |

## 주의사항

- **CSS 파서가 아니다.** 선택자 블록을 중괄호로 세어 자르고, JSX는 태그를 직접 센다. `@mixin` 안의 선언이나 런타임에 조합하는 클래스(`cn(cond && 'rounded-xl')`의 조건)는 정확히 읽지 못한다. 컴파일된 CSS나 렌더 결과로 다시 확인할 수 있다.
- **TSX 안의 여러 줄 템플릿 문자열은 마크업으로 읽지 않는다.** 예시 코드나 HTML 문자열을 담은 `` `<div …>…` `` 는 JSX가 아니기 때문이다. 한 줄짜리 ``className={`…`}``는 그대로 읽는다.
- **상자 판정은 같은 실행에 넘긴 파일만 본다.** CSS 모듈(`styles.card`)처럼 클래스 이름이 코드에 문자열로 없으면 상자로 알 수 없다. 폴더 전체를 한 번에 넘기면 CSS 파일의 클래스를 TSX에서 찾는다.
- **warn은 판단의 여지가 있다.** 대시보드는 숫자 크기가 많아 `font-size-variety`가 날 수 있다. 화면을 컴포넌트로 나눴는지 먼저 보고, 그래도 필요하면 이유를 적고 남긴다.
- **`em` 글자 크기는 판정하지 않는다.** 부모 크기를 몰라서다. `px`·`rem`만 본다. `rem`은 함께 넘긴 파일의 `html`·`:root` 글자 크기로 바꾼다(`62.5%`면 1rem = 10px, 없으면 16px).
- 코어는 Node가 바로 실행하도록 `.ts` 확장자를 붙여 import한다. 앱의 tsconfig가 이 폴더를 포함하면 `allowImportingTsExtensions`를 켜거나 이 폴더를 제외한다.
- Node 22.18 미만에서는 CLI가 `.ts`를 못 읽는다. `node --experimental-strip-types audit.mjs …`로 실행한다.
