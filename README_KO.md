# UI Refiner v0.3.0

**suta + lintapple를 소스 수준에서 결합한 독립 웹앱 UI 품질 검사기.**

이번 변경의 핵심은 npm에 존재하지 않는 `lintapple@0.1.21`을 요구하지 않는 것입니다. lintapple 브라우저 감사 엔진은 `vendor/lintapple/src/`, suta 스킬과 정적 감사 엔진은 `vendor/suta/skills/suta/`에 소스째 보존했습니다. 두 원저작자 MIT 고지와 커밋 출처도 함께 기록합니다. npm으로 설치하는 것은 `axe-core@4.14.0`, `playwright@1.63.0`뿐입니다.

**범위:** React·Vue·Svelte·HTML 등 일반 DOM 웹앱. Godot, Phaser Canvas, HUD 등 게임 UI는 별도 연구로 분리합니다.

## 프로젝트에 설치

웹앱 루트에 이 저장소를 `tools/ui-refiner/`로 두고:

```sh
(cd tools/ui-refiner && npm ci)
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

**남은 범위:** suta의 전체 57개 패턴 카탈로그는 아직 모두 가져오지 않았습니다. 현재는 정적 감사 엔진과 핵심 스킬 문서를 포함합니다. 게임용 검사기, AI 자동 수정, 시각적 디자인 승인 기능은 이 버전에 포함하지 않습니다.

원본 출처와 라이선스: `vendor/UPSTREAM.json`, `vendor/suta/LICENSE`, `vendor/lintapple/LICENSE`, `licenses/THIRD_PARTY.md`.
