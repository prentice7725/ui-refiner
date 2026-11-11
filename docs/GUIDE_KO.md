# UI Refiner 가이드

[README](../README_KO.md) · [English](GUIDE.md) · [日本語](GUIDE_JA.md)

README에서 줄인 전체 설명입니다.

## 빠른 시작

요구사항: Node.js 22.18 이상, npm, Git.

```sh
git clone https://github.com/prentice7725/ui-refiner && cd ui-refiner
npm ci && npx playwright install chromium
npm link                                   # 선택: 어디서든 `ui-refiner` 명령으로 실행

ui-refiner scan your-site.example          # 운영 중인 페이지 점검
ui-refiner scan localhost:5173             # 개발 서버. 고친 뒤 같은 명령을 다시 실행하면 변화가 보임
ui-refiner keep record index.html                                  # 리파인 전에 링크·폼·수치 목록 저장
ui-refiner directions deal refine-directions --kind service --lang ko   # 시안마다 히어로 구조·서체·강조색·바탕 배정
ui-refiner directions refine-directions     # 디자인 시안(.html) 여러 개를 나란히 비교해 하나 고르기
ui-refiner directions record refine-directions --pick B                # 고른 방향 기록(다른 고객에겐 다른 방향)
ui-refiner photos "dentist chair" --out assets/stand-in             # 실제 사진이 오기 전까지 쓸 출처 표기 임시 사진(Wikimedia Commons)
ui-refiner directions verify refine-directions index.html             # 완성본이 고른 구조를 지켰는지 확인
ui-refiner keep check index.html                                   # 리파인한 페이지가 그중 하나라도 잃으면 exit 1
```

이게 전부입니다. `scan`은 URL, 호스트 이름, 로컬 `.html` 파일을 받고, 설정이 필요 없으며 대상 프로젝트를 바꾸지 않습니다. `npm link`를 하지 않았다면 `node bin/ui-refiner.mjs scan …`으로 실행합니다.

- **리포트 언어**는 페이지를 따릅니다. 일본어 페이지는 일본어, 한국어 페이지는 한국어, 그 밖에는 영어 리포트입니다. 항상 같은 언어로 받으려면 `UI_REFINER_LANG=ko`(또는 `ja`, `en`)를 설정하고, 한 번만 바꿀 때는 `--lang`을 씁니다. 브라우저 로케일은 호스트를 따릅니다(`.jp` → `ja-JP`, `.kr` → `ko-KR`). `--locale`로 바꿀 수 있습니다.
- **다시 스캔하면 자동으로 비교합니다.** 출력 폴더에 같은 페이지의 이전 스캔이 있으면 새 리포트 맨 앞에 전후 비교가 붙습니다. 끄려면 `--no-compare`, 다른 폴더의 스캔과 비교하려면 `--compare <폴더>`를 씁니다.
- `--source src`는 소스 정적 검사를 추가하고, `--out`은 출력 폴더를 바꿉니다(기본 `ui-refiner-scan/`).

Claude Code에서는 `/ui-review <주소>` 명령 하나로 스캔, 스크린샷 확인, 리뷰 작성까지 합니다([에이전트와 함께 쓰기](#에이전트와-함께-쓰기) 참고).

## `scan` 결과물

`ui-refiner-scan/`에 저장합니다(`--out`으로 변경).

| 파일 | 내용 |
|---|---|
| `DESIGN_REVIEW.md` | AI 티 지수, 신호별 근거·이유·수정 방향, 기본 품질 표, 일본어 타이포그래피(일본어 페이지), 소스 검사(`--source`), 피한 것, 에이전트의 다음 단계 |
| `scan.json` | 같은 내용의 기계 판독용 데이터 |
| `scan-desktop.png`, `scan-mobile.png` | 지연 로딩 콘텐츠까지 스크롤한 뒤의 1440px·390px 전체 스크린샷 |
| `before-scan-*.png`, `previous-scan.json` | 다시 스캔할 때 나란히 보기 위해 보관한 이전 스크린샷과 결과 |

### 고치기 전후 비교

같은 페이지를 같은 폴더로 다시 스캔하면 자동으로 비교합니다. 폴더를 나눠 쓰려면 `--compare`로 이전 폴더를 지정합니다.

```sh
ui-refiner scan localhost:5173                                   # 첫 스캔
# … 페이지 수정 …
ui-refiner scan localhost:5173                                   # 첫 스캔과 자동 비교
ui-refiner scan localhost:5173 --out scan-after --compare scan-before
```

리포트 맨 앞에 비교 섹션이 붙습니다. AI 티 지수 변화, 해결·새로 생김·남아 있는 신호(강해졌는지 약해졌는지 포함), 규칙별 기본 품질 변화, 일본어 조판 변화, 전후 스크린샷 링크를 보여 줍니다. 경로만 같으면 되므로 운영 사이트와 로컬 개발 서버를 비교해도 됩니다. 다른 페이지나 다른 브라우저 로케일이면 경고를 표시합니다. 예시로 `examples/ai-slop-landing-ja.html` → `examples/redesign-landing-ja.html`은 100 → 0, 신호 13개와 일본어 문제 7개가 해결됩니다.

### AI 티 지수 (0–100)

렌더링된 신호로 만든 휴리스틱입니다. 강한 신호 3, 중간 2, 약한 신호 1의 가중치를 줍니다. 직접 고른 웹폰트와 실제 이미지가 있으면 각각 점수를 15%씩 낮추지만 신호 목록은 그대로 남깁니다. *보고만* 표시된 신호는 사람이 만든 사이트에서도 AI가 만든 사이트만큼 자주 나와서, 리포트에는 나오지만 점수에는 더하지 않습니다. 어떤 것도 차단하지 않습니다.

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
| 카드 안의 카드 | 둥근 상자 안의 둥근 상자. 바깥 카드 3개 이상에서 |
| 둥근 사각형 안의 아이콘 | 아이콘 하나만 든 작고 색이 칠해진 둥근 사각형 3개 이상 |
| 개성 없는 서체 | Inter·Roboto·시스템 서체 하나로 전부 |
| 평평한 크기 단계 | 가장 큰 제목이 본문의 2배 미만(일본어 페이지는 제외) |
| 기본 강조색 | 손대지 않은 Tailwind indigo/violet/purple(일반 파랑과 Bootstrap 파랑은 보고만) |
| 많은 색상 | UI 색에 유채색 계열 5종 이상 |
| 자간 넓힌 라벨 | 섹션마다 반복되는 작고 자간을 넓힌 대문자 라벨 |
| 번호 라벨 | "01 / …", "STEP 1 · …" 식의 섹션 라벨 |
| 마침표 헤드라인 | 마침표로 끝나는 짧은 큰 제목("Stay by the sea.") |
| 종이색과 세리프 | 따뜻한 미색 배경에 세리프 큰 제목. 2025–26년의 에디토리얼 템플릿 |
| `transition: all` | 인터랙티브 요소의 계산된 스타일(보고만) |
| 옅은 미색 바탕 | 순백 대신 옅은 회백·미색 페이지 바탕. 사람이 만든 사이트 약 10%, AI 사이트 25–40%(보고만, `directions`가 활용) |
| 상투 문구 | 영어·한국어·일본어 상투 문구("unlock your potential", 잠재력, 可能性を解き放つ, 次世代の …) 2개 이상 |
| 반복되는 일반 CTA | "Learn more", 자세히 보기, 詳しく見る … 반복(보고만) |

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
| 어색한 줄바꿈 | 큰 제목 줄이 작은 가나나 ー로 시작하거나, 짧은 내비게이션·버튼 라벨 안에서 줄이 바뀜(뉴스 목록의 줄바꿈은 개수만 셈) |
| 제목의 `word-break: break-all` | 문절을 무시하고 줄바꿈. `auto-phrase`, BudouX, `<wbr>` 권장 |
| 일본어 기울임꼴 | 일본어 서체에는 이탤릭이 없어 억지로 기울어짐 |
| 음수 자간 | 영문식 좁은 자간으로 가나·한자가 부딪힘 |
| 12px 미만 글자 | 획이 많은 한자가 뭉개짐(푸터·법적 고지 제외) |
| 반각 가나, 전각 영숫자 | 오래된 인상, 검색·낭독에 불리 |

일본 웹의 관례는 AI 티로 보지 않습니다. Hiragino·Noto Sans JP·Yu Gothic 서체 지정, 작은 로고 `h1`, 높은 밀도는 정상입니다.

섹션 끝에는 위에서 본 **日本のサイトとの比較** 표가 붙습니다. 본문 크기, 행간, 제목÷본문 비율, 글자 크기 수, 색 계열 수, 가운데 정렬·둥근 상자 비율, 대비 부족 요소 수를 비교합니다. 데이터와 수집 방법은 [data/ja-reference/](../data/ja-reference/README.md)에 있습니다.

### 보정 결과

2026년 11월 측정(사이트가 바뀌면 점수도 바뀝니다). 스크립트: `scripts/calibrate-scan.mjs`, `scripts/rescore.mjs`.

| 집합 | 사이트 수 | 중앙 점수 | 20점 이상 |
|---|---:|---:|---:|
| ChatGPT로 만든 사이트(조정용) | 30 | 38 | 70% |
| 사람이 만든 사이트(조정용) | 26 | 0 | 0% |
| Lovable/v0 사이트(검증용) | 38 | 28 | 68% |
| 디자인 스튜디오·수상작·에디토리얼 사이트(검증용) | 29 | 5 | 3% |
| Replit/Lovable 갤러리 사이트(추가) | 77 | 35 | 74% |
| 한국·글로벌 브랜드·언론·공공·개인 사이트(추가) | 54 | 8 | 15% |
| 일본 기준 사이트 | 210 | 0 | 1% |
| `examples/ai-slop-landing.html`, `ai-slop-landing-ja.html` | 2 | 100 | |

추가 세트(`scripts/calibration-extra.tsv`)는 기준을 정한 뒤에 넣었습니다. 점수가 가장 약한 곳은 이 세트의 사람 쪽입니다. toss.im, shopify.com, loom.com, canva.com, dropbox.com 같은 대형 SaaS·소비자 브랜드는 보라 그라데이션, 상투 문구, 카드 나열, 유리 효과를 똑같이 써서 27–57점이 나옵니다. 점수가 낮다고 좋은 디자인이라는 뜻은 아니며, AI가 만든 사이트의 약 3분의 1은 여전히 20점 미만입니다.

## 에이전트와 함께 쓰기

[skills/ui-refiner-agent/SKILL.md](../skills/ui-refiner-agent/SKILL.md)의 스킬은 두 절차를 정의합니다.

- **점검**: `scan`을 돌리고 스크린샷을 먼저 본 뒤 신호마다 맞는지 판단한다. 판정, 근본 원인 2–3개, 원인별 리디자인 방향(보존할 것 포함), 사용자가 실제로 겪을 품질 문제를 보고한다.
- **고치기(refine)**: 스캔하고, 지켜야 할 것을 적고, 첫 화면 시안 세 개를 만들어 사용자가 고르게 한 뒤(`ui-refiner directions <폴더>`가 스크린샷을 나란히 보여 줌), 실제 콘텐츠로 고유 요소를 넣고 근본 원인별로 고친다. 구조부터 본다(알약 배지, 두 색 헤드라인, 로고 이름 줄, 아이콘 카드, 숫자 3개, 후기 3개, 요금제 3단, FAQ, CTA 띠로 이어지는 정형 순서). 사실을 지어내거나 다른 정형 스타일로 갈아끼우지 않고, 남은 신호가 의도한 것이 될 때까지 다시 스캔한다(최대 세 번).
- **만들기**: 프로젝트와 내장 suta 지침을 읽고, 마크업 전에 디자인 방향을 정하고, 나열된 기본값을 피한다. 그다음 개발 서버를 `scan`해 의도하지 않은 것을 고친다(최대 두 번).

설치해 두면 CLI를 직접 쓸 일이 거의 없습니다. 말로 시키거나("example.co.jp 디자인 점검해줘", "AI 티 안 나게 랜딩 페이지 만들어줘", "지적된 거 고치고 다시 비교해줘") Claude Code에서 슬래시 명령을 씁니다.

```
/ui-review https://example.co.jp
/ui-review localhost:5173 강한 신호를 고치고 다시 스캔해줘
/ui-refine landing.html
```

설치 방법:

| 에이전트 | 방법 |
|---|---|
| Claude Code (플러그인) | `/plugin marketplace add prentice7725/ui-refiner` 후 `ui-refiner` 설치. 플러그인 폴더에서 `npm ci && npx playwright install chromium` 한 번 실행 |
| Claude Code / Codex (프로젝트별) | 앱의 `tools/ui-refiner`에 이 저장소를 두고 `node tools/ui-refiner/scripts/install-agent-skill.mjs .` 실행. `.claude/skills/ui-refiner-agent`와 `/ui-review` 명령(Claude Code), `.agents/skills/ui-refiner-agent`(Codex)에 스킬을 두고 편집 후 훅을 등록 |

내장 디자인 지식은 `vendor/suta/skills/suta`(한국어)에 있습니다. AI 슬롭 금지선, 레이아웃·모션 값, 테스트된 UI 패턴 57종입니다.

## 심화 QA 게이트 (선택)

개발이나 CI에서 강제 게이트가 필요한 프로젝트는 `init` + `check`로 프로젝트 정책에 맞춰 suta 정적 검사와 lintapple 렌더링 검사를 실행합니다. 라우트, 상호작용 상태, 베이스라인, 변경 줄 범위, 증거 이미지, ARIA 비교, 시각 회귀, SARIF/HTML 내보내기, 리뷰 패킷을 지원합니다.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ko-KR
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

종료 코드: 0 통과(사람 검토가 남을 수 있음), 1 위반, 2 오류 또는 검사 범위 누락, 3 부분 범위 통과. 기본 정책은 시스템 UI 서체만 허용하므로 강제하기 전에 `ui-policy.json`을 승인된 타이포그래피에 맞추세요.

전체 문서: [docs/gate/README_KO.md](gate/README_KO.md) · [English](gate/README.md) · [日本語](gate/README_JA.md). 에이전트 절차: [reference/quality-gate.md](../skills/ui-refiner-agent/reference/quality-gate.md).

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

CI가 모든 테스트를 실행합니다([.github/workflows/ci.yml](../.github/workflows/ci.yml)). 내장 엔진은 고정 버전과 해시로 검증합니다([vendor/UPSTREAM.json](../vendor/UPSTREAM.json)). 변경 사항은 [CHANGELOG.md](../CHANGELOG.md), 배경 조사는 [docs/](./)에 있습니다.
