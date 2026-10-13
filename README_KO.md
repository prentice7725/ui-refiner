# UI Refiner v0.3.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner는 일반 DOM 웹앱을 대상으로 **suta의 소스 검사·디자인 지침**과 **lintapple의 실제 렌더링 기반 레이아웃·접근성·상호작용 검사**를 결합합니다. 개발자와 코딩 에이전트가 사용할 수정 증거와 결정적인 품질 게이트를 제공합니다.

suta의 고정된 전체 스킬 카탈로그와 57개 패턴, 유지보수되는 lintapple 런타임 소스가 포함됩니다. UI 자동 생성, 자동 코드 수정, 비전 모델 호출, 출시 승인은 수행하지 않습니다. Godot UI·Phaser Canvas·게임 HUD는 검사 대상이 아닙니다.

## 1. 요구사항과 설치

**Node.js 22.18 이상**, npm, Git과 명시적으로 설치한 Playwright Chromium이 필요합니다. 런타임 npm 의존성은 `axe-core@4.14.0`, `playwright@1.63.0`으로 고정됩니다.

저장소를 대상 앱의 `tools/ui-refiner`에 배치합니다. 이 소스 설치 방식은 지원하지만, `node_modules` 아래에서 suta의 native TypeScript를 실행하는 방식은 지원하지 않습니다. 컴파일된 npm 배포판은 아직 없습니다.

**대상 앱 루트**에서 실행합니다.

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ko-KR
```

초기 정책 로케일은 `en-US`, `ko-KR`, `ja-JP`입니다. 정책은 정본 `vendor/lintapple/ui-policy.json` 한 곳에서 파생합니다. 한국어·일본어 정책에는 초기 폰트 목록과 문구 규칙이 추가되며, 일본어 목록에는 Hiragino·Noto Sans JP·Meiryo·Yu Gothic 등이 포함됩니다. 생성된 정책은 프로젝트의 승인된 디자인 시스템에 맞춰 검토해야 합니다.

`init`은 기존 설정·정책 파일을 유지합니다. 다른 로케일로 다시 실행해도 기존 정책을 교체하지 않습니다.

## 2. 프로젝트 설정

`init`은 `ui-refiner.config.json`과 `ui-policy.json`을 생성합니다. 프로젝트 경로는 모두 **설정 파일이 있는 디렉터리**를 기준으로 해석합니다.

| 필드 | 용도 / 기본값 |
|---|---|
| `preset` | `web`만 지원 |
| `locale` | 브라우저 로케일과 초기 정책 선택; 기본 `en-US` |
| `static.auditPath` | 기본 `"bundled"`; 유지보수되는 `vendor/suta` 소스 실행 |
| `static.targets` | 정적 검사 대상 소스 경로; 기본 `["src"]` |
| `static.enforcement` / `browser.enforcement` | `enforce` 또는 `advisory`; 둘 다 기본 `enforce` |
| `browser.url` | 실행 중인 앱 URL; 기본 `http://127.0.0.1:5173` |
| `browser.policyPath` | 프로젝트 정책; 기본 `ui-policy.json` |
| `browser.ready` | 선택적 준비 완료 셀렉터가 보일 때까지 대기; 기본 `null` |
| `browser.interactionsPath` | 선택적 상호작용 계획 JSON; 기본 `null` |
| `browser.captureScreenshots` | 같은 세션의 상태 이미지·요소 크롭; 기본 `false` |
| `browser.timeoutMs` | 탐색·감사 단계별 제한; 기본 `120000` ms |
| `browser.sessionTimeoutMs` | 독립적인 전체 세션 제한; 기본 `null`이면 자동 산정 |
| `gate.maxStaticWarnings` | 선택적 정적 경고 상한; `null`이면 경고가 blocker가 되지 않음 |
| `gate.allowedHosts` | 명시적 탐색 호스트 허용 목록; 기본은 루프백 호스트 |
| `gate.baselinePath` | 검토한 schemaVersion 2 베이스라인; 기본 `null` |
| `gate.manualVisualReview` | 기본 `true`; 전체 자동 검사 통과 후에도 사람이 검토 |
| `sot.path` | 선택적 프로젝트 정본 경로; 존재 여부만 검사하며 내용을 자동 파싱하지 않음 |
| `reportDir` | 기본 `artifacts/ui-refiner` |

정책의 폰트·크기·예외는 승인된 정본과 일치시켜야 합니다. 에이전트가 디자인 문서를 읽어야 하며 CLI가 문서에서 정책을 추론하지는 않습니다. 신뢰할 수 있는 앱 URL을 사용하세요. 허용 목록 밖의 호스트와 URL 안의 인증 정보는 거부합니다.

## 3. 전체 검사와 변경 줄 검사

앱을 별도로 실행한 뒤 검사합니다.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`doctor`는 벤더 SHA-256·필수 경로·Node 실행 환경을 확인하고, Chromium을 실제 실행해 빈 페이지를 연 뒤 종료합니다. `doctor`와 `check`는 Chromium을 다운로드하지 않습니다.

정적 변경 범위를 좁혀 검사할 때는 다음을 사용합니다.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only --base origin/main
```

`--base`가 없으면 HEAD 대비 staged·unstaged 변경과 untracked 소스 파일을 포함합니다. 기준 ref가 있으면 그 ref 대비 커밋된 변경도 포함합니다. 중첩된 모노레포 앱에서도 경로를 설정 루트 기준으로 통일합니다. 설정된 정적 대상의 변경 후 줄만 검사하며, 삭제된 줄만으로 새 위반을 만들지는 않습니다.

**브라우저 검사는 여전히 설정된 전체 페이지와 상호작용 계획을 검사합니다.** 호환되는 `last-full-report.json`이 있으면 URL·로케일·정책 내용·상호작용 내용으로 기존의 안정적으로 식별된 브라우저 위반과 새 위반을 구분합니다. 기존 위반은 `existingBrowserDebt`로 계속 표시하지만 부분 범위 결과를 막지는 않습니다. 호환되는 전체 기준 결과가 없으면 브라우저 위반을 계속 강제합니다. 이 처리는 베이스라인을 작성하거나 승인하지 않으며, 전체 검사에서는 기존 위반도 계속 강제합니다.

### 상태와 종료 코드

| 상태 | 종료 | 의미 |
|---|---:|---|
| `PASS` | 0 | 전체 검사에 새 강제 위반이 없음; 수동 검토 비활성화 상태 |
| `REVIEW_REQUIRED` | 0 | 전체 자동 검사 통과; 사람이 시각·UX 검토해야 함 |
| `FAIL` | 1 | 새 강제 위반 발견 |
| `ERROR` / `INCOMPLETE` | 2 | 도구·환경 오류 또는 필수 검사 범위 누락 |
| `SCOPED_PASS` | 3 | 변경 범위 통과; **전체 QA 승인이 아님** |

필수 엔진 중 하나를 비활성화하면 전체 PASS가 나올 수 없습니다. 부분 검사 통과 결과로 베이스라인을 만들 수 없으며, 최종 수용 전에는 전체 검사를 실행해야 합니다.

## 4. 브라우저 검사 범위와 증거 촬영

브라우저는 전체 시간·출력 상한이 있는 별도 프로세스에서 실행됩니다. `browser.timeoutMs`는 개별 탐색·감사 단계 제한입니다. `browser.sessionTimeoutMs`를 설정하면 전체 제한을 명시할 수 있고, 없으면 뷰포트·테마 조합, 계획된 상호작용, 촬영 여유를 반영해 **최대 600000 ms** 범위에서 산정합니다. 각각 유효한 여러 단계의 합이 한 단계 제한을 넘었다는 이유만으로 조기 종료하지 않습니다.

초기·상호작용 상태 검사와 이미지 촬영은 같은 브라우저 세션·로케일·reduced-motion 설정을 공유합니다. 촬영은 선택 사항이며 **상태별 최대 5개 고유 위반 요소 크롭**을 생성합니다. 불가능한 크롭에는 이유를 기록합니다. 중단된 실행 뒤에는 현재 리포트의 artifact 목록을 기준으로 판단하세요.

정렬·레이아웃/컨트롤 간격·중첩 반경·컨트롤 inset의 검사 대상 수를 표시합니다. 대상 0개는 `not-tested`, 정보 누락은 `unknown`입니다. 검사가 필요한 곳에는 해당 `data-ui-*` 계약 마커를 추가해야 합니다. PASS는 마커가 없는 계약까지 검사했다는 뜻이 아닙니다.

클릭 가능한 일반 요소의 키보드 포커스·시맨틱 역할 누락은 인라인 `onclick`, DOM `onclick` 프로퍼티(React 방식 포함), `data-ui-clickable`, Chromium CDP 직접 click 리스너로 확인합니다. CDP는 **상태별 최대 500개 보이는 비네이티브 후보**를 검사하며, `cursor:pointer`를 문서 순서보다 먼저 봅니다. 알려진 프레임워크 이벤트 위임 루트는 제외합니다. 제한된 검사와 CDP 사용 가능 여부를 리포트에 공개하며, 위임된 자식 요소와 상한 밖 후보는 명시적 마커·상호작용 계획이 필요합니다. 실제 Enter/Space 동작은 상호작용 계획으로 검증하세요. [examples/interactions.json](examples/interactions.json)을 참고하세요.

## 5. 리포트와 수정 핸드오프

결과는 `reportDir`에 생성됩니다.

| 파일 | 내용 |
|---|---|
| `report.json` | 전체 위반·대상, 실제/기대 값, 원본 브라우저 상세, blocking 플래그, 그룹·범위·검사 커버리지 |
| `report.md` | 읽기 쉬운 원인별 위반, 게이트 상태와 검사 범위 |
| `AGENT_HANDOFF.md` | 우선순위 수정 작업, 짧은 대상 힌트와 직전 실행 대비 변화 |
| `previous-report.json` | 호환되는 범위를 비교하기 위한 직전 실행 결과 |
| `last-full-report.json` | 부분 검사에서 기존 브라우저 위반을 구분하는 완료된 전체 기준 결과 |
| `lintapple.raw.json` | 원본 렌더링 검사 결과 |
| `render-*.png` | 선택적 동일 세션 상태 이미지·요소 크롭 |
| `VISUAL_REVIEW.md` | 사람 또는 외부 비전 모델을 위한 advisory 검토 패킷 |

핸드오프는 **실제 blocker → advisory 오류 → 경고** 순서입니다. 같은 원인을 대상·뷰포트·상태에 걸쳐 묶으므로 상속 폰트를 자식 요소마다 고치는 대신 원본 지정부터 수정할 수 있습니다. 의미 기반 대상은 identity JSON 대신 `h1 "Unlock…"` 같은 힌트로 표시합니다.

수정 목록은 약 **6 KiB**로 제한합니다. 생략된 blocker가 있으면 그룹 수와 규칙명을 명시합니다. 전체 셀렉터·정확한 identity·나머지 그룹은 모두 `report.json`에 보존하며, 수정 완료 전에 확인해야 합니다.

호환되는 연속 실행은 해결·추가·유지 identity를 기록합니다. 에이전트 지침은 한 수정 작업의 수정/재검사를 두 번까지로 제한하지만, CLI가 자율 수정 루프를 실행하지는 않습니다. 비전 모델의 의견은 advisory이며 게이트 상태를 바꾸지 않습니다. 시각적 수용은 사람이 판단합니다.

## 6. 베이스라인 schemaVersion 2

설정 파일은 `schemaVersion: 1`, 회귀 베이스라인은 **`schemaVersion: 2`**입니다.

새로운 **전체** 검사 결과에서 생성합니다.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.v2.json
```

억제 목록을 검토한 뒤 `gate.baselinePath`를 지정하세요. v1 베이스라인은 거부하며 버전 숫자만 바꿔 안전하게 전환할 수 없습니다. 생성 명령은 기존 출력 파일을 덮어쓰지 않습니다.

- 정적 identity는 상대 소스 파일과 고유한 소스 행 내용을 사용하며, 줄번호·진단 메시지는 제외합니다. 비어 있거나 반복되는 앵커는 베이스라인에 넣을 수 없습니다.
- 브라우저 identity는 고유 앱 마커 또는 고유한 범위 내 의미 식별자, 뷰포트 크기·테마·상태·의사 요소·관련 대상을 사용합니다. 측정값과 `nth-of-type` 위치는 제외합니다.
- React useId·Radix·Headless UI의 알려진 자동 ID는 고유하더라도 앵커에서 제외합니다. `:r0:`, `«r0»` / `«R1»`, `_r_0_` 등이 해당합니다. 명시적 `data-ui-id`, `data-testid`, `data-qa` 마커를 우선하세요.
- 모호한 identity는 계속 표시하며 억제할 수 없습니다. `excludedFindings`에 제외 수를 기록합니다. 소스 내용·의미가 바뀌면 새 identity가 생길 수 있습니다.

검사가 위반을 자동으로 베이스라인에 추가하거나 정책을 약화하지 않습니다.

## 7. 에이전트 스킬과 팀용 훅

앱 루트에서 선택적으로 설치합니다.

```sh
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
```

도구가 프로젝트 안에 있으면 기존 Claude 설정을 보존하면서 `CLAUDE_PROJECT_DIR`을 사용하는 프로젝트 상대 PostToolUse 훅을 추가합니다. wrapper도 유지보수되는 훅을 상대 경로로 import하므로 체크아웃을 옮겨도 개인 절대 경로가 박히지 않습니다. 개인 외부 체크아웃은 `.claude/settings.local.json`과 로컬 `UI_REFINER_HOME`을 사용하고 공유 설정은 유지합니다.

다른 호스트는 생성된 `.agents/skills/ui-refiner-agent/hook-registration.json`을 지원되는 훅 UI에 등록하세요. 지원되지 않는 Codex 설정 필드를 임의로 만들지 않습니다. 훅은 편집된 정적 줄만 검사하며 전체 게이트가 아닙니다. 설치기는 기존 스킬을 덮어쓰지 않으므로 갱신 전 설치 사본을 검토해야 합니다.

런타임 기본값은 `static.auditPath: "bundled"`입니다. 선택적 suta 지침 사본은 다음으로 복사할 수 있습니다.

```sh
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
```

Doctor는 지침 사본의 불일치를 알립니다. 명시적인 구형 감사 경로는 유지하므로, 오래된 `.agents/skills/suta/scripts/audit.mjs` 설정은 검토 후 `"bundled"`로 바꾸세요.

## 8. 업스트림 유지보수와 출처

```sh
node tools/ui-refiner/bin/ui-refiner.mjs upstream check
node tools/ui-refiner/scripts/sync-vendor.mjs --suta <40-character-SHA>
node tools/ui-refiner/scripts/sync-vendor.mjs --lintapple <40-character-SHA>
```

`upstream check`는 파일 변경 없이 고정 커밋과 업스트림 HEAD를 비교합니다. `sync-vendor`는 기록되지 않은 로컬 벤더 수정을 거부하고, 요청한 소스를 임시 영역에 가져와 검토된 패치를 재적용하고 원본/현재 해시를 기록한 뒤 단위 테스트와 UI·CLI 브라우저 스모크를 실행합니다. 패치 충돌·검증 실패 시 기존 벤더 소스와 manifest를 복구합니다. Chromium 설치·커밋·push·업그레이드 승인은 수행하지 않습니다.

새 엔진 변경은 재적용 패치에 보존하고 검토된 manifest를 갱신하세요. 라이선스·고정 커밋: [vendor/UPSTREAM.json](vendor/UPSTREAM.json), [licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md), [suta MIT 라이선스](vendor/suta/LICENSE), [lintapple MIT 라이선스](vendor/lintapple/LICENSE). 원본 프로젝트: [suta](https://github.com/Guksu/suta), [lintapple](https://github.com/gholtzap/lintapple).

## 9. 개발과 검증

UI Refiner 저장소 루트에서 실행합니다.

```sh
npm ci
npm test
npx playwright install chromium
npm run smoke:ui
npm run smoke:gate
npm run smoke:review2
```

CI는 단위·계약 테스트, 실제 Chromium UI·CLI 검사, 세션 타임아웃 검사, 고정 벤더 동기화 검증을 실행합니다. 정상/위반 페이지, 모노레포 변경, 이동한 체크아웃의 훅, 자동 ID, 1,600행 목록 뒤의 pointer 우선 탐지, 동일 상태 이미지와 요소 크롭을 검증합니다.

실제 검사 출력과 해시·출처는 `test/fixtures`에 보존하고, 스모크의 실제 출력을 검토된 수정 정보 계약과 비교합니다. CI는 `upstream-contracts` 증거도 업로드합니다. 계약이 바뀌면 fixture를 자동으로 재생성하지 않고 검토해야 합니다. [CI 워크플로](.github/workflows/ci.yml)와 [구현 보고서](IMPLEMENTATION_REPORT_KO.md)를 참고하세요.
