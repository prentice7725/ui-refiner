# ui-refiner v0.2.1

**일반 웹앱 전용 UI 설계·품질 검증 도구**입니다. 상위 프로젝트 [suta](https://github.com/Guksu/suta)의 UI 패턴·정적 검사와 [lintapple](https://github.com/gholtzap/lintapple)의 브라우저 검사 결과를 결합합니다. 게임 UI는 별도의 Game UI Lab 연구로 유지하며, 이 패키지에는 포함하지 않습니다.

## 이름 및 실행 경로

| 항목 | 값 |
|---|---|
| 제품 및 패키지 | `ui-refiner` |
| CLI | `ui-refiner` |
| 설정 | `ui-refiner.config.json` |
| 에이전트 스킬 | `ui-refiner-agent` |
| 결과물 | `artifacts/ui-refiner/` |

## 시작하기

Node.js **22.18 이상**과 Git, npm이 필요합니다. 툴을 웹 프로젝트의 `tools/ui-refiner/`에 배치한 뒤, **웹 프로젝트 루트**에서 다음을 실행합니다.

```bash
(cd tools/ui-refiner && npm install)
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD"
```

생성된 `ui-refiner.config.json`에서 `static.targets`, `browser.url`, 필요하면 `sot.path`를 프로젝트에 맞게 수정합니다. 웹앱을 실행한 상태에서 다음을 진행합니다.

```bash
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`0`은 자동 검사 통과(사람의 화면 검토는 필요할 수 있음), `1`은 새로 발견된 위반, `2`는 검사 오류/미실행/검사 범위 부족을 의미합니다. 자동 검사가 통과해도 미적 완성도나 출시 승인을 보장하지 않습니다.

## 상태

- 로컬 Node 단위·계약 테스트는 실행 가능하며, 외부 의존성 검사에는 별도 설치가 필요합니다.
- **실제 Chromium 통합 테스트와 운영 승인은 미완료**입니다.
- 자동 UI 수정 루프는 아직 없습니다. `AGENT_HANDOFF.md`는 수정 작업 지침만 생성합니다.
- GitHub 정본: [prentice7725/ui-refiner](https://github.com/prentice7725/ui-refiner).

자세한 설치법과 제약사항은 [README.md](README.md)를 참조하세요.
