# Hallmark · Impeccable 벤치마킹과 UI Refiner 적용안

작성일: 2026-10-25 (Asia/Tokyo). 공개 저장소의 문서와 구현을 읽어 비교한 조사다. 두 도구를 설치하거나 동일 앱에 실행한 성능·정확도 대결은 수행하지 않았다. 아래 우선순위와 설계안은 조사에 근거한 제안이며 아직 구현된 기능이 아니다.

| 대상 | 조사 기준 커밋 | 확인한 주요 범위 |
|---|---|---|
| Hallmark | `7ec868225c6caa040558c321ee0fefa0e73f83a8` | skill, gate 분류, 정적/렌더 linter, redesign, eval 문서 |
| Impeccable | `9fa16a06d8957fde5687984629fd028c9f2abf10` | README, skill 원본, Operate/critique 지침, Rust detector CLI·규칙 목록·디자인 시스템 코드 |
| UI Refiner | `dc7cb6d520adcc00a80ba8c50b3954925b3611a4` | 현재 로컬 설정, gate, 검사 범위, 예외, benchmark, agent protocol, 보고서 |

## 판단

UI Refiner의 다음 투자는 **제품·화면 맥락을 반영한 검토와 기능 보존 검증**에 두는 것이 좋다. 이미 있는 정적/브라우저 검사, PNG·ARIA 비교, 불변 증거, 부분 검사 판정과 SARIF를 유지하면서, 무엇을 위한 화면인지와 수정 중 무엇이 보존되어야 하는지를 명시해야 한다.

Hallmark에서 가져올 핵심은 변경 전후의 기능 계약 보존과 품질 판단의 층위 구분이다. Impeccable에서 가져올 핵심은 제품 사실·시각 시스템·개별 화면 목적의 분리와 목적별 작업 안내다. 테마 수나 규칙 수를 따라 늘리는 일은 우선순위가 낮다.

## 1. 실제로 확인한 특징

### Hallmark

신규 페이지 제작과 명시적으로 요청한 리디자인을 다루는 설계 workflow다. skill에는 자료 확인 → 화면 목적·구성 결정 → 방향 선택 → 제작 → 정적/렌더 검사 → 별도 검토가 연결되어 있다. 문서가 소개하는 48개 테마는 시각 재료를 선택하는 장치이며, 각 페이지의 내용과 배치는 별도로 결정한다. 이 숫자는 문서 기준이며 품질 측정치가 아니다. [skill 원본](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/skills/hallmark/SKILL.md)

gate를 Floor, Reflex, Finish로 나누고 기계 검사와 판단이 필요한 검사를 구분한다. 일부 취향 규칙도 자체 Floor에 포함한다. UI Refiner가 이 분류를 참고하더라도 특정 미학을 보편적 접근성 기준으로 승격시키면 안 된다. [gate 정의](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/skills/hallmark/references/gates.md)

특히 리디자인에서 내용과 동작을 먼저 기록하고 보존하는 방식이 유용하다. `--before` / `--kept`는 링크·필드·핸들러·테스트 훅 등의 변경을 비교한다. polish/restyle/full은 허용하는 변경 깊이를 다르게 한다. 정적 핸들러 기록은 실제 비즈니스 동작의 성공 증명과 구분해서 받아들여야 한다. [리디자인 계약](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/skills/hallmark/references/redesign.md), [linter 구현](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/skills/hallmark/scripts/sloplint.mjs)

렌더 구현에는 복수 너비 검사, 배경 픽셀을 이용한 대비 측정과 스크린샷 수집이 있다. 정적 linter의 무의존성 설명과 렌더 환경 의존성은 구분해야 한다. 렌더 모듈은 Puppeteer와 설치된 브라우저를 탐색한다. [렌더 코드](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/skills/hallmark/scripts/sloplint-render.mjs)

eval은 skill 텍스트를 API로 전달하는 실험과 실제 CLI를 구동해 지침 준수를 확인하는 실험을 구분한다. 이는 UI Refiner의 고정 fixture 수정 실험을 실제 에이전트 실험으로 확대할 때 좋은 기준이다. 문서의 과거 점수는 이번 버전의 재측정 결과로 간주하지 않았다. [eval 방법](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/eval/README.md)

### Impeccable

현재 README는 단일 skill 아래 24개 명령과 62개 결정적 규칙을 소개한다. 과거의 소규모 prompt 모음만으로 평가하면 현재 구조를 놓친다. 저장소에는 Rust CLI·검사 코어·브라우저·live·WASM 관련 모듈도 있다. 숫자는 README 설명으로 확인했으며 설치된 규칙 팩까지 포함한 실제 런타임 규칙 수를 실행 측정하지는 않았다. [README](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/README.md), [검사 코어](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/crates/core/src/lib.rs)

제품의 지속적 사실은 PRODUCT.md, 시각 시스템은 DESIGN.md, 개별 화면의 목적과 방향은 surface brief로 나눈다. Persuade/Operate/Read/Experience처럼 화면 목적에 따라 판단이 달라진다. 특히 Operate 지침은 시스템 글꼴·익숙한 탐색·밀도 높은 데이터 UI가 적절할 수 있음을 인정한다. UI Refiner의 웹앱 범위에 잘 맞는 관점이다. [skill 원본](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/skill/SKILL.src.md), [Operate 지침](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/skill/reference/operate.md)

규칙 카탈로그를 `detect --list-rules`로 공개하고 scope와 advisory 필터를 제공한다. DESIGN.md/sidecar 문맥을 검사에 반영하는 코드도 있다. 이 기능을 UI Refiner에 적용할 때는 자연어에서 추론한 값이 승인된 정책을 자동으로 덮어쓰지 않도록 설계하는 편이 낫다. [규칙 목록 구현](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/crates/detect/src/list_rules.rs), [디자인 시스템 해석](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/crates/detect/src/design_system.rs)

critique 지침은 디자인 판단과 detector 증거를 독립적으로 수집한 뒤 합치려 한다. 판단이 검사 경고에 끌려가는 현상을 줄이는 설계다. 여기서는 그 workflow를 분석만 했고 해당 skill을 활성화하거나 하위 에이전트를 실행하지 않았다. [critique 지침](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/skill/reference/critique.md)

## 2. 현재 UI Refiner와의 차이

다음 표의 ‘보완’은 확인한 현재 코드에 대한 판단이다. 경쟁 도구 전체 기능의 부재를 주장하는 표가 아니다.

| 비교 축 | 확인한 참조 방식 | UI Refiner 현재 상태 | 적용 판단 |
|---|---|---|---|
| 제품 맥락 | Impeccable의 제품/시각/화면 문서 분리 | `sot.path` 존재 확인, 본문은 agent가 읽음 | 구조화한 context 참조와 출처·불명 값을 추가 |
| 화면 목적 | Impeccable의 surface mode, Hallmark의 page/app/component 범위 | `preset=web`과 route 설정 중심 | 랜딩/작업 화면/문서/컴포넌트의 리뷰 기준 분리 |
| 변경 범위 | Hallmark polish/restyle/full 계약 | agent protocol에서 SOT 보존 요구 | 허용 변경과 보존 대상을 기계가 읽는 계약으로 제공 |
| 기능 보존 | Hallmark before/kept inventory | ARIA·이미지·finding 비교와 interaction plan | 링크·폼·이름·route·테스트 훅의 손실 비교 추가 |
| 규칙 탐색 | Impeccable 규칙 카탈로그 | 엔진별 규칙과 report coverage 존재 | 엔진·근거·검사 층위·한계를 단일 카탈로그로 노출 |
| 예외 | Hallmark tier/guard, Impeccable context/ignore | exact-value 예외와 baseline v2 존재 | 접근성 예외 범위를 넓히지 않고 판단 근거를 더 잘 표시 |
| 디자인 검토 | 양쪽 모두 제작·검토 workflow 포함 | VISUAL_REVIEW와 사람 검토, 자동 vision 호출 없음 | 독립 리뷰 입력/결과 형식 추가, advisory 유지 |
| 수정 인계 | 목적별 workflow와 피드백 루프 | 원인 그룹, 모든 target, 재현·PNG/ARIA 참조 | 기존 인계에 surface 목적·보존 위반을 결합 |
| 실험 | Hallmark의 API/실제 CLI 실험 분리 | 정상/결함 benchmark, 결정적 수정 fixture 실험 | 실제 에이전트 수정 성능은 별도 실험으로 측정 |
| 배포 경험 | 양쪽 모두 다양한 harness 설치 안내 | 소스 설치와 bundled engine 중심 | 핵심 검사 기능 이후 배포/설치 UX 개선 |

현재 상태의 근거: [설정과 지원 범위](../README.md), [기본값](../src/presets.mjs), [검사 분모와 한계](../src/inspection-scope.mjs), [설계 값 예외](../src/value-exceptions.mjs), [기존 인계 계약](../src/handoff.mjs), [실험 집계](../src/benchmark.mjs).

## 3. 다음 구현 순서 제안

다음 PR 번호는 이번 조사에서 제안하는 후속 순서이며 기존 계획 문서의 확정 항목을 의미하지 않는다.

### 제안 PR08 — 제품·화면 맥락과 보존 계약

제품 사실, 시각 시스템, route별 화면 목적을 분리해 참조한다. Markdown을 임의 파싱해 정책을 자동 생성하기보다, 기존 문서 경로와 검토된 구조화 값의 연결을 먼저 만든다. 제품 설명이 없으면 unknown으로 남기고 조회되지 않은 사실을 채우지 않는다.

- 예: `/pricing`은 설득, `/workspace`는 작업, `/docs`는 읽기 목적. 서로 다른 밀도·타이포 기준을 검토하되 기존 접근성 검사는 계속 실행한다.
- reference마다 파일/해시/명시적 승인 여부를 기록한다. context 변경은 관련 비교의 호환성에 반영한다.
- 변경 계약에는 보존할 문구·링크·폼·route·시각 토큰과 허용 변경 범위를 기록한다.
- 완료 조건: 같은 컴포넌트라도 화면 목적에 따라 advisory가 달라지고, SOT·기존 강제 정책·baseline ID가 조용히 바뀌지 않는다. 문서 누락과 상충은 명시한다.

### 제안 PR09 — 리디자인 기능 보존 비교

동일 route/state의 전후 inventory에 링크 목적지, 폼 action/method, field name/type/required, 핵심 accessible name, 테스트 훅과 주요 탐색 대상을 기록한다. `data-testid`는 실제 존재할 때만 수집한다.

URL host/port, 동적 ID, 순서 변화는 별도 정규화 규칙으로 다룬다. 선언적으로 보존하기로 한 필드의 손실과 정당한 제거를 구분한다. 전체 DOM 문자열 해시를 보존 검사로 쓰지 않는다.

정적 핸들러 존재나 ARIA 이름 일치는 서버 제출·비즈니스 동작 성공을 증명하지 않는다. 기존 명시적 interaction plan을 함께 실행하고, 검사하지 못한 동작은 unknown으로 남긴다.

- 완료 조건: 버튼 삭제·목적지 변경·필드 이름 손실은 탐지하고, class 변경·노드 재배치·동적 ID 교체는 승인된 의미가 유지되면 회귀로 단정하지 않는다.
- 기존 보고서와 불변 증거를 덮어쓰지 않는다. 실패/미완료 비교가 가짜 ‘보존 완료’를 만들지 않아야 한다.

### 제안 PR10 — 규칙 카탈로그와 목적별 agent 안내

우선 `rules --json` 같은 읽기 전용 인터페이스로 rule ID, engine, domain, static/render/interaction/manual, 강제 여부, 필요한 계약·타깃, 알려진 한계를 노출한다. 기존 두 엔진의 원래 ID와 결과는 유지한다.

그다음 agent protocol을 audit/critique/polish/harden 등 소수의 목적별 안내로 나눈다. 기존 `check`가 수행하는 필수 범위는 유지한다. 향후 `--domain`을 도입한다면 전체 PASS와 혼동하지 않도록 scope를 별도로 표시해야 한다.

- 완료 조건: ‘이 규칙을 왜 실행했는가’, ‘어떤 대상을 검사하지 못했는가’를 JSON으로 설명할 수 있다. advisory를 숨겨도 강제 판정은 바뀌지 않는다.

### 제안 PR11 — 근거가 분리된 디자인 리뷰 패킷

리뷰어에게 화면 목적·SOT·동일 상태 캡처를 주고 hierarchy, task clarity, density, typography, states, i18n을 검토하게 한다. 가능하면 먼저 시각 판단을 기록한 후 deterministic 결과와 합친다. review 출처와 실제 도구/모델 실행 여부를 기록한다.

리뷰 항목에는 target/evidence, 관찰, 이유, 제안, 확실성, 적용할 화면 목적을 둔다. 평균 ‘미적 점수’ 하나로 출시 판정을 대체하지 않는다. 사용하지 않은 모델·실행하지 않은 독립 평가를 수행했다고 표기하지 않는다. 자동 외부 모델 호출은 별도 기능·명시적 선택으로 다룬다.

- 완료 조건: 모든 개선 제안이 실제 증거 또는 명시적 수동 판단으로 추적되고, 근거 없는 지적이 자동 blocker나 suppression으로 변하지 않는다.

### 제안 PR12 — 같은 조건의 비교 실험

공통 과제 묶음을 두고 도구 지침의 효과를 비교한다. 적어도 랜딩·작업 UI·문서·폼과 KO/JA 긴 문구를 포함한다. 정상 대조군과 결함군, 기존 브랜드를 유지하는 과제를 함께 둔다.

검출기 비교와 에이전트 workflow 비교를 나눠야 한다. 서로 다른 목적의 경고 전체를 같은 정답 집합으로 평가하면 스타일 선호가 정확도로 포장된다.

| 실험 | 고정 조건 | 기록할 값 |
|---|---|---|
| 공통 결함 검출 | 같은 소스·렌더 상태·환경·공통 규칙 정의 | target 단위 TP/FP/FN, 미지원/unknown, 시간·메모리의 측정 범위 |
| agent 수정 | 같은 시작 커밋·모델/버전·예산·과제, 최대 수정 횟수 | 0회 통과, 예산 내 수정 성공, 시도·도구 실패·신규 회귀·SOT 위반 |
| 시각/과업 검토 | 동일 화면·뷰포트·테마, 도구명을 가린 평가 | 작업 수행·정보 위계·브랜드 보존·선호와 평가자 불일치 |

미지원은 정상 통과로 처리하지 않는다. 실제 에이전트 실험을 수행하기 전에는 현재의 결정적 fixture 수정 2건을 agent 성공률로 사용하지 않는다. 전체 과제 수, 제외 이유와 실패 실행도 함께 공개한다.

## 4. 선택해서 가져올 것

1. **기능 보존 inventory**: 검사 도구에서 수정 도구로 인계하는 현재 구조에 바로 맞는다.
2. **화면 목적과 맥락**: 데이터 테이블에 랜딩 페이지의 미학을 강요하는 오탐을 줄일 수 있다. 효과는 실험으로 확인해야 한다.
3. **규칙의 검사 층위 공개**: 정적 regex와 실제 브라우저 측정, 수동 판단을 같은 확실성으로 보여주지 않는다.
4. **독립 리뷰와 실제 agent 실험**: detector 통과와 디자인 개선을 각각 평가한다.

보라색·특정 글꼴·카드·고밀도 UI의 일괄 금지, 미학 점수로 출시 자동 승인, 48개 테마의 즉시 복제, live 편집기·이미지 생성·native 지원의 동시 확장은 현재 우선순위에 넣지 않는다. 승인된 브랜드와 DOM 웹앱 검사 범위를 기준으로 선택한다.

## 5. 외부 코드 도입과 판정 계약

Hallmark는 MIT, Impeccable은 Apache-2.0으로 표시된다. Hallmark 원본 LICENSE와 Impeccable의 별도 NOTICE도 확인했다. 향후 코드를 실제 복사할 때는 선택한 파일의 라이선스·제3자 고지·커밋·변경 패치를 함께 기록해야 한다. 이번 작업에서는 외부 런타임이나 skill을 설치·복사하지 않았다. [Hallmark LICENSE](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/LICENSE), [Impeccable 라이선스 안내](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/README.md#license), [NOTICE](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/NOTICE.md)

외부 검출기를 연결한다면 원래 종료 코드를 adapter에서 의미 단위로 매핑해야 한다. 현재 Impeccable detector는 성공 0/운영 실패 1/primary finding 2이며 UI Refiner의 0/결함 1/오류·미완료 2/부분 통과 3과 다르다. Hallmark 정적 linter도 자체 tier와 FAIL/REFLEX 기준으로 종료 코드를 만든다. 숫자를 그대로 UI Refiner gate에 전달하면 오류를 결함으로, 결함을 인프라 오류로 잘못 해석할 수 있다. [Impeccable CLI 구현](https://github.com/pbakaus/impeccable/blob/9fa16a06d8957fde5687984629fd028c9f2abf10/crates/detect/src/cli.rs), [Hallmark 종료 판정](https://github.com/Nutlope/hallmark/blob/7ec868225c6caa040558c321ee0fefa0e73f83a8/skills/hallmark/scripts/sloplint.mjs#L4421)

조사 범위 밖: 경쟁 도구의 실제 정확도·속도·모델 비용, 전체 테스트 성공 여부, 모든 설치 대상에서의 동작. UI Refiner와의 우열은 이번 소스 조사만으로 수치화하지 않는다.
