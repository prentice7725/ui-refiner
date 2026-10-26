# UI Refiner v0.3.0 — 현재 구현 상태

- 일반 DOM 웹앱만 대상으로 한다. 게임 HUD·Canvas·Godot UI는 별도 연구다.
- suta 전체 스킬 트리와 57개 패턴을 벤더링했다. 패턴을 ui-refiner 자체 기능으로 재작성한 것은 아니며, 에이전트가 읽는 지침과 실행하는 정적 감사 소스로 활용한다.
- lintapple 런타임도 소스로 편입했고 로컬 보완은 별도 패치에 보존한다. npm 런타임 의존성은 axe-core와 Playwright다.
- 기본 정적 검사 정본은 `vendor/suta`다. `.agents/skills/suta`는 선택적 지침 사본이며 doctor가 불일치를 알린다.
- 모든 벤더 파일의 현재 SHA-256, 업스트림 원본 SHA-256, 로컬 패치 SHA-256을 `vendor/UPSTREAM.json`에 기록한다. 테스트는 파일 수가 같아도 한 줄이 바뀌면 실패한다.
- 베이스라인은 schemaVersion 2다. 줄번호·측정 메시지·nth-of-type 위치를 안정 식별자에서 제외하고, 모호한 항목은 억제하지 않는다.
- 실제 값·기대값·원본 상세를 유지하며 핸드오프는 원인별로 묶는다. 전체 위치는 report.json에 보존한다. 직전 실행과 비교해 해결·추가·유지 항목을 기록한다.
- Git 변경 줄 검사와 편집 후 정적 훅을 지원한다. 부분 검사는 SCOPED_PASS/종료 3으로 전체 PASS와 구분하며 베이스라인 생성에도 쓸 수 없다.
- 브라우저는 독립 작업 프로세스의 전체 타임아웃으로 제한한다. 검사와 초기/상호작용 상태 촬영·위반 요소 크롭은 같은 세션에서 실행한다. Chromium 자동 설치는 하지 않는다.
- onclick 또는 data-ui-clickable이 있는 비네이티브 요소의 포커스·역할 누락을 검사한다. React onclick 프로퍼티와 Chromium CDP 직접 리스너도 확인한다. 후보 상한과 이벤트 위임·CDP 미지원 한계를 표시하며 모든 리스너를 감지했다고 주장하지 않는다. 실제 Enter/Space 동작은 상호작용 계획으로 검증한다.
- 정책 정본은 vendored ui-policy.json 한 곳이다. en-US·ko-KR·ja-JP 초기 정책을 파생하며 프로젝트 SOT에 맞춰 조정한다.
- 시각 검토 패킷은 advisory다. 비전 모델 자동 호출과 자동 코드 수정은 구현하지 않았다. 사람이 최종 판단한다.
- `upstream check`는 고정 커밋과 HEAD를 비교할 뿐 업데이트하지 않는다. sync-vendor는 임시 소스에 패치를 재적용하고 manifest·단위·실제 브라우저 스모크를 검증한 뒤 변경을 유지한다. 실패하면 벤더를 복구한다.
- 현재 지원 설치는 `tools/ui-refiner` 소스 배치다. node_modules 아래 native TS 실행 제한 때문에 npm 배포는 컴파일 단계가 마련되기 전까지 지원하지 않는다.

검증은 해당 PR의 CI 결과를 기준으로 확인한다. 자동 PASS는 인간의 시각적 완성도 승인이나 운영 배포 승인이 아니다.

## 비교 컨텍스트 수정 — 구현계획 01

- 단일 URL과 명시적 라우트의 실제 준비 조건·상호작용 계획을 공통 정의로 해시한다. 단일 URL의 `browser.ready` 변경이 이전 전체 결과의 브라우저 부채 억제에 반영되지 않던 문제를 수정했다.
- finding·브라우저 부채·ARIA 비교 컨텍스트를 분리했다. ARIA 마스크는 ARIA 비교만, 렌더링 지표 설정은 finding 비교만 초기화한다. 이미지 촬영·시간 예산 변경은 이 비교들을 초기화하지 않는다.
- 엔진 버전·의존성·벤더 메타데이터와 비교 계약 버전을 기록한다. 새 메타데이터 없는 리포트와 미완료/부분 범위 리포트를 전체 부채 참조로 인정하지 않고 비교 불가 이유를 기록한다.
- finding ID·v2 베이스라인·CLI 종료 코드 계약은 유지한다. 기존 v2 베이스라인을 재생성할 필요는 없으며 이전 리포트 참조만 전체 검사로 갱신한다.
- 회귀 검증은 `test/comparison.test.mjs`에 있다. ready 변경 후 기존 부채 억제 방지, 라우트 상속/덮어쓰기, 설정별 비교 영향, 이전 리포트 거부와 baseline 호환성을 주입 runner로 검증한다. 실제 Chromium 검증과는 구분한다.

## 렌더링 증거·검사 범위 확장

### 이미지 증거 보존 — 구현계획 02

- PNG·요소 크롭을 `images-<runId>/` 아래 내용 해시 파일로 저장한다. 같은 상태를 재검사해도 과거 이미지를 덮어쓰지 않으며, 동일 실행의 같은 내용만 재사용한다.
- `imageArtifacts`와 `image-artifacts.json`에 artifact ID·SHA-256·바이트 수·촬영 차원을 기록하고 finding의 `imageEvidence`에 상태 이미지·일치하는 크롭 참조를 연결한다. ARIA 파일 경로와 v2 baseline ID는 변경하지 않는다.
- 보고서·이미지 목록은 파일별 원자적 교체를 사용한다. 참조가 게시된 뒤 소유 표시가 있는 미참조 이미지 묶음만 정리하고, 현재·직전·last-full·finding diff 참조는 유지한다. 수동 파일·알 수 없는 내용·심볼릭 링크는 보호한다. 중단된 미게시 실행에는 11분 유예를 둔다. 하나의 reportDir에는 단일 writer를 사용한다.
- 요청한 촬영이 실패한 결과는 마지막 완료 전체 리포트를 덮어쓰지 않는다. 이미지 삭제·보존 통계는 `imageRetention`으로 기록한다. 기존 평면 PNG의 소유권을 추측해 삭제하지 않는다.
- `test/image-evidence.test.mjs`가 실제 PNG fixture 바이트의 실행 간 보존, 해시·크롭 연결, 부분 실패/완료 참조 보존, 소유권 기반 정리, 중단 유예와 원자적 교체 실패를 검증한다. `smoke:routes`에는 실제 Chromium 이미지의 전후 바이트·해시·목록 검증을 추가했다. 이 환경에서는 Chromium 다운로드 압축파일 손상으로 실브라우저 검증을 완료하지 못했으며 단위 검증과 구분한다.

- `browser.routes`로 이름 있는 1–50개 URL을 명시적으로 검사한다. 자동 크롤링은 하지 않는다. 라우트별 준비 조건·상호작용 계획을 지원하고, 지문·커버리지·촬영·시간 예산에 라우트를 반영한다. 기존 단일 URL 지문은 유지한다.
- 라우트별 시간 제한 worker/브라우저를 실행하고 각 뷰포트·테마를 독립 컨텍스트로 검사한다. 남은 시간을 미실행 라우트에 나누므로 한 worker가 전체 시간을 독점하지 않는다. 인증 상태는 공유하지 않는다. 검사 중 자동 다운로드는 없다. 검증되지 않은 리다이렉트 체인을 따라가지 않고 최종 URL을 직접 요구한다.
- 선택적인 `browser.captureAriaSnapshots`는 검사 상태의 ARIA YAML을 내용 해시 파일로 보존하고, 호환 실행의 구조 해시 변경·추가·제거·유지를 표시한다. 초기 구현은 해시 요약이었다. PR05에서 줄 단위 텍스트 설명을 추가했으며 자동 결함 판정은 하지 않는다. 요청한 촬영 실패는 ERROR다.
- 선택적인 `browser.renderedMetrics`는 상단 fixed/sticky 수, 채운 버튼 수, 반복 동작, 계산된 색의 근사 hue 버킷을 관측한다. 최대 10000개 DOM 요소의 뷰포트 가시 영역만 분석한다. 모두 advisory이며 접근성 위반과 혼동하거나 강제 게이트로 사용하지 않는다.
- `gate.valueExceptionsPath`는 정확한 디자인 값·이유와 선택적 라우트/셀렉터를 요구한다. 접근성·키보드 규칙은 면제하지 않는다. 승인된 값은 리포트에 남고 값과 무관한 베이스라인 억제로 확대되지 않는다.
- ARIA·렌더링 지표 기본값은 모두 false다. 새 의존성·벤더 변경 없이 ui-refiner 어댑터에서 구현했다. 실제 브라우저 검증은 `npm run smoke:routes`와 해당 PR의 CI를 기준으로 확인한다.

## 제안 검토 결과와 별도 검증이 필요한 항목

- reg-actions: 기존 이미지 산출물을 활용할 수 있지만 PR 댓글·이미지 업로드 권한과 앱 증거의 민감성을 검토해야 한다. 이번 변경에서 자동 게시하지 않는다.
- BudouX/textlint: 의미 있는 일본어 보완 후보지만 구 경계와 실제 줄바꿈의 대응, 고정 버전·라이선스·오탐 fixture 검증이 필요하다. 이번에 추가한 ARIA/동일 상태 증거와 분리한다. CSS auto-phrase를 적용했다는 사실만으로 실제 줄바꿈 검사를 했다고 주장하지 않는다.
- 의사 로컬라이제이션·텍스트 확대/간격 스트레스: 정상 상태와 구분한 독립 상태, mutation 복원·timeout·스크린샷·overflow fixture가 필요하므로 구현됐다고 표시하지 않는다.
- impeccable 등 제3 엔진: 중복 규칙·종료 코드·사전 설치·다운로드 금지 계약을 검증하기 전에는 편입하지 않는다.
- Vercel 지침과 human 주석 수집: 유망하지만 실제 상호작용 부작용과 외부 주석 스키마·신뢰 경계 검증을 별도 작업으로 남긴다.

근거: [Playwright ARIA snapshots](https://playwright.dev/docs/aria-snapshots), [reg-actions](https://github.com/reg-viz/reg-actions), [BudouX JavaScript](https://github.com/google/budoux/blob/main/javascript/README.md).

## 재현 리뷰 4 보완

- 라우트 지문은 이름 + pathname/search다. 호스트·포트·fragment는 제외한다. schemaVersion 2를 유지하지만 절대 URL을 사용한 이전 다중 라우트 베이스라인은 한 번 다시 검토·생성해야 한다.
- 정상 라우트와 반환된 완료 상태 결과를 보존하고 라우트별 상태·오류·배정 시간을 리포트에 표시한다. 하나라도 실패하면 전체 ERROR이며 베이스라인을 만들 수 없다. 불완전한 실행을 해결된 위반이나 ARIA 제거로 비교하지 않는다. 시간 초과로 종료된 worker의 버퍼는 보장할 수 없지만 이미 완료된 다른 worker 결과는 유지한다.
- 전체 세션 10분·배치 출력 20 MB 상한을 유지한다. routeTimeoutMs로 라우트 worker 상한을 지정하거나 기본 공정 배분을 쓴다. 큰 목록의 실행당 평균 예산을 공개하고 분할을 권한다.
- 채운 버튼은 불투명 조상 배경 대비 1.5:1 이상인 디자인 근사치로 계산한다. 동일색 ghost·기본 버튼의 잡음을 줄이고 계산할 수 없는 배경은 unknown으로 기록한다. 전면 영역·dialog/backdrop은 상단 고정 수에서 제외한다.
- ariaSnapshotMasks는 명시된 동적 문구만 정규식으로 마스킹한다. 마스크된 YAML을 저장·해시하고 기본 자동 숫자 제거는 없다. 현재·직전·마지막 전체 참조와 비교 쌍에 속하지 않는 도구 소유 ARIA 파일만 정리한다.
- `npm run smoke:review4`가 실제 두 포트 베이스라인, 중간 404 결과 보존, primary/ghost/native 버튼, modal 배경, 반복 시각 마스킹·파일 수·의미 있는 라벨 변경 및 어두운 조상 배경을 검증한다. 최종 판정은 해당 PR의 CI 결과를 따른다.

후속 리뷰에서 모노레포 상대 경로, 팀용 훅 경로, 단계/세션 타임아웃 분리, 자동 생성 ID 제외, 부분 범위 기존 브라우저 위반 분리 및 핸드오프 크기 제한을 보완했다.

## PR03 — 검사 범위 명세와 정상/결함 벤치마크 (2026-10-21)

- 최신 main `3c1fdd3`의 PR01·02 구현 위에서 진행했다. route × viewport × colorScheme × initial/이름 있는 state를 `stages[].inspectionScope`에 기록하고 요청·시작 확인·완료·실패·미실행·unknown을 집계한다. 상호작용 중간 스냅샷은 별도 목록이며 미발견 페이지는 분모에 넣지 않는다.
- 완료는 검사와 요청 증거 처리가 끝났다는 뜻이며 위반 없음과 다르다. 이름 있는 상태 도달 실패는 failed, 이후 미도달 상태는 not-run으로 표시한다. 반환되지 않은 worker 진행 상태는 unknown이다. 계획 로드·검증 실패는 planComplete=false 및 completionRate=null이다.
- 규칙 대상 수 null/누락/음수는 unknown, 0은 not-tested다. 계획 완료율과 구분하고 axe 대비·선택된 axe 접근성 규칙·자체 규칙·명시적 상호작용 범위 및 iframe/Shadow DOM/이벤트 위임 한계를 보고서와 README EN/KO/JA에 공개한다.
- `npm run benchmark:scope`와 CI 단계를 추가했다. 폰트·이름·라벨·대비·가로 overflow·clipping 정상/결함 6쌍, iframe·open Shadow DOM·위임 클릭 경계 3쌍의 18개 label이 실제 Chromium 출력과 일치했다. 경계 결과는 폰트 및 클릭 탐지 범위만 검증하며 전체 Shadow DOM 접근성 지원을 보장하지 않는다.
- 기계 판독 결과는 `artifacts/upstream-contracts/scope-benchmark.json`이다. label별 실제 finding·기대 일치 여부·scope·TP/FP/FN을 보존한다. 중복을 인스턴스별로 합치고 경계 probe는 정확도 분모에서 제외한다. 전체 제품 정확도·속도 목표를 확정하지 않았다.
- 부분 결과 보존, 전체 ERROR/종료 코드 2, baseline 생성 거부의 기존 계약을 유지했다. malformed interaction plan이 다른 라우트 결과를 소실시키지 않는 회귀와 상태 집계 검증을 추가했다.
- Windows 검증을 위해 바이트 해시 대상 vendor/기록 JSON의 체크아웃 변환을 `.gitattributes`로 방지했다. 벤더 소스·패치·manifest 내용은 변경하지 않았다. timeout worker 종료 직후 smoke 임시 폴더의 EBUSY 정리는 제한된 재시도를 적용했다.
- 검증: Node v24.21.0, 고정 Playwright 1.63.0/Chromium 153.0.8010.12. `npm test` 76/76 통과(실패·스킵 0), `benchmark:scope` 및 기존 `smoke:ui/gate/review2/routes/review4` 모두 통과. CI Node 22 환경 결과와 반복 안정성·성능 측정은 별도다.

## PR04 — 상태 시나리오와 명시적 Storybook 라우트 (2026-10-21)

- `examples/state-scenarios.mjs`와 KO/JA interaction JSON을 추가했다. 폼 검증 오류·모달 열기/닫기·빈 목록·loading→ready·긴 KO/JA 문구의 7개 이름 있는 상태를 기존 인터페이스로 검사한다. 번역 데이터는 앱 fixture에 명시적으로 제공하며 browser locale에 의한 자동 번역으로 간주하지 않는다.
- native button의 Enter/Space 결과, native dialog의 Tab/Shift+Tab 포커스 포함·Escape 닫기·opener로 복귀를 검증한다. 각 상태는 실제 요소의 표시/숨김 또는 정확한 텍스트 ready 계약을 가진다. 로딩 fixture는 명시적 데이터 해제 동작까지 비동기 Promise를 보류하며 sleep으로 준비를 추정하지 않는다.
- `demo:states`, `smoke:states`와 CI 단계를 추가했다. 정상 KO/JA × 2 viewport × light/dark의 64개 계획 검사를 검증한다. 키보드/clipping 결함 대조와 7개 상태 각각의 도달 실패를 확인하며 FAIL/1과 ERROR/2, 이전 상태 보존·이후 미실행·baseline 거부를 구분한다.
- `examples/state-scenarios/routes.json`은 실제 페이지 경로와 알려진 Storybook iframe 문서 URL을 기존 routes로 지정하는 예제다. 스모크의 iframe URL은 로컬 프로토콜 fixture이며 실제 Storybook 설치를 검증한 것은 아니다. 실제 대상 버전·index 요구가 없으므로 선택적 index 어댑터는 추가하지 않았다. Storybook 의존성·자동 탐색·인증·라우트 간 cookie 공유는 추가하지 않았다.
- 기계 판독 결과는 `artifacts/upstream-contracts/state-scenarios.json`이며 정상 실행의 ARIA YAML을 옆 `state-scenarios-evidence/`에 복사하여 임시 폴더 제거와 실행 간 정상 보존 정리 이후에도 결과 증거를 유지한다. README EN/KO/JA에 재현 명령·프로젝트 상대 경로·통제 fixture의 한계를 설명했다.
- 최종 검증: `npm test` 76/76 통과(실패·스킵 0), `smoke:states` 통과(정상 계획 검사 64개, 결함 대조 2개, 상태 도달 실패 대조 7개, 명시적 story URL 1개). 저장된 JSON 예제를 직접 사용했고 내보낸 보고서의 모든 ARIA 파일 참조가 보존됐음을 확인했다. 기존 검사 엔진·버짓·상태 판정 계약은 변경하지 않았다.

## PR05 — 읽기 쉬운 ARIA 변경 증거 (2026-10-21)

- 저장된 마스크 적용 YAML을 줄 단위로 비교하여 `ariaDiff.changed/added/removed[].textDiff`에 전후 줄 번호와 unified hunk, oldFile/newFile, 알고리즘·출력 상한·잘림 여부를 기록한다. `changed`에는 previousSha256/previousBytes를 보존하고 `textSummary`에 비교 성공·파일 불가·생성 생략·잘림 수를 구분한다. YAML 파서나 의미/WCAG 판정기를 추가하지 않았다.
- report.md에는 최대 8개/24000 발췌 바이트, AGENT_HANDOFF.md에는 2개/6000까지 이전·현재 YAML 링크와 변경 줄을 제공한다. 이름·역할·선택 상태 및 추가/삭제의 위치를 원문에서 검토할 수 있다. 길이 제한은 TRUNCATED와 생략 이유로 명시하며 원본 YAML을 계속 보존한다.
- 입력 파일의 일반 파일 여부·2 MB 제한·해시·바이트 수를 확인한다. 과거 파일 누락·변조는 unavailable 이유로 남기고 변화 없음으로 처리하지 않는다. 신규 캡처 실패의 ERROR 계약은 유지한다. 후속 캡처가 실패한 현재 실행도 ARIA 비교 불가이며 텍스트 설명을 생성하지 않는다.
- 줄 매칭은 최대 100만 LCS 셀/4000 작업 줄까지 계산한다. 큰 변경은 bounded-replacement 편집을 사용하며 최소 diff를 보장하지 않는다. 설명별 120줄/12000 텍스트 바이트/줄당 2000바이트, 배치 16건/600줄/64000 텍스트 바이트 상한을 적용한다(JSON 메타데이터 제외). UTF-8 문자를 중간에서 자르지 않고 Markdown fence를 원문보다 길게 잡아 증거가 출력 구조를 깨지 않게 한다.
- 기존 비교 컨텍스트·명시적 마스크·finding/baseline ID·증거 정리를 유지한다. ARIA 변경은 advisory이며 실제 대비·키보드 blocker와 사람 검토 요구를 바꾸지 않는다. 선택적 ARIA 기대 계약 강제 검사는 후속 결정이다.
- `smoke:aria`와 CI 단계를 추가했다. 실제 Chromium에서 버튼 이름/역할/탭 선택 상태·추가/삭제·시간 마스크 안정성·이전 YAML 바이트 보존·누락 이유·대비/키보드 결함 유지를 검증한다. 결과와 YAML/Markdown 증거는 `artifacts/upstream-contracts/aria-text.report.json`, `aria-text-evidence/`에 보존한다. README EN/KO/JA에 스키마·상한·실패 의미를 동기화했다.
- 최종 검증: 전체 `npm test` 84/84 통과(실패·스킵 0), 새 `smoke:aria`와 기존 `smoke:routes`, `smoke:review4` 통과. Chromium 비교 6회에서 생성한 보고서·원문 YAML·Markdown 링크를 확인했다. 추가 의존성과 벤더 소스 변경은 없다.

## PR06 — 선택적 시각 회귀검사 (2026-10-21)

- 최상위 visual 설정을 도입했다. 기본 비활성/활성화 시 advisory이며 기존 browser.captureScreenshots 원본·크롭과 독립적이다. 기존 onState에서 같은 브라우저 세션을 사용하고 별도의 비교용 브라우저나 테스트 런너를 추가하지 않았다.
- 공식 저장소·npm 메타데이터와 설치 소스를 대조해 pixelmatch 7.2.0(ISC), pngjs 7.0.0(MIT)을 정확히 고정하고 lockfile·원문 라이선스를 갱신했다. PNG 디코딩/픽셀 비교를 라이브러리에 맡긴다. finding/ARIA 호환성은 기존 axe-core/Playwright 엔진 정보를 유지하며 visual 옵션·라이브러리는 별도 호환성 계약을 갖는다.
- visual candidate는 완료된 전체 검사에서 PNG·차원·환경·마스크·옵션을 별도 후보 디렉터리로 복사한다. visual approve만 승인 manifest를 원자적으로 갱신한다. check는 승인 이미지/manifest를 갱신하지 않고 finding baseline create(v2) 의미도 유지한다. 승인 갱신은 이전 manifest가 소유한 미참조 이미지만 제거하고 수동 파일을 보존한다.
- 기준 키에는 route(이름+pathname/search)·state·viewport·theme·locale·capture 범위·선언한 환경 profile을 포함한다. origin/포트는 제외한다. 환경에는 OS/release/architecture·브라우저/Playwright/비교기/디코더 버전·DPR·UTC/reduced-motion을 기록하고 ready/interactions·캡처/비교 옵션도 대조한다. profile은 사용자가 고정 폰트/실행 이미지 조건을 선언하는 값이며 실제 폰트 파일·컨테이너 동일성을 자동 검증했다고 주장하지 않는다.
- font 준비와 표시 이미지 decode 후 animation 비활성·caret 숨김·CSS pixel 스케일로 연속 두 PNG 바이트 일치를 확인한다. 2–5회 안정화 시도 상한과 기존 worker/session/route·출력 예산을 적용한다. PNG당 1600만 픽셀/32 MB 상한과 파일 해시·바이트 검증을 사용한다. 명시적 selector만 magenta 마스크하고 대상·viewport CSS box를 기록한다. 대상 누락·불안정·요청 리소스/파일/비교 실패는 ERROR/2다.
- report.visual에 상태별 actual/expected/diff의 불변 이미지 참조·픽셀 수/비율/허용값·크기 변경 이유·시간/worker RSS 표본/이미지 용량을 기록한다. expected도 실행 디렉터리에 복사해 이후 기준 승인으로 과거 보고서 파일이 바뀌지 않게 한다. 현재/직전/last-full의 기존 이미지 보존 정리를 재사용한다. 크기 변경을 resize해 일치시키지 않는다.
- 결과 계약: 비활성 not-requested, 일치 matched, 차이 different, 기준 없음 needs-baseline, 환경/옵션 불일치 not-comparable, 요청 실패 error. advisory의 차이/미승인/비교 불가는 REVIEW_REQUIRED이며 matched로 표시하지 않는다. 명시적 enforce는 차이 FAIL/1, 기준 없음·비교 불가 INCOMPLETE/2, 요청 실패 ERROR/2다. 기존 DOM/소스 결함과 사람 검토 요구는 독립적으로 유지한다.
- README EN/KO/JA, CLI 도움말, 제품 에이전트 지침, CI를 동기화했다. 자동 스크린샷 비교는 디자인 품질·전체 접근성 보증이 아니며 실제 앱에서 고정된 폰트/데이터/실행 환경과 승인 이미지를 검토한 뒤 enforce를 선택한다. 기본 모드를 enforce로 승격하지 않았다.
- 새 smoke:visual은 초기/저장 상태 10회 반복, 마스크 안 동적 문구 정상 대조, 레이아웃 이동·clipping·마스크 밖 변화·이미지 크기 변경, 기준 없음/환경 불일치, 잘못된 마스크·불안정 canvas·깨진 이미지·누락 기준 파일, CLI 후보/승인, 원본 증거 독립성을 검증한다. 원시 표본·실행 환경·핵심 소스 해시·PNG·비교 예시는 artifacts/upstream-contracts/visual.report.json 및 visual-evidence/에 보존한다. 메모리는 브라우저 자손을 제외한 worker RSS 표본이며 프로세스 트리 최고 RSS로 소개하지 않는다. p95·일반적 정확도·속도 개선 목표는 확정하지 않았다.
- 최종 검증: 전체 npm test 90/90 통과(실패·스킵 0), 시각 비교 계약 6개 재검증 통과. 새 smoke:visual 및 기존 ui/gate/review2/routes/review4/aria/states/benchmark:scope 총 9종 실브라우저 검증 통과. 최신 측정과 핵심 소스 해시·PNG 해시/바이트도 대조했다.
- 최신 통제 반복: Node v24.21.0, Chromium 153.0.8010.12, win32/x64, viewport 390×844, 초기/저장 2상태 × 10회, 결과/PNG/finding 집합 변동 0/10. gate 전체 wall time 중앙값 3.177초(최소 3.081, 최대 3.537), 비교 단계(I/O 포함) 실행당 중앙값 65.7ms, 최대 관측 worker RSS 207.1MiB, 생성 PNG 66388바이트/실행(2상태 actual/expected/diff). 전체 24회 대조의 참조 PNG 105개/1134379바이트, 결과 JSON 733727바이트를 보존했다. 브라우저 프로세스 트리 전체 메모리와 일반 앱 안정성·성능은 입증하지 않았다.


## PR07 — 표준 출력·오프라인 검토·인계 검증 (2026-10-22)

- JSON 판정을 원본으로 유지하고 `check --format json|sarif|html|markdown`, `export html|sarif --from --out`을 추가했다. 기본 CLI 요약과 0/1/2/3 종료 코드, REVIEW_REQUIRED/SCOPED_PASS 구분을 유지한다. JUnit은 구체적인 소비자가 없어 보류했다.
- 매 검사에 정적 `report.html`, 전체 대상과 원인 그룹을 담은 `handoff.json`, 재현 인수·범위·증거 미리보기가 보강된 AGENT_HANDOFF.md를 생성한다. 기존 원인 그룹 및 ARIA/이미지 미리보기의 생략 한도를 유지한다. 설정·정책·실효 상호작용 계획의 해시를 기록하며 메모리 설정은 실행 준비 완료로 표시하지 않는다. 앱 실행·데이터·인증 준비가 재현의 전제다.
- 오프라인 묶음은 새 폴더에 원본 report.json 바이트를 그대로 복사하고 현재·이전 PNG/ARIA 증거의 해시·크기를 검사한다. 누락·손상·구형 해시 부재는 evidence-manifest.json과 HTML에 명시한다. 경로 탈출·외부 디렉터리 junction·ADS를 차단하고 개별/전체 복사 예산을 적용한다. 원본 경로와 함께 짧은 e/ 별칭을 기록하여 Windows Chromium의 긴 파일 경로 실패를 해결했다. 별칭 사본도 바이트 예산에 포함한다.
- SARIF 2.1.0은 실제 파일·줄·앵커를 읽어 확인한 정적 결과만 주 소스 위치로 내보낸다. 브라우저 선택자는 속성으로, PNG/ARIA는 관련 증거로 기록한다. 환경 오류·미실행과 시각 비교 대기 사유 및 원래 판정을 속성/알림에 유지한다. 원본 기준 URI는 이동한 환경에서 조정해야 한다.
- 공식 OASIS draft-04 스키마 원본과 이용 조건·조회일·SHA-256을 test/schemas에 고정했다. Ajv 8.20.0, ajv-draft-04 1.0.0, ajv-formats 3.0.1은 개발 전용이며 런타임 의존성과 기존 식별자를 바꾸지 않는다. README EN/KO/JA, 배포 agent protocol, CI와 라이선스 고지를 동기화했다.
- 검증: 전체 단위/계약 테스트 95/95 통과. 실제 Chromium smoke:gate, smoke:aria, smoke:visual, smoke:export 통과. 오프라인 file:// 화면을 1280/390px에서 열고 실제/기대/차이 PNG 3장과 ARIA 변경을 확인했으며 외부 요청은 0건이었다. 정상 JSON stdout과 결함 SARIF stdout을 파싱하고 공식 스키마를 검증했다. 저장 결과의 PASS/FAIL/ERROR/INCOMPLETE/SCOPED_PASS 내보내기 종료 코드는 각각 0/1/2/2/3을 유지했다. 화면·묶음·실험 기록은 artifacts/upstream-contracts/export-evidence 및 export.report.json에 남긴다.
- 인계 소비자 실험: 고정 정적 transition 결함과 브라우저 contrast 결함 2개, 최대 2회 예산, 각 1회 수정 후 전체 검사 PASS, 신규 차단 결함 0개. 실제 handoff의 파일/줄 또는 선택자를 읽은 뒤 fixture 전용의 정해진 수정 절차를 적용했다. 정책/기준선으로 결함을 숨기지 않았다. 자율 코딩 에이전트 실행 수는 0이며 이 수치를 에이전트 수정 성공률로 일반화하지 않는다. 자동 코드 수정·기준선 승인·PR 댓글 기능은 추가하지 않았다.


## PR08~12 — 맥락·기능 보존·규칙·리뷰·실제 agent 실험 (2026-10-25)

벤치마킹 후 제안한 순서대로 구현했다. 외부 skill/런타임 코드를 복사하지 않았고 기존 engine pin·finding ID·baseline v2·기본 판정을 유지했다. 커밋·푸시는 이번 요청 범위에 포함하지 않았다.

- PR08: 선택 contextPath와 검증된 schemaVersion 1 입력을 추가했다. 제품 사실·문서 참조·route별 purpose/mode·보존 대상·허용 변경을 분리한다. 파일 해시·선언한 승인·stale/unavailable/unknown을 기록하고 정책을 자동 생성하지 않는다. 관련 context 변경은 finding/review 비교를 갱신하되 ARIA와 browser-debt 의미를 유지한다.
- PR09: 동일 브라우저 상태에서 링크·폼·입력·컨트롤·테스트 훅과 명시한 속성/문구/이름·루트 토큰을 수집한다. 입력 값과 핸들러 소스는 저장하지 않는다. 동적 ID/class/순서를 비교하지 않고 중복 개수를 보존한다. preserve record는 검토된 전체 검사에서만 별도 기준을 만들며 덮어쓰지 않는다. enforce의 차이는 FAIL/1, 기준 부재/호환 불가는 INCOMPLETE/2, 수집 실패는 ERROR/2다. 알려진 대상 부재와 수집 불확실성을 구분하며 실제 backend/handler 성공은 주장하지 않는다. JSON·인계·Markdown·HTML·SARIF에 결과를 연결했다.
- PR10: rules --json은 pinned 엔진의 ID와 domain/phase/prerequisite/limits를 공개한다. 수동 판단과 advisory를 자동 검사와 구분한다. guide audit/critique/polish/harden은 기존 full check 범위를 줄이지 않는 읽기 전용 안내다.
- PR11: review packet은 맥락·캡처를 담은 디자인 입력과 결함·판정을 담은 detector 입력을 분리해 오프라인 증거와 함께 내보낸다. review validate는 정확한 원본 해시·첨부 파일 해시·route/state와 reviewer 선언을 검증한다. 수동 판단은 manual로 표시하고 제출된 blocking 플래그는 false로 고정한다. 별도 파일은 실행 격리가 아니며 reviewer의 실제 실행/독립성을 입증하지 않는다. 모델 자동 호출은 추가하지 않았다.
- PR12: benchmark:agent는 명시적으로 선택한 설치된 Claude CLI를 제한 모드에서 구동하는 실제 file-tool agent 실험이다. 합성 임시 프로젝트에서 Read/Edit/Write만 제공하고 shell/MCP/hook을 사용하지 않는다. 모션/대비 결함 × brief-only/structured-handoff 조건의 시작 소스를 맞추고 시도·비용·도구 거부·정책/보존 위반·새 blocker·전체 재검사를 기록한다. 과제당 2회, 시도당 180초/API 예산 1 USD이며 CI에서 모델을 자동 호출하지 않는다. 검사 코드 해시가 실행 중 바뀌면 실험을 무효화한다.

검증: 전체 단위·계약 테스트 103/103 통과. 실제 Chromium의 context/preservation/review smoke와 기존 export smoke를 실행했다. 정상·동적 ID 변경·링크 목적지/필드 이름 손실·토큰 변경·명시 기준 불변·리뷰 증거 오류·권고 판정을 확인했다. 자세한 사용법과 예시, README EN/KO/JA, agent protocol과 CI를 동기화했다.

최종 실제 agent 실험은 Claude Code 2.1.310 / 응답에 기록된 claude-opus-5-5로 총 4개 과제를 실행했다. 두 조건 각각 2/2가 한 번의 수정 후 전체 PASS·보존 matched, 새 blocker/정책 위반 0이었다. 동일 시작 소스와 실행 중 검사 코드 불변을 확인했다. CLI 보고 비용 합계는 0.1215388 USD이며 청구서 검증값이나 일반적인 비용 추정이 아니다. 표본이 작고 둘 다 전부 통과했으므로 조건 간 우열은 주장하지 않는다. 실제 Hallmark/Impeccable 실행 비교나 독립적인 사람의 시각 평가는 수행하지 않았다. 공유 가능한 요약: docs/AGENT_STUDY_2026-10-25.json.

개발 중 초기 fixture 결함 주입 실패(실제 agent 0회)와 실험 중 수집 스키마 변경이 섞인 실행은 산출물을 보존하고 최종 비교에서 제외했다. 후자의 마지막 조건은 agent가 만들지 않은 보존 차이로 미해결 판정됐으므로 성공/실패 통계로 사용하지 않았다. 코드 해시 고정 장치를 추가한 뒤 전체 네 과제를 재실행한 결과만 위 수치로 보고했다.


## PR13 — UX 지침 검색과 핸드오프 첨부 (2026-10-26)

사용자가 선택한 범위인 UX 지침 검색·인계 첨부만 구현했다. 정책 초안 생성·페이지별 덮어쓰기·프레임워크별 데이터 검색·MCP/플러그인 패키징은 포함하지 않는다.

- UI UX Pro Max의 ux-guidelines.csv를 커밋 28b3b8dee8c976df4fa3e94aed4e092ad43fcb03에 고정했다. 원본 119행, MIT LICENSE, 출처/조회일/커밋/행 수/SHA-256/Git blob SHA-1을 knowledge/ui-ux-pro-max에 기록했다. Git blob SHA-1까지 원본과 일치하며 knowledge/** -text로 체크아웃 바이트를 유지한다. Python 검색·디자인 시스템 생성 코드는 복사·실행하지 않는다.
- 의존성을 추가하지 않는 로컬 Node BM25 검색을 작성했다. Web/All 지침만 대상으로 검색하며 한국어·일본어 일부 UX 키워드 별칭, 규칙별 검색어·카테고리, 약한 일치 필터, 결정적 tie-break, no-match를 제공한다. 검색어는 finding rule ID로 만들고 검사한 페이지의 문구를 지시로 사용하지 않는다. 순위 점수는 키워드 관련도이며 화면 품질·진단 확신을 뜻하지 않는다.
- report.json.repairGuidance, handoff.json.repairGuidance와 target.repairSuggestions에 실제/기대 값·기존 이미지/ARIA 근거와 함께 참고 지침을 연결했다. 각 제안에는 추천·피할 점·좋은/나쁜 예·원본 우선순위·행 ID·원본 줄·고정 출처 URL이 있다. 원본 High도 advisory=true/blocking=false이며 finding 배열·ID·scope·호환성·정책·baseline v2·판정·종료 코드를 변경하지 않는다.
- 기본 대상은 차단 결함 우선 최대 20개, 대상당 최대 2개 제안이다. baseline/검토 예외/기존 부채는 제외한다. 옵션 상한은 대상 50개·제안 3개이며 disabled/no-match/unavailable/생략 수를 명시한다. Markdown 미리보기는 4개·3200바이트로 제한한다. 데이터 오류는 지침만 unavailable로 처리한다. 네트워크·모델 호출과 source example 실행은 없다.
- guidance --query [--limit] 명령과 report.md/AGENT_HANDOFF.md/오프라인 HTML 표시를 추가했다. agent protocol은 실제 finding과 SOT를 먼저 읽고 예시의 프레임워크·접근성·reduced-motion 적합성을 검토하도록 보강했다. README EN/KO/JA·라이선스 고지·CI를 동기화했다.
- 검증: 단위/계약 테스트 108/108 통과. 실제 suta/Chromium의 no-reduced-motion·transition-all·text-contrast 결함에 고정 출처 지침이 연결됐다. 지침을 꺼도 같은 결함·ID·비교 기준·FAIL을 유지하고 실제 수정 후 PASS로 돌아오는 것을 확인했다. source integrity·CSV 인용/여러 줄·다국어 키워드·bounded/no-match·원본 High 비승격을 검증했다. smoke:guidance 결과와 휴대 가능한 예제는 artifacts/upstream-contracts/guidance.report.json 및 guidance-evidence에 남긴다.
