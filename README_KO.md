# UI Refiner v0.3.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner는 일반 DOM 웹앱을 대상으로 **suta의 소스 검사·디자인 지침**과 **lintapple의 실제 렌더링 기반 레이아웃·접근성·상호작용 검사**를 결합합니다. 개발자와 코딩 에이전트가 사용할 수정 증거와 결정적인 품질 게이트를 제공합니다.

suta의 고정된 전체 스킬 카탈로그와 57개 패턴, 유지보수되는 lintapple 런타임 소스가 포함됩니다. UI 자동 생성, 자동 코드 수정, 비전 모델 호출, 출시 승인은 수행하지 않습니다. Godot UI·Phaser Canvas·게임 HUD는 검사 대상이 아닙니다.

## 빠른 시작: 무엇을 위한 도구인가

UI Refiner는 코딩 에이전트(Claude Code, Codex)가 **AI가 만든 티가 나지 않는 웹 UI를 만들고**, **기존 페이지를 점검해 더 나은 디자인을 제안**하도록 돕습니다. 설정 없는 `scan`부터 쓰고, 아래 절의 정책 강제 게이트는 필요할 때만 씁니다.

```sh
npm ci && npx playwright install chromium
node bin/ui-refiner.mjs scan https://your-site.example --out ui-refiner-scan
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --source src      # 개발 서버 + 소스 정적 검사
```

`scan`은 1440px·390px로 페이지를 열어 전체 스크린샷을 저장하고 `DESIGN_REVIEW.md`·`scan.json`을 씁니다. 실제 렌더링에서 측정한 신호(보라 그라데이션 히어로, 그라데이션 제목, 유리 카드, 색 글로우, 이모지 아이콘, 똑같은 아이콘 카드 3개, 제목 위 알약 배지, 전부 가운데 정렬, 프레임워크 기본 강조색, 개성 없는 서체, 상투 문구, 반복 CTA, `transition: all`)로 **AI 티 지수**(0–100, 휴리스틱)를 내고, 신호마다 이유와 구체적 수정 방향을 줍니다. 대비·라벨·가로 넘침 같은 기본 품질도 함께 측정합니다. 직접 고른 웹폰트·실제 이미지·풍부한 글자 크기 단계가 있으면 점수를 낮춥니다. 결과는 advisory이며 지정한 어떤 호스트든 검사합니다. `examples/ai-slop-landing.html`은 100, 기본 데모는 6, 작성 시점의 stripe.com·linear.app·github.com·toss.im·apple.com/kr은 3–21이었습니다.

에이전트 사용: Claude Code 플러그인으로 설치(`/plugin marketplace add prentice7725/ui-refiner`)하거나, 앱에서 `node tools/ui-refiner/scripts/install-agent-skill.mjs .`을 실행해 `.claude/skills`(Claude Code)와 `.agents/skills`(Codex)에 스킬을 둡니다. 스킬([skills/ui-refiner-agent/SKILL.md](skills/ui-refiner-agent/SKILL.md))은 **만들기**와 **점검** 절차를 정의하고, 심화 게이트 절차는 [reference/quality-gate.md](skills/ui-refiner-agent/reference/quality-gate.md)에 있습니다.

## 1. 요구사항과 설치

**Node.js 22.18 이상**, npm, Git과 명시적으로 설치한 Playwright Chromium이 필요합니다. 런타임 npm 의존성은 `axe-core@4.14.0`, `playwright@1.63.0`, `pixelmatch@7.2.0`, `pngjs@7.0.0`으로 고정됩니다.

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
| `browser.routes` | 단일 URL 대상을 대체하는 이름 있는 라우트 1–50개; 경로는 `browser.url` 기준 |
| `browser.policyPath` | 프로젝트 정책; 기본 `ui-policy.json` |
| `browser.ready` | 선택적 준비 완료 셀렉터가 보일 때까지 대기; 기본 `null` |
| `browser.interactionsPath` | 선택적 상호작용 계획 JSON; 기본 `null` |
| `browser.captureScreenshots` | 같은 세션의 상태 이미지·요소 크롭; 기본 `false` |
| `browser.captureAriaSnapshots` | 같은 상태의 접근성 트리 YAML·advisory 구조 비교; 기본 `false` |
| `browser.ariaSnapshotMasks` | 명시적 동적 문구 정규식 마스크; 기본 `[]` |
| `browser.renderedMetrics` | 선택적 렌더링 디자인 지표; advisory 전용, 기본 `false` |
| `browser.timeoutMs` | 탐색·감사 단계별 제한; 기본 `120000` ms |
| `browser.sessionTimeoutMs` | 독립적인 전체 세션 제한; 기본 `null`이면 자동 산정 |
| `browser.routeTimeoutMs` | 라우트 worker 상한; 기본 `null`이면 남은 전체 시간의 공정한 배분 |
| `gate.maxStaticWarnings` | 선택적 정적 경고 상한; `null`이면 경고가 blocker가 되지 않음 |
| `gate.allowedHosts` | 명시적 탐색 호스트 허용 목록; 기본은 루프백 호스트 |
| `gate.baselinePath` | 검토한 schemaVersion 2 베이스라인; 기본 `null` |
| `gate.valueExceptionsPath` | 검토된 정확한 디자인 값 예외 JSON; 기본 `null` |
| `gate.manualVisualReview` | 기본 `true`; 전체 자동 검사 통과 후에도 사람이 검토 |
| `sot.path` | 선택적 프로젝트 정본 경로; 존재 여부만 검사하며 내용을 자동 파싱하지 않음 |
| `visual` | 선택적 같은 세션 이미지 회귀검사; enabled=false, mode=advisory; 별도 승인 이미지 저장소 |
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

### 리포트 비교 호환성

리포트는 finding 변화·기존 브라우저 부채·ARIA 증거의 버전 있는 `comparisonContexts`를 기록합니다. 기존 `comparisonContext`는 finding 컨텍스트의 별칭으로 유지합니다. finding ID와 baseline schemaVersion 2는 바꾸지 않습니다.

단일 페이지와 명시적 라우트 모두 실제 적용되는 URL·ready·상호작용 내용, 로케일·정책·고정 엔진 메타데이터로 비교합니다. `browser.ready`를 바꾸면 이전 결과 비교와 기존 부채 억제를 무효화합니다. 라우트가 명시적으로 덮어쓴 공통 ready/plan은 비교에 영향을 주지 않습니다. 비교 호환성에는 절대 URL을 유지하며, 베이스라인 ID의 호스트·포트 독립성과 구분합니다.

| 변경 | Finding 비교 | 기존 브라우저 부채 | ARIA 비교 |
|---|---|---|---|
| 실제 URL/ready/plan, 로케일, 정책, 브라우저 엔진 | 초기화 | 초기화 | 초기화 |
| `renderedMetrics` | 초기화 | 유지 | 유지 |
| ARIA 마스크 또는 `captureAriaSnapshots` | 유지 | 유지 | 초기화 |
| `captureScreenshots`, 시간 예산, 수동 검토 설정 | 유지 | 유지 | 유지 |
| 정적 대상/audit 경로/엔진 | 초기화 | 유지 | 유지 |

범위가 바뀌거나 필수 검사가 미완료이면 해결된 finding·제거된 ARIA로 비교하지 않습니다. 기존 부채는 완료된 호환 전체 리포트만 참조합니다. 새 메타데이터 없는 이전 리포트는 이유를 표시하고 비교를 거부하므로 전체 검사를 한 번 실행해 참조를 갱신하세요. 검토된 기존 v2 베이스라인은 계속 사용할 수 있습니다. JSON의 `diff.reason`·`ariaDiff.reason`·`browserReference.reason`에 비교 불가 이유를 기록하고 핸드오프·ARIA 요약에도 표시합니다.

### 상태와 종료 코드

| 상태 | 종료 | 의미 |
|---|---:|---|
| `PASS` | 0 | 전체 검사에 새 강제 위반이 없음; 수동 검토 비활성화 상태 |
| `REVIEW_REQUIRED` | 0 | 설정한 강제 검사 통과; advisory 이미지·사람 시각 검토 필요 |
| `FAIL` | 1 | 새 강제 위반 발견 |
| `ERROR` / `INCOMPLETE` | 2 | 도구·환경 오류 또는 필수 검사 범위 누락 |
| `SCOPED_PASS` | 3 | 변경 범위 통과; **전체 QA 승인이 아님** |

필수 엔진 중 하나를 비활성화하면 전체 PASS가 나올 수 없습니다. 부분 검사 통과 결과로 베이스라인을 만들 수 없으며, 최종 수용 전에는 전체 검사를 실행해야 합니다.

## 4. 브라우저 검사 범위와 증거 촬영

브라우저는 전체 시간·출력 상한이 있는 별도 프로세스에서 실행됩니다. `browser.timeoutMs`는 개별 탐색·감사 단계 제한입니다. `browser.sessionTimeoutMs`를 설정하면 전체 제한을 명시할 수 있고, 없으면 뷰포트·테마 조합, 계획된 상호작용, 촬영 여유를 반영해 **최대 600000 ms** 범위에서 산정합니다. 각각 유효한 여러 단계의 합이 한 단계 제한을 넘었다는 이유만으로 조기 종료하지 않습니다.

초기·상호작용 상태 검사와 이미지 촬영은 같은 브라우저 세션·로케일·reduced-motion 설정을 공유합니다. 촬영은 선택 사항이며 **상태별 최대 5개 고유 위반 요소 크롭**을 생성합니다. 불가능한 크롭에는 이유를 기록합니다. 중단된 실행 뒤에는 현재 리포트의 artifact 목록을 기준으로 판단하세요.

PNG는 실행별 `images-<runId>/` 아래에 내용 SHA-256을 포함한 이름으로 저장하므로 다음 검사에서 이전 이미지를 덮어쓰지 않습니다. `imageArtifacts`·`image-artifacts.json`에 artifact ID·해시·바이트 수·라우트/상태/뷰포트/테마/로케일을 기록하고, 각 브라우저 finding의 `imageEvidence`가 상태 이미지와 일치하는 요소 크롭을 연결합니다. 기존 `artifacts`·`captures[].image`는 계속 `reportDir` 상대 경로이며 새 하위 디렉터리를 지원해야 합니다. 리포트 공유 시 참조된 디렉터리도 함께 복사하세요.

현재·직전·마지막 전체 리포트와 finding diff의 이미지 참조가 해당 실행의 이미지 묶음을 보호합니다. 보고서·이미지 목록 파일을 각각 임시 파일로 작성해 원자적으로 교체한 뒤, 명시적 소유 표시가 있고 참조되지 않는 묶음만 정리합니다. 수동 파일·알 수 없는 내용·심볼릭 링크가 있으면 삭제하지 않으며 기존 평면 PNG도 건드리지 않습니다. 중단되어 아직 게시되지 않은 실행은 최대 브라우저 예산에 1분을 더한 11분의 유예를 둡니다. 무제한 기록 보관이 아니라 참조 기반 보존이므로 동시 검사나 장기 보관에는 별도 `reportDir`를 사용하세요. 참조된 실행 디렉터리는 통째로 유지합니다. 요청한 상태 이미지 촬영 실패는 ERROR이며 크롭 불가는 이유를 남깁니다. 촬영 실패 결과가 마지막 완료된 전체 리포트를 대체하지 않습니다.

정렬·레이아웃/컨트롤 간격·중첩 반경·컨트롤 inset의 검사 대상 수를 표시합니다. 대상 0개는 `not-tested`, 정보 누락은 `unknown`입니다. 검사가 필요한 곳에는 해당 `data-ui-*` 계약 마커를 추가해야 합니다. PASS는 마커가 없는 계약까지 검사했다는 뜻이 아닙니다.

클릭 가능한 일반 요소의 키보드 포커스·시맨틱 역할 누락은 인라인 `onclick`, DOM `onclick` 프로퍼티(React 방식 포함), `data-ui-clickable`, Chromium CDP 직접 click 리스너로 확인합니다. CDP는 **상태별 최대 500개 보이는 비네이티브 후보**를 검사하며, `cursor:pointer`를 문서 순서보다 먼저 봅니다. 알려진 프레임워크 이벤트 위임 루트는 제외합니다. 제한된 검사와 CDP 사용 가능 여부를 리포트에 공개하며, 위임된 자식 요소와 상한 밖 후보는 명시적 마커·상호작용 계획이 필요합니다. 실제 Enter/Space 동작은 상호작용 계획으로 검증하세요. [examples/interactions.json](examples/interactions.json)을 참고하세요.

### 다중 라우트·ARIA 증거·렌더링 지표

기존 `browser` 객체의 다른 설정은 유지하고 다음 필드를 추가하세요.

```json
{
  "routes": [
    { "name": "home", "url": "/" },
    { "name": "settings", "url": "/settings", "ready": "[data-app-ready]", "interactionsPath": null }
  ],
  "captureAriaSnapshots": true,
  "renderedMetrics": true
}
```

라우트는 중복 없는 안전한 이름과 절대 HTTP(S) URL 또는 루트 상대 경로를 사용합니다. `ready`·`interactionsPath`를 생략하면 공통 설정을 상속하고, `null`이면 해당 라우트에서는 사용하지 않습니다. 라우트별로 격리된 시간 제한 worker/브라우저를 실행하고 뷰포트/테마 컨텍스트를 깨끗하게 유지합니다. 전체 시간 예산은 라우트 수를 포함합니다. 요청한 라우트 하나라도 실패하면 전체는 ERROR이지만 완료된 실행·상태의 finding과 다른 라우트 결과는 `routeResults`·원본 runs에 남습니다. worker 시간 초과 시 그 worker의 버퍼에 있던 부분 상태는 유실될 수 있으나 먼저 완료된 worker 결과는 보존합니다. 목록에 있는 라우트만 검사하며 앱 전체를 자동으로 검사하지 않습니다. Storybook URL도 명시적으로 나열할 수 있습니다. 라우트 사이에 인증 상태·쿠키를 공유하지 않습니다.

내비게이션 요청 전에 호스트를 검증합니다. 리다이렉트는 따라가지 않고 거부하므로 최종 URL을 직접 설정하세요. 이 감사 세션에서는 서비스 워커를 비활성화합니다. 외부 하위 리소스는 내비게이션 허용 목록의 대상이 아니며 일반 네트워크 샌드박스는 아닙니다.

다중 라우트 지문에는 이름과 `pathname + search`만 포함하고 origin·호스트·포트·fragment를 제외하며 기존 단일 URL 식별자는 유지합니다. 명시적 라우트로 전환하면 새 전체 베이스라인을 검토하세요. 절대 URL 지문을 사용한 기존 다중 라우트 베이스라인도 한 번 재생성해야 합니다. 해시만 있는 항목은 안전하게 이행할 수 없습니다. 베이스라인 schemaVersion은 2를 유지합니다. 이미지 이름에 라우트를 포함합니다. 선택적 ARIA YAML 파일명에는 내용 해시도 넣어 이전 증거를 보존합니다. 호환되는 이전 실행과의 `ariaDiff`는 변경/추가/제거/유지된 차원과 `previousFile`·`file`을 보여줍니다. 해시 요약에 줄 번호가 있는 YAML 텍스트 설명을 추가해 report.json/report.md와 에이전트 핸드오프에 제공합니다. ARIA 변화는 advisory이며 전체 증거는 연결된 YAML 쌍에서 확인합니다. 촬영은 선택 기능이고 상태당 2 MB 제한이며 요청한 촬영 실패는 ERROR입니다. 이미지·접근 가능한 이름에 민감한 앱 내용이 포함될 수 있으므로 공유 전에 확인하세요.

렌더링 지표는 현재 뷰포트의 보이는 상단 fixed/sticky 영역(중첩은 한 번 계산), 채운 버튼, 반복 버튼/링크 이름·목적지, 계산된 글자/배경/테두리 색의 대략적인 15도 유채색 hue 버킷을 기록합니다. DOM 요소 최대 10000개를 검사하고 제한된 범위를 표시합니다. 반복 동작이나 여러 채운 버튼은 의도된 UI일 수 있습니다. 관련 항목은 **advisory 전용**이며 게이트를 막거나 베이스라인에 들어가지 않고 접근성 검사를 약화하지 않습니다. hue 수는 검토 자료이지 강제 색상 상한이 아니며 그라데이션·이미지·완전한 지각 색상 분석은 대상 밖입니다.

지표의 동작 이름은 DOM 라벨/텍스트 근사치이며 완전한 접근 가능한 이름 알고리즘은 아닙니다. 의미 증거는 ARIA YAML을 확인하세요. 가시성은 브라우저 `checkVisibility`와 뷰포트 경계로 판단하고 가림까지 모델링하지 않습니다. 대상 샘플은 항목당 10개, 반복 동작 그룹은 20개로 제한하며 전체 수와 제한값은 기록합니다.

`browser.routeTimeoutMs`로 worker별 상한을 지정할 수 있습니다. 기본값은 남은 전체 시간을 미실행 라우트에 공정하게 나눈 값입니다. 전체 600000 ms 상한은 유지하므로 200회 실행이면 오버헤드 전에도 실행당 약 3000 ms뿐입니다. 리포트에 실제 배정·평균 예산을 표시합니다. 느리거나 큰 목록은 나누어 검사하고 부분 완료를 PASS로 취급하지 마세요. 브라우저 출력은 배치 전체 20 MB로 제한합니다.

채운 버튼은 가장 가까운 불투명 조상 배경과 계산된 대비가 1.5:1 이상일 때 셉니다. 반투명 조상 층은 합성합니다. 같은 색 ghost 버튼과 대비가 약한 기본 컨트롤을 제외하는 디자인 근사 지표입니다. 그라데이션·이미지·캔버스 배경을 알 수 없으면 채움으로 단정하지 않고 unknown으로 기록합니다. 상단 고정 수에서는 dialog·명시적 backdrop 범위와 뷰포트 절반 이상을 덮는 요소를 제외합니다.

알려진 동적 문구만 `browser.ariaSnapshotMasks`로 마스킹할 수 있습니다. 기본 `[]`, 최대 20개 정규식이며 `g/i/m/u` 플래그만 허용하고 기본은 `g`입니다. 예를 들어 `browser`에 다음 필드를 추가합니다.

```json
{
  "ariaSnapshotMasks": [
    {
      "pattern": "\\d{2}:\\d{2}:\\d{2}",
      "flags": "g"
    }
  ]
}
```

마스킹된 YAML을 저장하고 해시를 계산합니다. 설정하지 않은 라벨·역할 변경은 계속 표시합니다. 의미 있는 수량이나 구조를 지우는 광범위한 패턴은 피하세요. 마스크 변경 시 비교 컨텍스트가 새로 시작됩니다. 리포트를 쓴 뒤 도구가 만든 미참조 ARIA 파일만 정리하고 현재·직전 리포트, 비교 쌍, 마지막 전체 검사 참조의 증거는 보존합니다. 수동 파일은 건드리지 않습니다.

### 읽기 쉬운 ARIA 변경 설명

`browser.captureAriaSnapshots`를 켠 호환 실행은 변경/추가/제거된 스냅샷 차원을 YAML 텍스트 편집으로 설명합니다. `ariaDiff.changed[].textDiff`(added/removed도 동일)는 unified hunk·전후 줄 위치·oldFile/newFile·algorithm·제한·잘림 이유를 기록합니다. 변경 항목에는 previousSha256/previousBytes도 보존하며 `ariaDiff.textSummary`는 compared/unavailable/notGenerated/truncated 수를 표시합니다. 비교 호환성 해시와 finding/baseline ID는 유지하고, 기존처럼 마스크 변경 시 ARIA 비교를 초기화합니다. 텍스트 설명은 보고서 쓰기 시 생성합니다.

읽는 파일의 일반 파일 여부·2 MB 스냅샷 상한·저장 해시·확인 가능한 바이트 수를 검증합니다. 과거 증거가 없거나 일치하지 않으면 설명에 unavailable 이유를 남기며 변화 없음으로 해석하지 않습니다. 요청한 브라우저 캡처 실패는 기존대로 ERROR입니다. YAML 문법을 파싱하거나 의미/WCAG 위반을 판정하지 않고 텍스트를 비교합니다. 이름·역할·선택 상태 변화의 줄 위치를 확인할 수 있으며 실제 대비·키보드 규칙과 사람 시각 검토 요구는 독립적으로 유지합니다.

설명당 생성 텍스트는 120줄/12000바이트, 한 줄은 2000바이트까지입니다. 배치는 최대 16건을 시도하고 출력 600줄/64000 텍스트 바이트로 제한합니다(JSON 메타데이터 제외). 줄 매칭 계산량이 크면 bounded-replacement 편집으로 전환하며 결과가 덜 간결할 수 있습니다. 잘린 줄/hunk와 이유를 명시하고 전체 YAML 링크를 유지합니다. report.md는 최대 8건/24000 발췌 바이트, AGENT_HANDOFF.md는 2건/6000까지 표시합니다. TRUNCATED 발췌는 적용 가능한 패치로 사용하지 않습니다. 변경 없는 스냅샷은 텍스트를 다시 읽지 않습니다.

`npm run smoke:aria`는 실제 Chromium의 이름/역할/선택 상태/추가/삭제, 시간 마스크 안정성, 이전 파일 보존·누락 이유, 대비·키보드 결함 대조를 검증합니다. CI는 `artifacts/upstream-contracts/aria-text.report.json`과 옆 `aria-text-evidence/`에 YAML·Markdown 비교 증거를 보존합니다.


### 계획한 검사 범위와 정상/결함 벤치마크

`report.json`의 브라우저 stage에 있는 `inspectionScope`는 설정 route × viewport × colorScheme × initial/이름 있는 state를 나열합니다. 요청·시작 확인·완료·실패·미실행·확인 불가(unknown)를 집계하며 completionRate의 분모는 설정한 계획뿐입니다. 발견하지 않은 앱 페이지는 포함하지 않습니다. 상호작용 중간 스냅샷은 intermediateStates로 분리합니다. 완료는 결함 유무와 관계없이 검사와 요청 증거 처리가 끝났다는 뜻입니다. 강제 종료 worker가 반환하지 않은 진행 상태는 unknown입니다. 계획 파일 로드 실패 시 planComplete=false이며 누락된 이름 있는 상태의 분모는 확정되지 않습니다. 부분 실패에서도 완료 finding을 보존하고 ERROR/종료 코드 2 및 baseline 생성 금지를 유지합니다.

규칙 대상 범위는 계획 완료율과 별개입니다. 대상 0은 not-tested, null·누락·유효하지 않은 계측값은 unknown이며 tested로 세지 않습니다. 제외 명세는 axe 대비 검사, 선택된 axe 접근성 규칙과 자체 규칙을 구분하며 전체 WCAG 검사를 의미하지 않습니다. iframe 내부와 shadow root는 문서 범위 검사에서 제외하고 명시적 상호작용은 주 문서의 대상만 지원합니다. 위임 이벤트와 후보 상한이 있는 직접 리스너 탐색에는 명시적 마커·계획이 필요합니다.

고정 Chromium 설치 후 `npm run benchmark:scope`를 실행합니다. 폰트 정책·접근 가능한 이름·라벨·대비·가로 overflow·텍스트 clipping을 정상/결함 쌍의 expected label과 대조합니다. iframe·open Shadow DOM·위임 이벤트 경계 probe는 별도로 검증합니다. CI는 label·실제 finding·일치 여부·scope·TP/FP/FN을 `artifacts/upstream-contracts/scope-benchmark.json`에 보존합니다. 동일 라벨 인스턴스의 중복 탐지는 한 번만 세고 경계 probe는 정확도 분모에서 제외하며 분모 0은 null입니다. 이 작은 표본의 수치를 제품 전체 정확도나 성능으로 해석하지 않습니다. 기존 상호작용·라우트 실패·시간 초과·호환성·증거 스모크도 계속 실행합니다.


### 상태 시나리오와 명시적 Storybook 라우트

`npm run demo:states`로 5173 포트의 `/ko`, `/ja`를 실행합니다(`UI_REFINER_DEMO_PORT`로 변경). 페이지에 실제 KO/JA 번역 데이터를 넣었습니다. `examples/state-scenarios/routes.json`에서 필요한 항목을 `browser.routes`로 복사하고 `browser.url`을 fixture 서버 origin으로 설정합니다. interactions 경로는 프로젝트 루트 기준이므로 다른 앱에서는 예제를 복사하거나 경로를 수정합니다. 각 실행의 locale도 맞춰 설정합니다. 브라우저 locale 하나로 앱을 번역하거나 라우트별 locale을 별도로 지정하는 것은 아닙니다. 기존 interactions/config 형식을 그대로 사용합니다.

KO/JA JSON 예제는 폼 검증 오류·모달 열기/닫기·빈 목록·loading → ready·긴 문구 줄바꿈을 검사합니다. Enter/Space는 서로 다른 결과 텍스트로, 모달은 포커스 가두기·Escape·opener로 포커스 복귀로 검증합니다. 모든 이름 있는 상태는 visible/hidden 또는 정확한 텍스트 ready 계약을 가집니다. 통제된 로딩 fixture는 “Release fixture data” 동작 전까지 데이터를 보류하며 임의 sleep 없이 실제 페이지 내용으로 ready를 확인합니다. 실제 앱은 이 fixture 제어 버튼 대신 앱의 준비 요소·데이터를 기다려야 합니다.

`npm run smoke:states`는 두 번역 × 두 viewport × light/dark를 실행하고 키보드/clipping 결함 대조 및 7개 이름 있는 상태 각각의 도달 실패를 검증합니다. 도달 실패는 ERROR/2이며 이전 완료 검사를 보존하고 이후 상태를 미실행으로 남기며 baseline 생성을 거부합니다. 기계 판독 결과는 `artifacts/upstream-contracts/state-scenarios.json`이고 참조한 ARIA YAML은 정상 보존 정리 전에 옆의 `state-scenarios-evidence/`에 복사합니다. 유한한 예제 검증을 앱 전체 커버리지나 성능 목표로 해석하지 않습니다.

알고 있는 Storybook 스토리는 `/iframe.html?id=states--ko&viewMode=story`처럼 문서 URL을 ready selector·interaction plan과 함께 routes로 직접 지정합니다. 데모의 같은 URL은 route/query 처리를 확인하는 로컬 fixture이며 실제 Storybook 설치가 아닙니다. 앱에서는 실제 story ID/URL을 사용해야 합니다. 자동 스토리 탐색·index 어댑터·로그인 자동화·라우트 사이 쿠키 공유는 추가하지 않았습니다. 실제 대상이 필요로 할 때 버전을 확인해 선택적 index 어댑터를 검토하며 Storybook을 의존성으로 넣지 않습니다.


### 선택적 이미지 시각 회귀검사

시각 비교는 기본 비활성이며 활성화 시 기본 advisory입니다. 기존 onState 브라우저 세션의 초기·상호작용 상태를 캡처하며 비교용 브라우저를 다시 열지 않습니다. 다음 최상위 설정을 추가하고 profile은 검토한 폰트/실행 이미지 식별자로 바꿉니다.

```json
{
  "visual": {
    "enabled": true,
    "mode": "advisory",
    "baselineDir": "ui-visual-baseline",
    "environmentProfile": "reviewed-fonts-and-execution-image-v1",
    "capture": "viewport",
    "threshold": 0.1,
    "maxDiffPixels": 0,
    "maxDiffRatio": 0,
    "masks": [],
    "stabilityAttempts": 3
  }
}
```

기존 browser.captureScreenshots의 원본 증거·크롭 캡처는 독립적으로 유지합니다. visual 캡처는 document.fonts.ready와 표시 이미지 decode를 기다리고 animation 비활성·caret 숨김·CSS pixel 스케일을 사용합니다. stabilityAttempts(2–5) 안에서 연속 두 PNG 바이트가 같아야 하며 안정화·리소스·캡처 실패는 ERROR입니다. capture는 viewport 또는 fullPage이며 PNG당 1600만 픽셀/32 MB로 제한합니다. 기존 session/route 시간·출력 상한을 유지하며 worker 시간 초과를 일치로 해석하지 않습니다.

profile은 통제된 폰트·테스트 데이터·실행 환경을 사용자가 명시하는 값이며 폰트 파일/컨테이너 자동 검증이 아닙니다. manifest는 OS/release/architecture·브라우저/Playwright/비교기/디코더 버전·DPR·locale·UTC/reduced-motion·ready/interactions·캡처/비교 옵션도 기록합니다. profile 없는 후보는 승인할 수 없습니다. 기록한 조건이 다르면 not-comparable이고 route/state/viewport/theme/locale/capture별 승인 이미지가 필요합니다. 기준 키에서 서버 origin/포트는 제외합니다. 자동 탐색·인증·앱 데이터 준비는 이 기능에 포함하지 않습니다.

check로 수집한 후보를 검토한 뒤 명시적으로 승인합니다.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs visual candidate --from artifacts/ui-refiner/report.json --out visual-candidate
# Review candidate PNGs, manifest dimensions, masks, environment and policy first.
node tools/ui-refiner/bin/ui-refiner.mjs visual approve --from visual-candidate/manifest.json --out ui-visual-baseline
```

후보 이미지는 보고서 보존 정리와 독립된 소유 디렉터리로 복사합니다. approve는 baselineDir의 이미지 manifest를 원자적으로 게시하며 이후 명시적 승인은 전체 이미지 집합을 교체하고 이전 manifest 소유 이미지 중 미참조 파일만 정리합니다. 수동 파일은 유지합니다. check는 승인 저장소를 읽기만 합니다. 기존 baseline create는 finding ID 억제용이며 이미지를 승인하지 않습니다. 후보 생성에는 전체 static/browser 완료와 요청 캡처가 필요합니다. enforce의 needs-baseline 결과에서도 후보를 만들 수 있지만 changed-only·캡처 실패에서는 거부합니다.

| visual 결과 | advisory | 명시적 enforce |
|---|---|---|
| 비활성 | not-requested | — |
| 승인 이미지 일치 | matched | matched |
| 이미지/크기 차이 | 검토 필요 | FAIL / 1 |
| 승인 이미지 없음 | needs-baseline·검토 필요 | INCOMPLETE / 2 |
| 환경/옵션 불일치 | not-comparable·검토 필요 | INCOMPLETE / 2 |
| 요청 캡처/파일/비교 실패 | ERROR / 2 | ERROR / 2 |

통제 환경의 반복 안정성과 승인 이미지를 검토한 뒤 mode를 enforce로 바꿉니다. 기존 DOM/소스 강제 결함은 독립적으로 계속 차단합니다. advisory 차이·미승인 상태를 matched로 표시하지 않으며 수동 검토 설정이 꺼져 있어도 REVIEW_REQUIRED를 표시합니다. 이미지 일치가 기존 사람 검토 요구를 해제하지 않습니다.

masks는 최대 20개 selector 문자열이며 각각 1–100개 요소와 표시 대상을 가져야 합니다. 대상 누락은 실패입니다. 불투명 magenta 마스크와 selector/index/viewport CSS box를 maskRegions에 기록하며 배경·패널을 자동 제외하지 않습니다. 테스트 데이터를 고정하거나 좁은 영역을 명시적으로 가리며 영역 밖 변화는 계속 탐지합니다. pixelmatch threshold(0–1)는 픽셀별 색 차이 허용값입니다. 허용 차이 픽셀 수는 max(maxDiffPixels, floor(totalPixels × maxDiffRatio))이며 기본값은 색 허용값/안티앨리어싱 처리 후 차이 0픽셀입니다. 크기가 달라도 resize하지 않고 different와 실제/기준 크기·이유를 표시합니다.

report.visual에는 상태별 actual/expected/diff의 불변 이미지 참조·픽셀 수/비율/허용값·안정화/마스크/환경·시간/용량 지표를 기록합니다. expected도 기준 저장소에서 해당 실행으로 복사하므로 이후 승인으로 과거 증거가 바뀌지 않습니다. 기존 실행별 이미지 보존 정리를 사용합니다. maxObservedWorkerRssBytes는 브라우저 자손을 제외한 worker RSS 표본이며 전체 프로세스 트리의 최고 메모리가 아닙니다. 기준 누락/실패는 이유를 남기고 enforce 전체 PASS로 처리하지 않습니다. visual 옵션은 자체 호환성 계약을 사용하며 finding/ARIA 비교를 초기화하지 않습니다.

npm run smoke:visual은 10회 통제 반복(초기/저장 상태), 마스크 안 정상 변화·레이아웃/잘림/마스크 밖 결함·크기 변경·기준 누락/환경 불일치·불안정/실패 캡처·CLI 명시적 승인·원본 증거 독립성을 검증합니다. CI는 artifacts/upstream-contracts/visual.report.json과 옆 visual-evidence/를 보존합니다. 표본과 소스/환경 정보를 함께 기록하며 제품 전체 정확도·p95·속도 개선 목표를 주장하지 않습니다. pixelmatch 7.2.0(ISC)·pngjs 7.0.0(MIT)을 정확히 고정하고 licenses/에 원문 고지를 보존했습니다.


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
| `images-<runId>/render-*.png` | 선택적 동일 세션 상태 이미지·요소 크롭; 실행별 불변 경로 |
| `image-artifacts.json` | 현재 실행의 이미지 목록·SHA-256·바이트 수·촬영 차원 |
| `render-*.aria.yml` | 선택적 동일 상태 ARIA 구조; 내용 해시로 이전 증거 보존 |
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

### 검토된 정확한 값 예외

`gate.valueExceptionsPath`에 프로젝트 상대 JSON 경로를 지정합니다. 형식은 [examples/value-exceptions.json](examples/value-exceptions.json)을 참고하되 예제 자체는 승인이 아닙니다. 각 항목은 `engine: "lintapple"`, `rule`, 정확한 기본형 `actual` 값과 비어 있지 않은 `reason`이 필요합니다. 선택적인 `route`·리포트의 정확한 `selector`로 범위를 좁힙니다. 지원 디자인 규칙은 `font-family`·`font-size`·`copy`·`root-background`입니다. 비슷한 폰트나 동등한 CSS 셀렉터가 아니라 `report.json`의 값과 셀렉터를 그대로 사용하세요.

일치한 항목은 증거와 `reviewedException` 이유를 유지하되 게이트를 막지 않습니다. 베이스라인에 자동으로 추가하지 않아 특정 값의 승인이 값과 무관한 억제로 확대되지 않습니다. 다른 값·범위는 계속 실패합니다. 접근성·상호작용 규칙은 이 방식으로 면제할 수 없습니다. 기존 정책의 `exceptions`는 선택자 전체의 규칙 제외이므로 더 넓고 다른 기능입니다.

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
npm run smoke:routes
npm run smoke:review4
```

CI는 단위·계약 테스트, 실제 Chromium UI·CLI 검사, 세션 타임아웃 검사, 고정 벤더 동기화 검증을 실행합니다. 정상/위반 페이지, 모노레포 변경, 이동한 체크아웃의 훅, 자동 ID, 1,600행 목록 뒤의 pointer 우선 탐지, 동일 상태 이미지와 요소 크롭을 검증합니다.

실제 검사 출력과 해시·출처는 `test/fixtures`에 보존하고, 스모크의 실제 출력을 검토된 수정 정보 계약과 비교합니다. CI는 `upstream-contracts` 증거도 업로드합니다. 계약이 바뀌면 fixture를 자동으로 재생성하지 않고 검토해야 합니다. [CI 워크플로](.github/workflows/ci.yml)와 [구현 보고서](IMPLEMENTATION_REPORT_KO.md)를 참고하세요.

## 10. 표준 출력과 오프라인 검토

JSON이 판정 원본입니다. 검사마다 스크립트·서버가 없는 `report.html`, `handoff.json`, 분량이 제한된 `AGENT_HANDOFF.md`를 생성합니다. 인계에는 경로·상태·화면 크기·테마, 실제/기대 값, 검증된 정적 소스 위치, 불변 PNG/ARIA 참조, 입력 해시와 재현 인수를 기록합니다. 저장된 설정은 실행 명령을 제공하고, 메모리 설정은 먼저 스냅샷을 저장해야 한다고 표시합니다. 재검사 전에 앱과 동일한 데이터·인증 상태를 준비하세요.

```sh
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format json
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format sarif
node bin/ui-refiner.mjs export html --from artifacts/ui-refiner/report.json --out review-bundle
node bin/ui-refiner.mjs export sarif --from artifacts/ui-refiner/report.json --out review.sarif
npm run smoke:export
```

`--format json|sarif|html|markdown`은 stdout 형식만 선택하며 기존 요약 출력은 기본값입니다. 모든 형식과 성공한 내보내기는 원본 종료 코드 0/1/2/3, 수동 검토와 부분 통과 구분을 유지합니다. 내보내기 자체 실패는 2입니다. JUnit은 실제 소비자가 생길 때까지 보류합니다.

`review-bundle/report.html`을 `file://`로 직접 열 수 있습니다. 새 대상 폴더만 허용하며 원본 JSON을 그대로 복사하고 현재·이전 PNG/YAML을 포함합니다. `evidence-manifest.json`에 누락·손상·해시가 없는 구형 증거를 표시합니다. 보고서 폴더 밖 경로나 심볼릭 링크 탈출은 거부합니다. 한도는 참조 2000개, 전체 256 MB, PNG당 32 MB, YAML당 2 MB입니다. HTML 미리보기는 finding 300개, 시각 상태 40개, ARIA 비교 20개, 서식 텍스트 12000자로 제한하고 생략을 표시합니다. 전체 데이터는 JSON에 남습니다. 소스 트리·호스팅·DB는 필요 없습니다.

SARIF 2.1.0의 주 소스 위치는 검사 시 실제 파일과 줄을 확인한 정적 결과만 포함합니다. 브라우저 선택자는 속성으로, PNG/YAML은 관련 증거로 기록하며 소스 경로를 만들지 않습니다. 원본 프로젝트와 보고서 기준 URI를 별도로 기록하므로 다른 환경에서는 기준 경로를 조정해야 합니다. 테스트는 고정된 OASIS 공식 스키마로 오프라인 검증하며 런타임 의존성을 추가하지 않습니다.

`smoke:export`는 고정 결함 두 종류를 최대 2회 예산 안에서 수정하고 전체 재검사하여 시도 수와 새 차단 결함을 기록합니다. 정해진 fixture 소비자 실험이며 자율 에이전트 실험 수는 0이므로 에이전트 수정 성공률을 주장하지 않습니다. 도구는 자동 수정·기준선 승인·PR 댓글을 수행하지 않습니다. 정책·SOT와 사람의 시각 승인을 유지하세요.

원본 증거 경로를 유지하면서 짧은 `e/` 별칭으로 HTML을 연결해 Windows 브라우저의 긴 경로 제한을 피합니다. 별칭 사본도 전체 바이트 예산에 포함합니다.

## 11. 제품 맥락·기능 보존·디자인 리뷰

선택 설정 `contextPath`는 제품 사실, 문서 참조, route별 화면 목적(`persuade`, `operate`, `read`, `experience`)을 구분한 schemaVersion 1 JSON을 가리킵니다. 없는 사실은 unknown으로 남기고 문서 해시와 사용자가 선언한 승인 상태를 기록합니다. 맥락에서 검사 정책을 자동 생성하거나 완화하지 않습니다. [예시](examples/project-context.json)와 [전체 사용법](docs/CONTEXT_PRESERVATION_REVIEW_KO.md)을 참고하세요.

`preservation: {enabled: true, enforcement: "advisory", baselinePath: null}`로 동일 상태의 링크·폼·필드·컨트롤·테스트 훅과 명시한 대상의 속성/문구/이름 및 루트 CSS 토큰을 기록합니다. 전체 캡처를 검토한 뒤 `preserve record --from report.json --out preservation-reference.json`으로 별도 기준을 만들고 baselinePath와 필요 시 enforce를 설정합니다. enforce에서 차이는 FAIL/1, 기준 부재·호환 불가는 INCOMPLETE/2, 수집 실패는 ERROR/2입니다. check는 기준을 갱신하지 않습니다. ID/class/순서는 제외하며 이름은 근사값이고 입력 값은 저장하지 않습니다. DOM 일치는 핸들러·서버 동작의 증명이 아니므로 interaction plan을 함께 실행하세요.

```sh
node bin/ui-refiner.mjs rules --json
node bin/ui-refiner.mjs guide harden --json
node bin/ui-refiner.mjs review packet --from artifacts/ui-refiner/report.json --out design-review
node bin/ui-refiner.mjs review validate --from submitted-review.json --report artifacts/ui-refiner/report.json --out accepted-review.json
npm run smoke:context
```

`guide`는 audit/critique/polish/harden 절차를 안내하며 필수 검사 범위를 줄이지 않습니다. 규칙 카탈로그는 ID·엔진·영역·검사 층위·전제·한계를 설명하며 실제 실행 범위는 보고서에서 확인합니다. 리뷰 패킷은 디자인 입력과 검사 입력을 분리하고 증거를 보존합니다. 검증은 정확한 보고서 해시·첨부·화면 상태를 확인하지만 선언된 리뷰어의 실제 실행·독립성을 입증하지 않습니다. 리뷰 의견은 항상 advisory이며 모델을 자동 호출하지 않습니다.

`npm run benchmark:agent -- --executor <claude 실행 파일 절대 경로>`는 CI와 분리된 실제 에이전트 실험입니다. 임시 합성 fixture만 대상으로 제한된 CLI의 파일 도구를 사용하며 결함 2종×조건 2개, 과제당 최대 2회, 시도당 180초·API 예산 1 USD로 제한합니다. 응답이 제공하는 모델·비용, 정책/보존 위반, 전체 재검사, 미해결·오류·미실행과 검사 코드 해시를 기록합니다. 소규모 결과로 통계적인 우열이나 Hallmark/Impeccable 직접 비교를 주장하지 않습니다. 요구 환경과 결과 경로는 전체 사용법에 설명했습니다.

## 12. UX 수정 지침 검색·인계 첨부

검사 결과에 로컬 UX 검색 결과를 연결합니다. 전체 제안은 `report.json.repairGuidance`, `handoff.json.repairGuidance`와 각 target의 `repairSuggestions`에, 제한된 미리보기는 AGENT_HANDOFF.md/report.md/report.html에 기록합니다. 검색어는 알려진 finding rule ID에서 만들고 페이지 문구를 검색 지시로 사용하지 않습니다. 모르는 규칙은 no-match로 표시합니다. 차단 결함을 우선하며 baseline·검토된 예외·기존 부채 대상은 제외합니다.

```sh
node bin/ui-refiner.mjs guidance --query "keyboard focus" --limit 3
node bin/ui-refiner.mjs guidance --query "폼 오류" --limit 2
npm run smoke:guidance
```

UI UX Pro Max의 UX CSV를 커밋 `28b3b8dee8c976df4fa3e94aed4e092ad43fcb03`에 고정했습니다. 원본 119행 중 Web/All만 검색하며 정확한 바이트·라이선스·원본 줄·행 ID·해시를 `knowledge/ui-ux-pro-max/`에 보존합니다. 원래 Python 검색/디자인 시스템 생성기는 설치·실행하지 않습니다. Node 구현은 결정적 BM25 순위, 제한된 한/일 검색어 별칭, 카테고리 필터와 명시적 no-match를 제공합니다. 순위 점수는 키워드 관련도이며 시각 품질이나 확신 점수가 아닙니다.

선택 설정 `guidance`의 기본값은 `{"enabled":true,"maxFindings":20,"maxSuggestions":2}`입니다. 최대 finding 50개, 대상당 제안 3개이며 `guidance.enabled=false`로 끌 수 있습니다. Markdown 미리보기는 별도로 4개/3200바이트 한도를 두고 JSON에 생략 수를 남깁니다. 데이터 누락·해시 오류는 guidance unavailable로 표시하며 기존 판정을 바꾸지 않습니다. 검색 중 네트워크·모델 호출은 없습니다.

제안마다 원본 우선순위·좋은/나쁜 예·고정 출처 URL을 제공합니다. 원본 High도 항상 advisory이며 새 blocker나 정책 값이 아닙니다. 실제 finding·증거·승인된 SOT를 먼저 확인하고 적용하세요. 예시는 특정 프레임워크나 맥락에 맞거나 프로젝트 기준보다 엄격할 수 있습니다. 이번 기능은 정책 생성·페이지 덮어쓰기·스택 추론·자동 수정·MCP/플러그인 설치를 포함하지 않습니다.
