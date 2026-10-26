# 제품 맥락·기능 보존·리뷰 사용법

이 기능은 기존 두 검사 엔진의 정책이나 finding baseline v2를 대신하지 않는다. `contextPath`와 `preservation`은 선택 설정이며 기존 설정 파일도 계속 동작한다.

## 1. 제품과 화면 맥락

프로젝트 루트의 설정에 다음 필드를 추가한다.

```json
{
  "contextPath": "project-context.json",
  "preservation": {
    "enabled": true,
    "enforcement": "advisory",
    "baselinePath": null
  }
}
```

위 JSON은 추가할 필드만 표시했다. 기존 전체 설정을 대체하는 파일이 아니다. [맥락 예시](../examples/project-context.json)를 프로젝트에 복사하고 실제 문서·선택자·토큰에 맞게 수정한다. 경로는 설정 파일의 디렉터리 기준이다. `approved`는 사용자가 선언한 상태이며 문서 내용에서 자동 추론하지 않는다. 선택적으로 reference에 `sha256`을 지정하면 문서의 실제 해시와 달라질 때 stale로 표시한다.

`product`에는 실제 대상 사용자·작업·사실을, `references`에는 제품/시각/인수 조건 문서 경로를 둔다. `surfaces[].route`는 설정의 route **이름**과 일치해야 한다. 단일 URL 설정에서는 `default`다. 화면 목적은 `persuade`, `operate`, `read`, `experience` 중 하나다. 문서 부재·해시 불일치·연결되지 않은 route는 명시적으로 기록한다. 누락된 사실을 만들거나 자연어 문서를 강제 정책으로 변환하지 않는다.

맥락과 참조 문서 해시는 report.json/handoff.json에 기록된다. 변경하면 finding 비교와 리뷰 기준이 갱신되지만 finding ID, 기존 브라우저 부채, ARIA 비교의 의미를 바꾸지 않는다. 맥락 파일의 잘못된 스키마나 경로는 실행 오류로 처리된다.

## 2. 기능 보존 기준 기록

1. 앱을 시작하고, 보존할 현재 동작이 맞는지 확인한다.
2. `preservation.enabled=true`, `enforcement=advisory`로 전체 검사를 실행한다.
3. report.json의 inventory와 모든 원래 결함을 검토한다.
4. 다음 명령으로 별도 보존 기준을 기록한다.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs preserve record --from artifacts/ui-refiner/report.json --out preservation-reference.json
```

5. `baselinePath`를 위 파일로 지정하고 필요하면 enforcement를 `enforce`로 바꾼다.
6. 수정 후 전체 검사를 다시 실행한다. check는 보존 기준을 자동 갱신하지 않으며 record는 기존 파일을 덮어쓰지 않는다.

기록은 두 필수 엔진을 완료한 전체 검사와 완전한 inventory에서만 가능하다. 다른 검사에서 이미 발견한 결함이 사라지는 것은 아니다. 보존 기준을 승인했다고 접근성 결함이 baseline으로 억제되지 않는다. 기준을 만들 수 없는 부재한 명시 대상·빈 토큰도 기록 시 거부한다.

자동 inventory는 링크, 폼, 비밀번호를 제외한 입력, select/textarea/button, 테스트 훅을 수집한다. 사용자 입력 값·비밀번호·이벤트 핸들러 코드는 저장하지 않는다. 선언한 preserve element는 선택자 하나로 정확히 하나의 요소를 가리켜야 한다. `href`, `action`, `method`, `name`, `type`, `required`, `data-testid`, `role`, `aria-label`, `aria-controls`와 선택한 문구/이름을 보존할 수 있다. 토큰은 문서 루트의 computed CSS custom property 값이다.

같은 출처의 URL은 path/query/hash로 기록한다. 동적 ID, class, DOM 순서와 host/port 자체는 inventory 비교 대상으로 쓰지 않는다. 단, 검사 환경의 절대 URL 등 기존 호환성 조건은 여전히 보수적으로 비교한다. 따라서 포트·정책·ready·상호작용 계획·맥락이 달라지면 기준 비교가 not-comparable일 수 있다.

비교는 요소 기록의 중복 개수도 확인한다. 기존 링크·필드가 없어지거나 의미가 바뀌면 회귀로 보고하고 새로운 요소를 추가한 것만으로 기존 손실을 상쇄하지 않는다. 명시 대상의 알려진 부재는 부재로 기록하고, 잘못된 선택자·다중 매칭·2000개 초과 수집은 incomplete로 남긴다. 이름은 DOM label 근사이며 접근성 이름 알고리즘 전체를 재현하지 않는다.

| 보존 결과 | advisory | enforce |
|---|---|---|
| matched | 다른 검사 판정 유지 | 다른 검사 판정 유지 |
| different | 권고·사람 검토 | FAIL / 1 |
| needs-reference, not-comparable | 검토 대기 | INCOMPLETE / 2 |
| 수집 누락·불완전·실행 오류 | ERROR / 2 | ERROR / 2 |

일치는 수집한 DOM 계약에 한정된다. 실제 핸들러, 네트워크 저장, 서버 검증, 위임 이벤트를 증명하지 않는다. 명시적 interaction plan과 제품 테스트를 함께 사용한다. `allowedChanges`는 검토용 설명이며 자동 waiver가 아니다.

## 3. 규칙과 작업 안내

```sh
node tools/ui-refiner/bin/ui-refiner.mjs rules --json
node tools/ui-refiner/bin/ui-refiner.mjs guide audit --json
node tools/ui-refiner/bin/ui-refiner.mjs guide critique --json
node tools/ui-refiner/bin/ui-refiner.mjs guide polish --json
node tools/ui-refiner/bin/ui-refiner.mjs guide harden --json
```

카탈로그는 pinned engine의 rule ID를 유지하고 engine/domain/static·render·interaction·manual, 필요한 대상·계약과 한계를 보여준다. ‘사용 가능한 규칙’과 ‘이번 실행에서 실제 검사한 규칙’은 다르다. 실행 범위는 report.stages/inspectionScope를 읽는다. guide는 읽기 전용 절차이며 자동 수정이나 필수 검사 범위 축소를 수행하지 않는다.

## 4. 디자인 리뷰

```sh
node tools/ui-refiner/bin/ui-refiner.mjs review packet --from artifacts/ui-refiner/report.json --out design-review
node tools/ui-refiner/bin/ui-refiner.mjs review validate --from submitted-review.json --report artifacts/ui-refiner/report.json --out accepted-review.json
```

새 폴더의 `design-input.json`은 맥락·화면 목적·증거만, `detector-input.json`은 자동 판정·결함·보존 결과를 담는다. 먼저 화면을 보고 판단을 기록한 뒤 자동 결과와 합치는 절차를 권장한다. 파일 분리는 실제 실행 격리가 아니며 reviewer를 자동 호출하지 않는다. `review-manifest.json`의 reviewerExecuted=false를 실제 수행으로 해석하지 않는다.

제출 형식은 생성된 REVIEW.md를 따른다. 정확한 원본 report SHA-256, 선언한 reviewer 종류·이름·시각·평가 순서와 관찰 목록이 필요하다. 관찰 영역은 hierarchy/task-clarity/density/typography/states/i18n이다. 캡처 근거는 원본에 기록된 파일의 실제 해시와 route/state를 확인한다. 수동 판단은 basis=manual로 명시하고 근거 이미지를 보았다고 주장하지 않는다. 검증은 실행자·독립성의 실재를 입증하지 않으며 결과는 항상 advisory다. 제출자가 blocking=true를 넣어도 자동 blocker로 승격하지 않는다.

## 5. 실제 에이전트 실험

```sh
npm run smoke:context
npm run benchmark:agent -- --executor /absolute/path/to/claude
```

Windows에서는 설치된 `claude.exe`의 절대 경로를 사용한다. 실험은 CLI의 `--restricted`, file tools, JSON 출력, API 예산 옵션을 지원하는 버전이 필요하다. 설치·로그인·결제 설정은 자동 수행하지 않는다. 이 실험은 실제 모델 요청을 보내므로 합성 fixture만 사용하며 npm test와 CI에서 자동 실행하지 않는다.

두 합성 결함(motion/contrast)을 brief-only/structured-handoff 두 조건으로 비교한다. 모든 수정은 임시 프로젝트의 src/app.css에 한정한다. 쉘 도구·플러그인 명령·MCP·hook을 사용하지 않고 Read/Edit/Write만 제공한다. 정책·맥락·기준·HTML 보존을 검사하며 위반은 성공으로 집계하지 않는다. 모델은 설치된 CLI 기본값을 사용하고 응답의 modelUsage·비용·거부를 기록한다. 시도당 최대 1 USD, 180초, 과제당 최대 2회로 제한한다. CLI가 비용을 보고하지 않으면 비용을 추정하지 않는다.

양쪽 시작 소스의 동일 해시와 실행 전후 검사 코드 해시를 확인한다. 수정 후 driver가 정적·실제 Chromium·기능 보존 전체 검사를 실행한다. 에이전트의 자체 성공 문구나 process exit 0만으로 성공 처리하지 않는다. 실행 실패·미실행·미해결·새 blocker를 모두 분모와 함께 기록한다. 산출물은 artifacts/upstream-contracts/agent-study-*/study.json, 전후 CSS, executor 결과와 review 묶음이다.

이 실험은 각 조건 2개 표본의 실제 file-tool agent 실험이다. Hallmark/Impeccable을 설치해 비교한 결과나 통계적인 우열, 독립적인 사람의 시각 평가는 제공하지 않는다. 고정 fixture 수정 절차와도 구분한다. 비용·시간은 해당 실행의 관측치이며 일반화하지 않는다.
