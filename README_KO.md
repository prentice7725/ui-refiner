# UI Refiner v0.4.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md) · [변경 기록](CHANGELOG.md)

UI Refiner는 코딩 에이전트(Claude Code, Codex)와 함께 일하는 사람이 다음 두 가지를 하도록 돕습니다.

1. **만들기**: AI가 만든 티가 나지 않는 웹페이지와 앱 화면을 만든다.
2. **점검**: 기존 페이지에서 무엇이 뻔해 보이는지 짚고 더 나은 디자인을 제안한다.

실제 브라우저로 페이지를 렌더링해 보이는 것을 측정하고, 에이전트나 디자이너가 바로 쓸 수 있는 리포트를 씁니다. 일본어 페이지에는 전용 조판 검사와 일본어 리포트를 제공합니다.

## 빠른 시작

요구사항: Node.js 22.18 이상, npm, Git.

```sh
git clone https://github.com/prentice7725/ui-refiner && cd ui-refiner
npm ci && npx playwright install chromium

node bin/ui-refiner.mjs scan https://your-site.example                      # 한국어 리포트(기본)
node bin/ui-refiner.mjs scan https://your-site.example --lang ja            # 일본어 리포트, ja-JP 브라우저
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --source src --lang en   # 개발 서버 + 소스 정적 검사
node bin/ui-refiner.mjs scan examples/ai-slop-landing.html                  # 로컬 HTML 파일
```

`scan`은 URL, 호스트 이름, 로컬 `.html` 파일을 받습니다. 설정이 필요 없고 대상 프로젝트를 바꾸지 않습니다.

## `scan` 결과물

`ui-refiner-scan/`에 저장합니다(`--out`으로 변경).

| 파일 | 내용 |
|---|---|
| `DESIGN_REVIEW.md` | AI 티 지수, 신호별 근거·이유·수정 방향, 기본 품질 표, 일본어 타이포그래피(일본어 페이지), 소스 검사(`--source`), 피한 것, 에이전트의 다음 단계 |
| `scan.json` | 같은 내용의 기계 판독용 데이터 |
| `scan-desktop.png`, `scan-mobile.png` | 지연 로딩 콘텐츠까지 스크롤한 뒤의 1440px·390px 전체 스크린샷 |
| `before-scan-*.png`, `previous-scan.json` | `--compare` 사용 시 나란히 보기 위해 보관한 이전 스크린샷과 결과 |

### 고치기 전후 비교

페이지를 고친 뒤 `--compare`에 이전 스캔 폴더(또는 그 `scan.json`)를 지정해 다시 스캔합니다.

```sh
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --out scan-before
# … 페이지 수정 …
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --out scan-after --compare scan-before
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --compare ui-refiner-scan   # 같은 폴더도 가능
```

리포트 맨 앞에 비교 섹션이 붙습니다. AI 티 지수 변화, 해결·새로 생김·남아 있는 신호(강해졌는지 약해졌는지 포함), 규칙별 기본 품질 변화, 일본어 조판 변화, 전후 스크린샷 링크를 보여 줍니다. 경로만 같으면 되므로 운영 사이트와 로컬 개발 서버를 비교해도 됩니다. 다른 페이지나 다른 브라우저 로케일이면 경고를 표시합니다. 예시로 `examples/ai-slop-landing-ja.html` → `examples/redesign-landing-ja.html`은 100 → 0, 신호 13개와 일본어 문제 7개가 해결됩니다.

### AI 티 지수 (0–100)

렌더링된 신호로 만든 휴리스틱입니다. 강한 신호 3, 중간 2, 약한 신호 1의 가중치를 줍니다. 직접 고른 웹폰트, 실제 이미지, 풍부한 글자 크기 단계가 있으면 각각 점수를 15%씩 낮추지만 신호 목록은 그대로 남깁니다. 어떤 것도 차단하지 않습니다.

| 신호 | 측정 내용 |
|---|---|
| 보라·남색 그라데이션 히어로 | 글자 뒤의 큰 그라데이션 중 색 정지점 대부분이 보라·남색·분홍인 것 |
| 넓은 그라데이션 | 글자가 있는 넓은 면을 덮는 그라데이션 |
| 그라데이션 글자 | `background-clip: text` 그라데이션, 제목이면 강한 신호 |
| 유리 효과 | 반복되는 `backdrop-filter: blur` 상자(고정 내비게이션은 허용) |
| 글로우 | 색이 있고 흐린 그림자 |
| 이모지 아이콘 | 단독이거나 맨 앞에 붙은 아이콘용 이모지(사용자 콘텐츠 속 이모지는 제외) |
| 아이콘 카드 나열 | 한 줄에 놓인 똑같은 둥근 카드 3–4개(각각 제목+설명) |
| 제목 위 알약 배지 | 헤드라인 바로 위의 알약 모양 배지 |
| 가운데 정렬 | 대부분의 문단이 가운데 정렬 |
| 과한 둥근 모서리 | 거의 모든 상자가 16px 이상 둥금 |
| 개성 없는 서체 | Inter·Roboto·시스템 서체 하나로 전부 |
| 평평한 크기 단계 | 가장 큰 제목이 본문의 2배 미만(일본어 페이지는 제외) |
| 기본 강조색 | 손대지 않은 Tailwind indigo/violet/blue 또는 Bootstrap 파랑 |
| 많은 색상 | UI 색에 유채색 계열 5종 이상 |
| `transition: all` | 인터랙티브 요소의 계산된 스타일 |
| 상투 문구 | 영어·한국어·일본어 상투 문구("unlock your potential", 잠재력, 可能性を解き放つ, 次世代の …) 2개 이상 |
| 반복되는 일반 CTA | "Learn more", 자세히 보기, 詳しく見る … 반복 |

장식 일러스트, `aria-hidden` 그림, SVG 내부, 고정 내비게이션은 제외해 공들인 브랜드 작업이 걸리지 않게 합니다.

### 기본 품질

내장 lintapple 엔진의 보편 규칙을 렌더링된 페이지에서 측정합니다. 글자 대비, 접근 가능한 이름, 폼 라벨, ARIA 참조, 컨트롤 상태, 터치 영역, 가로 넘침, 뷰포트 경계, 폰트 로딩을 봅니다. 서체·크기·문구처럼 프로젝트마다 다른 규칙은 심화 게이트에서 다룹니다.

### 일본어 페이지 (日本語)

페이지 대부분이 일본어이면 **日本語タイポグラフィ** 섹션을 추가합니다.

| 검사 | 이유 |
|---|---|
| 서체 지정에 일본어 서체 없음 | OS마다 다른 대체 서체로 보임. AI가 흔히 쓰는 `Inter, sans-serif` |
| 본문 행간 1.45 미만 | 일본어는 글자면이 커서 긴 글이 답답함(1.7–2.0 권장) |
| 제목 泣き別れ | 제목 마지막 줄에 1–2글자만 남음. 뷰포트별로 확인 |
| 제목의 `word-break: break-all` | 문절을 무시하고 줄바꿈. `auto-phrase`, BudouX, `<wbr>` 권장 |
| 일본어 기울임꼴 | 일본어 서체에는 이탤릭이 없어 억지로 기울어짐 |
| 음수 자간 | 영문식 좁은 자간으로 가나·한자가 부딪힘 |
| 12px 미만 글자 | 획이 많은 한자가 뭉개짐(푸터·법적 고지 제외) |
| 반각 가나, 전각 영숫자 | 오래된 인상, 검색·낭독에 불리 |

일본 웹의 관례는 AI 티로 보지 않습니다. Hiragino·Noto Sans JP·Yu Gothic 서체 지정, 작은 로고 `h1`, 높은 밀도는 정상입니다.

작성 시점의 보정 결과(사이트가 바뀌면 점수도 바뀝니다):

| 페이지 | AI 티 지수 | 비고 |
|---|---:|---|
| `examples/ai-slop-landing.html` | 100 | 신호 13개 |
| `examples/ai-slop-landing-ja.html` | 100 | 일본어 조판 문제 7개 추가 |
| 기본 데모(`npm run demo`) | 6 | 개성 없는 서체만 |
| stripe.com, linear.app, github.com, toss.im, apple.com/kr | 6–28 | |
| smarthr.jp, freee.co.jp, note.com, mercari, cybozu, yahoo.co.jp, apple.com/jp, line.me | 0–19 | 일본어 조판 지적은 별도(예: yahoo.co.jp의 `break-all`, 전각 숫자) |

## 에이전트와 함께 쓰기

[skills/ui-refiner-agent/SKILL.md](skills/ui-refiner-agent/SKILL.md)의 스킬은 두 절차를 정의합니다.

- **점검**: `scan`을 돌리고 스크린샷을 먼저 본 뒤 신호마다 맞는지 판단한다. 판정, 근본 원인 2–3개, 원인별 리디자인 방향(보존할 것 포함), 사용자가 실제로 겪을 품질 문제를 보고한다.
- **만들기**: 프로젝트와 내장 suta 지침을 읽고, 마크업 전에 디자인 방향을 정하고, 나열된 기본값을 피한다. 그다음 개발 서버를 `scan`해 의도하지 않은 것을 고친다(최대 두 번).

설치 방법:

| 에이전트 | 방법 |
|---|---|
| Claude Code (플러그인) | `/plugin marketplace add prentice7725/ui-refiner` 후 `ui-refiner` 설치. 플러그인 폴더에서 `npm ci && npx playwright install chromium` 한 번 실행 |
| Claude Code / Codex (프로젝트별) | 앱의 `tools/ui-refiner`에 이 저장소를 두고 `node tools/ui-refiner/scripts/install-agent-skill.mjs .` 실행. `.claude/skills/ui-refiner-agent`(Claude Code)와 `.agents/skills/ui-refiner-agent`(Codex)에 스킬을 두고 편집 후 훅을 등록 |

내장 디자인 지식은 `vendor/suta/skills/suta`(한국어)에 있습니다. AI 슬롭 금지선, 레이아웃·모션 값, 테스트된 UI 패턴 57종입니다.

## 심화 QA 게이트 (선택)

개발이나 CI에서 강제 게이트가 필요한 프로젝트는 `init` + `check`로 프로젝트 정책에 맞춰 suta 정적 검사와 lintapple 렌더링 검사를 실행합니다. 라우트, 상호작용 상태, 베이스라인, 변경 줄 범위, 증거 이미지, ARIA 비교, 시각 회귀, SARIF/HTML 내보내기, 리뷰 패킷을 지원합니다.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ko-KR
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

종료 코드: 0 통과(사람 검토가 남을 수 있음), 1 위반, 2 오류 또는 검사 범위 누락, 3 부분 범위 통과. 기본 정책은 시스템 UI 서체만 허용하므로 강제하기 전에 `ui-policy.json`을 승인된 타이포그래피에 맞추세요.

전체 문서: [docs/gate/README_KO.md](docs/gate/README_KO.md) · [English](docs/gate/README.md) · [日本語](docs/gate/README_JA.md). 에이전트 절차: [reference/quality-gate.md](skills/ui-refiner-agent/reference/quality-gate.md).

## 한계

- `scan`은 뷰포트마다 불러온 상태 하나만 봅니다. 상호작용 상태, 로그인이 필요한 페이지, 앱 전체의 일관성은 심화 게이트나 사람 확인이 필요합니다.
- 지수는 휴리스틱이지 취향 판정이 아닙니다. 점수가 낮다고 좋은 디자인이라는 뜻은 아니며, 의도된 브랜드 그라데이션은 괜찮습니다. 최종 시각 승인은 사람이 합니다.
- 비전 모델을 호출하지 않습니다. 시각 판단은 스크린샷을 읽는 에이전트가 합니다.
- Canvas 앱, Godot·Phaser UI, 게임 HUD는 대상이 아닙니다.
- 스크린샷과 리포트에 페이지 내용이 담길 수 있으니 공유 전에 확인하세요.

## 개발

```sh
npm test                 # 단위 테스트
npm run smoke:scan       # 실제 브라우저: 영어·일본어 슬롭 픽스처 vs 기본 데모
npm run smoke:ui         # 그 밖의 스모크: smoke:gate, smoke:routes, smoke:visual, …
```

CI가 모든 테스트를 실행합니다([.github/workflows/ci.yml](.github/workflows/ci.yml)). 내장 엔진은 고정 버전과 해시로 검증합니다([vendor/UPSTREAM.json](vendor/UPSTREAM.json)). 변경 사항은 [CHANGELOG.md](CHANGELOG.md), 배경 조사는 [docs/](docs/)에 있습니다.

## 라이선스

MIT. 내장한 서드파티 코드와 데이터는 각자의 라이선스를 따릅니다. suta([vendor/suta/LICENSE](vendor/suta/LICENSE)), lintapple([vendor/lintapple/LICENSE](vendor/lintapple/LICENSE)), UI UX Pro Max 데이터([knowledge/ui-ux-pro-max/LICENSE](knowledge/ui-ux-pro-max/LICENSE)), npm 패키지([licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md)).
