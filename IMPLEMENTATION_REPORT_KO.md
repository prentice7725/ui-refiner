# UI Refiner 0.2.1 — 재구성 보고서

## 결정

이 패키지는 **일반 웹앱 DOM UI 전용**이다. 별도의 게임 UI 연구는 `Game UI Research`로 분리하며 구현 의존성과 승인 상태를 공유하지 않는다.

## 구현된 범위

- suta의 디자인 패턴/정적 검사기 연동, lintapple의 브라우저 기반 레이아웃·접근성 검사 연동
- 웹 UI 단일 `web` 설정만 허용; 게임 UI 프리셋은 명시적으로 거부
- JSON/Markdown QA 결과, 검사 실패 및 인프라 오류 분리, 위반 기준선, 수정 체크리스트, 선택적 스크린샷
- SOT 경로 검증/디자인 정책 설정; SOT 문서를 자동 파싱하거나 AI가 스스로 변경하지는 않음
- 에이전트 스킬은 DOM 웹 UI 구현과 QA에만 작동

## 구현하지 않은 범위

- 게임 HUD/게임 메뉴, Godot Control, Phaser Canvas 검사
- 이미지 렌더링 비교와 자동 시각 디자인 점수
- LLM의 자동 UI 생성/수정/반복 실행 루프
- 원본 저장소의 전체 소스 벤더링 및 57개 패턴의 내장 복제

## 검증

Node 단위/계약 테스트는 자동으로 실행하며, 실제 npm 설치/브라우저 기반 종단 간 통합 테스트는 이 배포 환경에서 미검증이다. Node >=22.18을 사용하는 별도 환경에서 테스트 후 운영 승인해야 한다.

## 다음 단계

일반 웹 관제나 자산 관리 웹 UI 한 화면에 시범 도입하여 실제 suta 검사, lintapple Chromium 검사, 스크린샷, A11y 검증과 장기 유지보수를 확인한다. 게임 UI 방향은 별도 연구 Gate를 통과한 뒤 전용 구현 여부를 결정한다.

## 프로젝트 식별자

- GitHub: https://github.com/prentice7725/ui-refiner
- npm 패키지·CLI: `ui-refiner`
- 에이전트 스킬: `ui-refiner-agent`
- 설정 파일: `ui-refiner.config.json`
- 증거 폴더: `artifacts/ui-refiner/`
