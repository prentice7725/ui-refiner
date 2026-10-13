# enter-exit 엣지 케이스

## transitionend 버블링

`Presence`는 자식 요소에서 `transitionend`/`animationend`를 듣는다. 자식 **내부** 요소에 별도 transition이 있으면 그 이벤트가 버블링되어 퇴장이 조기에 끝날 수 있다. 해결: 내부 transition을 제거하거나, 퇴장 duration을 내부 것보다 길게 두지 말고 같게 맞춘다. 근본적으로는 timeoutMs 폴백이 있어 "안 사라지는" 사고는 없다 — 조기 종료만 조심하면 된다.

## 이벤트가 유실되는 환경

- `display: none` 전환, 백그라운드 탭, 콘텐츠가 transition 없이 렌더링되는 경우 `transitionend`가 아예 오지 않는다. `timeoutMs` 폴백이 이를 위한 안전망이므로 폴백 제거 금지.

## 재진입 (빠른 토글)

exiting 중 `show`가 다시 true가 되면 언마운트 없이 entering으로 되돌아간다. 토글을 연타해도 요소가 사라졌다 다시 마운트되지 않는다 — 입력 포커스·스크롤 위치가 보존된다.

## 리스트 아이템에는 부적합

여러 항목이 동시에 나가고 들어오는 리스트(추가/삭제/정렬)는 항목별 Presence로는 재배치 애니메이션이 안 된다 — FLIP 계열 패턴이 필요한 영역이다(추후 별도 패턴).
