# UI Refiner v0.3.0

**suta + lintapple를 소스 수준에서 결합한 독립 웹앱 UI 품질 검사기.**

이번 변경의 핵심은 npm에 존재하지 않는 `lintapple@0.1.21`을 요구하지 않는 것입니다. lintapple 브라우저 감사 엔진은 `vendor/lintapple/src/`, suta 스킬과 정적 감사 엔진은 `vendor/suta/skills/suta/`에 소스째 보존했습니다. 두 원저작자 MIT 고지와 커밋 출처도 함께 기록합니다. npm으로 설치하는 것은 `axe-core@4.14.0`, `playwright@1.63.0`뿐입니다.

**범위:** React·Vue·Svelte·HTML 등 일반 DOM 웹앱. Godot, Phaser Canvas, HUD 등 게임 UI는 별도 연구로 분리합니다.

## 프로젝트에 설치

웹앱 루트에 이 저장소를 `tools/ui-refiner/`로 두고:

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD"
```

`ui-refiner.config.json`의 실제 정적 검사 대상, 앱 URL, SOT, 준비 상태를 수정하고 `ui-policy.json`을 디자인 토큰에 맞춥니다. 앱 서버를 실행한 다음:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

## 자체 검증

ui-refiner 저장소 루트(Node.js 22.18 이상):

```sh
npm ci
npm test
npx playwright install chromium
npm run smoke:ui
```

기본 데모의 위반 **0건**과 의도적 오류를 포함한 음성 대조군(negative control)의 적발 성공을 모두 요구합니다. 종료 코드 2는 검사가 완료되지 않았다는 뜻이며 성공이 아닙니다. 전체 검증은 GitHub Actions `.github/workflows/ci.yml`에서도 실행됩니다.

**소스 편입:** suta 전체 250개 파일(57개 패턴 문서 포함), lintapple 런타임 15개 파일을 원본 커밋과 기준으로 편입했습니다. 이후 로컬 수정은 `vendor/UPSTREAM.json`에 기록합니다. **미구현 범위:** 게임용 검사기, AI 자동 수정, 인간의 시각적 디자인 승인 기능은 포함하지 않습니다.

원본 출처와 라이선스: `vendor/UPSTREAM.json`, `vendor/suta/LICENSE`, `vendor/lintapple/LICENSE`, `licenses/THIRD_PARTY.md`.

## 이번 보강: 베이스라인 v2와 검사 증거

- 베이스라인은 `schemaVersion: 2`입니다. 설정 파일 버전은 1을 유지합니다. v1 베이스라인은 거부하며 새 검사 결과에서 재생성·검토해야 합니다.
- suta 지문은 상대 파일 경로와 고유한 소스 행 내용으로 구성해 줄 삽입에 영향을 받지 않습니다. lintapple 지문은 고유 DOM 마커 또는 고유한 의미 식별자에 뷰포트·테마·상태를 결합합니다. 메시지, 측정값, nth-of-type 위치는 지문에서 제외합니다.
- 동일한 소스 행이나 중복 DOM처럼 식별이 모호한 항목은 베이스라인으로 숨기지 않습니다. 소스 내용이나 의미 식별자가 바뀌면 새 항목이 될 수 있습니다.
- `actual`, `expected`, 관련 셀렉터와 원본 상세 정보가 정규화 결과에 보존되고 수정 핸드오프에도 실제 값과 기대값이 표시됩니다.
- 정렬·간격·반경·inset 검사 대상 수를 화면 크기·테마·상태별로 표시합니다. 0개는 `not-tested`, 정보 누락은 `unknown`이며 PASS로 해당 규칙이 검증됐다고 주장하지 않습니다.
- doctor는 Chromium을 실제 실행해 빈 페이지를 열고 종료합니다. doctor/check의 자동 다운로드는 제거했으며 설치는 위의 명시적 설정 단계에서 수행합니다.
