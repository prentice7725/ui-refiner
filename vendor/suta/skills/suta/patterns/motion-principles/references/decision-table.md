# 움직임 종류 → 토큰 → 담당 패턴 대응표

`PATTERN.md`의 원칙 표를 suta 패턴들에 실제로 어떻게 연결하는지 적는다. 왼쪽 열의 요청이 오면 오른쪽 패턴을 쓰고, 그 패턴의 공개 변수에 가운데 토큰을 넘긴다.

## 목차

- 등장·퇴장
- 화면 크기의 이동과 전환
- 제자리 이동·재배치
- 상태 피드백
- 진행·로딩
- 제스처 뒤 복귀(스프링)

## 등장·퇴장

| 요청 | 토큰(시간 / 이징) | 패턴 | 연결할 변수 |
|---|---|---|---|
| 요소가 나타나고 사라짐 | base / out (퇴장 ×0.75) | enter-exit | `--fx-duration`, `--fx-ease` |
| 툴팁·말풍선 | fast / out | tooltip | `--tooltip-duration` |
| 토스트·상단 배너 | base / out | toast-stack | `--toast-duration` |
| 스크롤에 따라 차례로 등장 | base / out + stagger | scroll-reveal | `--reveal-duration` |
| 길게 눌러 메뉴 | base / out | long-press-menu | `--lpm-duration` |

## 화면 크기의 이동과 전환

| 요청 | 토큰 | 패턴 | 연결할 변수 |
|---|---|---|---|
| 바텀시트 | slow / drawer | bottom-sheet | `--sheet-duration` |
| 모달 | slow / drawer | modal-dialog | `--modal-duration` |
| 햄버거 패널 | slow / drawer | hamburger-menu | `--drawer-duration` |
| 페이지 전환 | page / out | page-transition | `--page-transition-duration` |
| 카드 → 상세 확장 | page / drawer | card-expand | `--card-expand-duration` |
| 라이트박스 확대 | slow / drawer | zoom-lightbox | `--zoom-duration` |
| 테마 전환(원 확산) | page / out | theme-toggle | (패턴 내부 고정, 필요 시 CSS 덮어쓰기) |

## 제자리 이동·재배치

| 요청 | 토큰 | 패턴 | 연결할 변수 |
|---|---|---|---|
| 탭 밑줄 이동 | base / out | tab-indicator | `--tab-indicator-duration` |
| 세그먼트 알약 이동 | base / out | segmented-control | `--segment-duration` |
| 목록 재배치(FLIP) | 거리 기준 / in-out | flip-list | (훅 옵션 `durationMs`) |
| 카드 묶음 펼침 | page / drawer + stagger | card-stack | `--stack-duration` |
| 아코디언 펼침 | base / out | accordion | `--accordion-duration` |
| 캐러셀 스냅 | 브라우저 스냅(시간 없음) | carousel | — |

## 상태 피드백

| 요청 | 토큰 | 패턴 | 연결할 변수 |
|---|---|---|---|
| 버튼 눌림 | instant~base / out | press-feedback | `--press-release`(복귀 시간) |
| 좋아요 팝 | base / overshoot | like-pop | `--like-pop-duration` |
| 체크·라디오 | fast / overshoot | checkbox-radio | `--check-duration` |
| 토글 스위치 | fast / out | switch | `--switch-duration` |
| 폼 오류 흔들림 | base / (패턴 고유 shake 곡선) | form-shake-error | `--shake-duration` |
| 장바구니로 날아감 | slow / in-out | cart-fly | (패턴 옵션 `durationMs`) |

## 진행·로딩

| 요청 | 토큰 | 패턴 | 연결할 변수 |
|---|---|---|---|
| 숫자 카운트업 | 600~800ms / out | count-up | (옵션 `durationMs`) |
| 진행 링 | 600ms / out | progress-ring | `--ring-duration` |
| 스켈레톤 시머 | 1.4s / linear(반복) | skeleton | `--skeleton-speed` |
| 스토리 진행 | 내용 길이 / linear | story-progress | (옵션 `durationMs`) |
| 로딩 버튼 | base / out | loading-button | `--loading-button-duration` |

## 제스처 뒤 복귀(스프링)

시간·이징 대신 스프링 설정(`SPRING` 프리셋)을 쓴다. 옆에서 같이 움직이는 백드롭 페이드는 `springDuration`으로 길이를 맞춘다.

| 요청 | 프리셋 | 패턴 |
|---|---|---|
| 드래그 놓으면 제자리 | settle (170/26) | spring-physics |
| 뷰어 끌어내려 닫기 | settle | swipe-dismiss-viewer |
| 가장자리 스와이프 뒤로가기 | critical (거의 임계, 300/34) | edge-swipe-back |
| 당겨서 새로고침 복귀 | CSS `--ptr-duration` slow / out | pull-to-refresh |
