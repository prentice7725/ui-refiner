# UI Refiner v0.3.0

suta·lintapple를 소스 수준에서 결합한 일반 DOM 웹앱 UI 검사기입니다. 게임 HUD·Godot·Phaser Canvas는 별도 연구입니다.

suta 57개 패턴을 포함한 전체 스킬 트리와 lintapple 런타임이 벤더링돼 있습니다. 원저작자 MIT 고지, 업스트림 원본/현재 파일별 SHA-256, 로컬 재적용 패치를 보존합니다. npm 의존성은 axe-core·Playwright뿐입니다.

## 설치

Node.js 22.18 이상에서 저장소를 앱의 `tools/ui-refiner`에 배치합니다. node_modules 아래 native TypeScript 실행 제한이 있어 npm 패키지 배포는 아직 지원하지 않습니다.

앱 루트에서:

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ja-JP
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
```

로케일은 en-US·ko-KR·ja-JP입니다. ja-JP에는 Hiragino·Noto Sans JP·Meiryo 등이 초기 폰트 목록에 들어갑니다. 정책은 vendored ui-policy.json 한 곳에서 파생하며 SOT에 맞춰 검토·조정합니다. 기존 설정/정책 파일은 덮어쓰지 않습니다.

기본 정적 검사 정본은 `static.auditPath: "bundled"`입니다. `.agents/skills/suta`는 선택적 지침 사본이며 doctor가 불일치를 알립니다. 예전 설정이 사본의 audit.mjs를 가리킨다면 검토 후 bundled로 바꾸세요.

스킬 설치는 기존 Claude 설정을 보존하면서 편집 후 정적 검사 훅을 추가합니다. 다른 호스트는 생성된 hook-registration.json을 지원하는 훅 UI에 등록합니다. 지원 여부가 불명확한 Codex 설정 필드를 임의로 만들지 않습니다.

앱 URL·정적 대상·정책·SOT·준비 셀렉터를 설정하고 앱 서버를 실행한 뒤:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

## 수정 작업과 증거

- report.json에는 전체 요소·위치·실제 값·기대값·원본 상세와 검사 범위를 보존합니다.
- report.md와 AGENT_HANDOFF.md는 같은 원인을 묶고 뷰포트·상태를 합칩니다. 상속 폰트 위반 24개를 각각 고치는 대신 부모의 폰트 지정 한 곳부터 확인할 수 있습니다.
- 직전 실행 대비 해결·추가·유지 항목을 기록하고 previous-report.json을 남깁니다. 에이전트 지침은 최대 두 번의 수정/재검사 후 남은 문제를 보고하도록 제한합니다. 자동 코드 수정은 없습니다.
- 초기·상호작용 상태 검사와 촬영은 동일 브라우저 세션·로케일·reducedMotion에서 수행합니다. 상태별 최대 5개 위반 대상 크롭을 남기며 불가능한 크롭은 이유를 기록합니다.
- 브라우저 전체 실행은 별도 프로세스 타임아웃으로 제한합니다. doctor는 실제 Chromium 실행을 확인하며 doctor/check 중 자동 다운로드는 없습니다.
- 정렬·간격·반경·inset 대상이 0개면 not-tested, 정보가 없으면 unknown입니다. PASS가 미검사 규칙의 검증을 뜻하지 않습니다.
- onclick/data-ui-clickable이 있는 비네이티브 요소의 키보드 포커스·역할 누락도 검사합니다. 임의 JavaScript 이벤트 등록을 모두 찾아낸다고 주장하지 않습니다. 실제 키 입력은 상호작용 계획으로 검증합니다.
- VISUAL_REVIEW.md는 외부 비전 모델 또는 사람에게 줄 advisory 검토 패킷입니다. 모델 자동 호출·모델 판단에 의한 게이트 차단은 없고 최종 판단은 사람이 합니다.

## 변경 줄 검사와 베이스라인

```sh
node tools/ui-refiner/bin/ui-refiner.mjs check --changed-only
node tools/ui-refiner/bin/ui-refiner.mjs check --changed-only --base origin/main
```

Git 변경 줄·새 소스만 정적 검사하며 브라우저 검사는 전체 설정 페이지를 검사합니다. 부분 검사이므로 깨끗해도 INCOMPLETE/종료 2이며 전체 승인이나 베이스라인 생성에 쓸 수 없습니다.

종료 0은 전체 범위에서 실행한 자동 검사 통과, 1은 새 위반, 2는 오류·필수 검사 누락·부분 범위입니다. 기존 v1 베이스라인은 거부하며 전체 검사 결과로 schemaVersion 2 베이스라인을 재생성·검토해야 합니다. 모호한 항목은 베이스라인으로 숨기지 않습니다.

## 벤더 유지보수

```sh
node tools/ui-refiner/bin/ui-refiner.mjs upstream check
node tools/ui-refiner/scripts/sync-vendor.mjs --lintapple <40자리-SHA>
```

고정 커밋과 HEAD 비교는 읽기 전용입니다. sync-vendor는 임시 소스에 로컬 패치를 재적용하고 manifest·단위·실제 브라우저/CLI 스모크를 통과한 변경만 유지합니다. 실패하면 기존 벤더를 복원하며 자동 커밋/업로드하지 않습니다. 새 로컬 엔진 변경은 별도 패치에 반영해 업데이트 때 잃지 않도록 합니다.

`npm test`, `npm run smoke:ui`, `npm run smoke:gate`가 CI에서 실행되며 실제 출력은 upstream-contracts 증거로 보존합니다. 자동 통과는 미적 완성도나 출시 승인이 아닙니다. 자세한 계약은 README.md와 IMPLEMENTATION_REPORT_KO.md를 참조하세요.
