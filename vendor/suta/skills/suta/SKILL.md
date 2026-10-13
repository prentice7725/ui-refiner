---
name: suta
description: 웹 프론트엔드 UI를 만들거나 고칠 때 AI 슬롭(AI slop) — 모든 것을 감싼 카드와 제각각인 여백, 기본 파랑·연노랑·주황을 뿌린 색, 아무 데나 붙인 transition, 레이아웃을 흔드는 애니메이션, 동작 줄이기 설정 무시, 키보드로 못 쓰는 컴포넌트처럼 AI가 만든 티가 나는 UI — 을 없앤다. 이를 막는 레이아웃·색·모션 기준과 검증된 UI 패턴 57종의 코드(모달·바텀시트·토스트·드롭다운·캐러셀·탭·폼·제스처)를 제공한다. "로그인·목록·상세·설정·채팅 화면 만들어줘, 페이지 구현, 컴포넌트 추가, 레이아웃·여백 다듬어줘, 버튼 애니메이션 넣어줘, 인터랙션 다듬어줘, 모바일 제스처, AI 티 안 나게" 요청과 UI, landing page, screen, layout, spacing, component, modal, dropdown, toast, animation, keyboard accessibility 작업에 쓴다. 화면이 없는 백엔드·데이터·문서 작업에는 쓰지 않는다.
---

# suta — AI 슬롭 없는 UI

AI에게 UI를 맡기면 어디서 본 듯한, 티 나는 결과가 나온다. 모든 섹션을 카드로 감싸고 간격을 한 값으로 맞추고, 그라데이션과 배지로 꾸민다. 장식을 걷어 내도 흰 바탕에 선만 남고, 강조색은 프레임워크 기본 파랑이고, 상태마다 연노랑·주황·연두 알약을 붙이고, 같은 정보와 버튼을 두세 곳에 반복하고, 글자는 작고 흐리다. 모든 요소에 `transition: all`을 붙이고, `height`·`top`을 움직여 화면이 버벅이고, 동작 줄이기 설정을 무시하고, `div`에 `onClick`을 달아 키보드로 쓸 수 없게 만든다. 이 스킬은 그런 UI가 나오지 않게 한다. 아래 금지선을 지키고, 검증된 패턴 57종(테스트·접근성·reduced-motion을 갖춘 코드)을 프로젝트에 맞게 가져다 쓴다.

수타(手打)는 기계가 아니라 손으로 친다는 뜻이다. 찍어낸 UI가 아니라 손으로 다듬은 UI를 목표로 한다.

## 폴더 지도

| 경로 | 내용 |
|---|---|
| `SKILL.md` | 이 문서 — 작업 절차, 금지선, 레이아웃·모션 값, 패턴 카탈로그 |
| `patterns/{패턴}/PATTERN.md` | 패턴 설명서 — 언제 쓰는가, 왜 이 기술인가, 파일 표, 사용법(React / 순수 JS), 커스터마이즈, 주의사항 |
| `patterns/{패턴}/assets/` | 복사해 쓰는 코드 — 프레임워크 무관 코어(.ts, 의존성 0) + React 래퍼(.tsx) + CSS |
| `scripts/audit.mjs` | 통합 검사 — 레이아웃·모션 규칙을 한 번에 돌린다. 편집 후 검사 훅(`scripts/post-edit-hook.mjs`)도 같은 검사를 쓴다 |

## 작업 절차

1. **프로젝트를 먼저 읽는다.** 프레임워크(React·Vue·Svelte·순수 JS), TypeScript 여부, 스타일 방식(CSS 파일·CSS Modules·Tailwind), 기존 디자인 토큰과 컴포넌트를 확인한다. 이미 있는 체계는 값의 출처다 — 패턴은 그 위에 얹는다. 다만 금지선에 걸리는 색·구조까지 지키지는 않는다. 기존 화면을 다듬는 일이면 숫자만 고치고 끝내지 않는다(2단계).
2. **기존 화면을 고칠 때는 덜어내기부터 한다.** 값(글자 크기·간격·반경)을 고치기 전에 화면마다 보이는 요소를 모두 적고 아래를 먼저 고친다. 값만 고치면 화면은 그대로다.
   - 같은 정보를 두 곳에 보여 준다(위 표시줄과 입력창에 같은 대상, 안내 상자와 입력창 아래에 같은 경고) → 한 곳만 남긴다.
   - 같은 행동의 입구가 둘 이상이다(빈 화면 버튼·입력창 버튼·표시줄 아이콘이 모두 "선택") → 화면 유형의 자리 하나에 둔다.
   - 위·아래에 고정된 줄이 여럿이다 → 머리 한 줄 + 입력·주 행동 한 줄. 나머지는 내용 안으로 옮기거나 뺀다.
   - 색 배지·상태 알약·색 아바타·옅은 색 상자 → 글자·아이콘·정렬로 바꾼다.
   - 유채색을 센다. 강조색 + 오류 빨강을 넘으면 줄인다(3·4단계). 시세 화면의 상승·하락 색 짝과 메달·코인 같은 보상 그림의 금·은·동은 따로 센다.
3. **순서부터 정한다.** 화면에 들어갈 요소를 적고 순위를 매긴다. 1순위는 하나다. 넣을 이유를 한 문장으로 말할 수 없는 요소는 뺀다. 그 순서를 크기·굵기·간격·정렬로 보이고, 카드·그라데이션·배지는 마지막에 한두 곳만 쓴다(`patterns/layout-principles/PATTERN.md`). 홈·목록·상세·검색·폼·설정·장바구니·대시보드·랜딩·AI 채팅·쇼핑 앱(커머스)·증권(시세·주문)·게이미피케이션(포인트·출석·순위·배지)처럼 유형이 있는 화면은 `patterns/layout-principles/references/screen-conventions.md`에서 그 유형의 뼈대부터 가져온다. 잘 만든 앱들이 공통으로 쓰는 구조다. 앱 화면이면 같은 문서의 "하단 탭 바(GNB)"(어느 화면에 둘지), 앱 안 웹뷰면 "모바일 웹뷰·웹앱"(안전 영역·높이·입력칸·뒤로 가기)도 함께 읽는다.
4. **톤(글자·색·면)을 정한다.** UI의 유채색은 강조색 하나 + 오류 빨강까지다 — 잘 만든 서비스 31곳 중 25곳(81%)이 UI에 체계 색을 2종 이하로 쓴다. 프로젝트에 색·글꼴 체계가 있으면 그것을 쓰되, 상태마다 색(주의 주황·완료 초록·정보 파랑)과 옅은 색 바탕 짝을 둔 팔레트는 줄인다. 없으면 강조색 하나를 서비스 성격(업종·이름·내용)에서 고르고 이유를 한 줄 남긴다. 요청에 그런 근거가 없으면(이름 없는 로그인·관리 화면 등) 토큰 기본값인 거의 검정을 쓴다 — 근거 없이 고른 색은 파랑이든 청록이든 기본값으로 보인다. 시세·손익 화면의 상승·하락 색은 상태 색이 아닌 의미 색 짝이다 — 국내는 상승 빨강·하락 파랑(`--color-rise`·`--color-fall`)이고 늘 부호(+·−)나 ▲▼와 함께 쓴다. 게이미피케이션의 메달·트로피·코인·1~3위 표시는 보상 그림의 색(`--color-reward` 금·은·동)으로 칠하고, 글자·버튼·면에는 쓰지 않는다. 글자 색 3단계·면 2단계·상태 색·등락 색은 `patterns/layout-principles/assets/layout-tokens.css`의 색 역할(`--color-*`)을 쓴다. 기준은 `patterns/layout-principles/references/tone.md`에 있다.
5. **금지선을 확인한다.** 아래 "AI 슬롭 금지선"은 맞는 패턴이 없는 UI에도 적용된다.
6. **카탈로그에서 패턴을 고른다.** 요청을 화면 요소로 쪼개 맞는 패턴을 모두 고른다. 예: "국수집 주문 화면" → `quantity-stepper`(수량)·`bottom-sheet`(옵션)·`loading-button`(주문)·`toast-stack`(담김 알림). "쇼핑 앱 화면과 GNB" → `bottom-nav`(하단 탭)·`carousel`(배너)·`tab-indicator`(카테고리 탭)·`bottom-sheet`+`quantity-stepper`(구매 옵션)·`like-pop`(찜). "증권 사이트" → `search-suggest`(종목 검색)·`segmented-control`(지정가·시장가, 차트 기간)·`tab-indicator`(매수·매도·순위 탭)·`modal-dialog`(주문 확인)·`toast-stack`(체결 알림). "걷기·학습 리워드 앱" → `progress-ring`(오늘 진행)·`celebration`(목표 달성·배지 획득)·`count-up`(포인트)·`bottom-nav`(하단 탭)·`segmented-control`(순위 기간). 맞는 패턴이 없으면 금지선만으로 구현한다.
7. **고른 패턴의 `patterns/{패턴}/PATTERN.md`를 끝까지 읽는다.** 주의사항에 접근성·성능 함정이 적혀 있다.
8. **`assets/`를 프로젝트에 복사해 맞춘다.** PATTERN.md 파일 표의 "복사 대상"을 따른다.
   - 첫 줄이 `@shared-core`인 파일은 그 헤더를 지우지 않는다 — 같은 코드가 다른 패턴에도 들어 있다는 표시다.
   - JavaScript 프로젝트면 타입 표기만 벗긴다. 로직은 그대로다.
   - React가 아니면 코어(.ts)와 CSS만 쓰고, 상태 연결은 그 프레임워크의 방식으로 한다.
   - 다른 패턴의 코드가 필요하면 import 경로로 엮지 말고 그 파일을 함께 복사한다.
9. **값을 토큰에 연결한다.** 프로젝트에 기준이 없으면 `patterns/layout-principles/assets/layout-tokens.css`(간격·글자·굵기·반경·색)와 `patterns/motion-principles/assets/motion-tokens.css`(시간·이징)를 함께 넣는다. 컴포넌트에서는 숫자 대신 토큰을 쓰고, 패턴의 공개 변수(`--sheet-duration` 같은)를 토큰에 연결한다.
10. **검사한다.** `node <이 스킬 폴더>/scripts/audit.mjs <바꾼 파일·폴더>`를 실행해 error가 0이 될 때까지 고친다. 레이아웃·모션 규칙이 한 번에 돈다. warn은 원칙을 보고 판단한다. 검사는 코드의 값과 색만 본다 — error 0·warn 0이어도 정보·행동이 겹치거나 화면 유형의 뼈대와 다르면 끝난 것이 아니다. Node 22.18 이상이 필요하다. 실행할 수 없으면 `patterns/layout-audit/PATTERN.md`·`patterns/motion-audit/PATTERN.md`의 규칙표로 직접 확인한다.
   - 플러그인으로 설치했으면 파일을 고칠 때마다 같은 검사가 자동으로 돈다. 방금 바꾼 줄의 error만 돌려받으니 그 자리에서 고친다. 파일에 원래 있던 문제로는 멈추지 않는다.
   - 이 자동 검사는 파일 편집 도구(Write·Edit)로 고칠 때만 돈다. 셸(`cat > 파일 <<EOF`)로 파일을 쓰면 돌지 않는다. 화면 파일은 편집 도구로 쓰고, 끝에 통합 검사를 직접 돌린다.
11. **마무리 체크리스트를 확인한다**(아래).
12. **어떤 패턴을 왜 썼는지 1~2줄로 보고한다.**

## AI 슬롭 금지선

### 레이아웃

| AI가 흔히 하는 것 | 대신 | 근거 패턴 |
|---|---|---|
| 어떤 화면이든 같은 틀(히어로 → 카드 3장 → 버튼)로 짠다 | 화면 유형의 뼈대에서 시작한다 — 홈은 구역 제목 + 가로 줄, 상세는 사진 → 이름·가격 → 하단 고정 바, 설정은 라벨·값 행 | `layout-principles` |
| 모든 섹션·목록 행을 테두리+그림자+둥근 카드로 감싸고, 카드 안에 상자를 또 넣는다 | 간격·얇은 선·옅은 바탕으로 묶는다. 카드는 독립 단위에 한 겹만(아래 "글자·색·면") | `layout-principles`, `layout-audit` |
| 담기·구매·찜을 모두 채운 버튼으로 내용 중간에 둔다 | 주 행동은 채운 버튼 하나로, 상세·폼·시작 안내에서는 하단 고정 바에 둔다(폭 가득, 아래에 안전 영역). 보조 행동은 글자·아이콘 버튼(필요하면 윤곽선) — 잘 만든 앱 화면의 65%는 채운 버튼이 0개, 30%가 1개다. 쇼핑 상품은 옵션·수량을 구매를 누르면 올라오는 시트에서 고른다(수량을 본문 끝에 두지 않는다) | `layout-principles`, `bottom-sheet` |
| 보조 버튼마다 회색 채움 알약(저장·복사·요소 선택·다시 시도) | 글자 버튼·아이콘 버튼. 회색 채움은 입력칸·안내 상자에만 | `layout-principles` |
| 같은 정보를 두 곳에(위 표시줄과 입력창의 같은 대상, 안내 상자와 입력창 아래의 같은 경고), 같은 행동의 입구를 세 곳에 | 정보는 한 곳, 행동은 화면 유형이 정한 자리 하나 | `layout-principles` |
| 위에 고정된 줄을 3줄씩 쌓는다(머리·사이트·대상) | 머리 한 줄. 맥락 정보는 내용 안(첫 메시지·입력창의 첨부)으로 | `layout-principles` |
| 데스크톱 거래 화면에서 주문 패널을 호가·종목 정보 아래로 밀어, 스크롤해야 주문이 보인다. 현재가만 큰 카드에 따로 담는다 | 종목 머리 한 줄(이름·코드 → 현재가 → 등락) + 본문(차트) 열 \| 오른쪽 열 300~330. 주문 패널은 오른쪽 열 맨 위나 차트·호가·주문 세 열로, 1440 첫 화면 안에 | `layout-principles` |
| 하단 탭 바(GNB)를 모든 화면에 두고, 상세·장바구니에서는 그 위에 구매·주문 바를 또 쌓는다. 장바구니를 탭에 넣는다 | 탭 바는 탭의 첫 화면에만(홈 62%, 상세 5%, 장바구니·주문 6%). 상세·장바구니·주문은 머리에 뒤로 + 하단 고정 바 한 줄. 장바구니는 머리 오른쪽 아이콘 + 개수 배지(빨강 원) | `bottom-nav` |
| 목표 달성 축하를 별도 페이지로 옮겨 체크 표시와 통계 표를 늘어놓는다. 순위 1~3위를 다른 행과 똑같이 둔다 | 축하는 지금 화면 위 오버레이 — 큰 보상 그림 하나·한 줄 제목·보상·버튼 하나, 조각은 한 번(자주 생기는 작은 적립은 축하 대신 위쪽 토스트 한 줄). 순위는 1~3위를 금·은·동 메달 그림으로, 내 행은 강조색 옅은 바탕 + 목록 밖이면 하단 고정 줄 | `celebration`, `layout-principles` |
| 모든 간격이 같은 값 | 묶음 안 간격 ≤ 묶음 사이 간격의 1/2. 값은 4px 척도에서만 | `layout-principles` |
| 지표 숫자와 라벨이 비슷한 크기, 라벨까지 모두 굵게 | 숫자는 라벨의 2~3배. 굵기는 3종, 굵게는 영역마다 한 줄 | `layout-principles` |
| 그라데이션·글로우·글래스·채운 버튼을 여러 곳에 | 강한 효과와 채운 강조색 면은 화면마다 한 곳(주 행동). 같은 강조색의 약한 표현은 이어 써도 된다 | `layout-principles`, `layout-audit` |
| 카드마다 색 배지·알약 태그(상품 카드의 BEST·NEW·인기), 아이콘마다 색 원 배경 | 회색 글자나 옅은 테두리, 배경 없는 단색 아이콘. 상품 카드의 색은 할인율 빨강 하나 | `layout-principles` |
| 제목·문단을 모두 가운데 정렬, 금액을 왼쪽 정렬 | 왼쪽 선 하나. 가운데는 짧은 한 줄만, 금액은 오른쪽 한 열 + `tabular-nums` | `layout-principles` |
| 좁은 화면에서 열을 유지하고 글자를 9~11px로 줄인다 | 열을 줄인다. 글자 12px 이상, 모바일 본문 14px 이상, 누르는 영역 44px | `layout-audit` |
| 화면을 채우려 카드·이미지를 폭 가득 늘린다 | 최대 폭(글은 65ch)을 두고, 넓은 화면은 열을 더한다 | `layout-principles` |
| 사진 위에 글을 바로 얹고, 사진이 늘어난다 | 글은 사진 밖으로(얹을 때는 스크림). `aspect-ratio` + `object-fit: cover` | `layout-principles` |
| 반경·글자 크기 값이 제각각, 짧은 영어 더미로만 확인 | 토큰에서만 고른다. 가장 긴 값·빈 값·320px 폭으로 확인한다 | `layout-principles` |

### 글자·색·면

장식을 걷어 낸 뒤에도 남는 AI 티다. 잘 만든 앱 1,104장(색은 31곳 1,116장 실측)과 웹사이트 19곳에서 잰 기준이다(`patterns/layout-principles/references/tone.md`).

| AI가 흔히 하는 것 | 대신 | 근거 패턴 |
|---|---|---|
| 강조색을 정하지 않고 프레임워크 기본 파랑·남색·보라(`#2563eb`·`#4f46e5` 등)나 매번 같은 '안전한' 색을 쓴다 | 브랜드색, 없으면 서비스 성격에서 강조색 하나를 고르고 이유를 한 줄 남긴다. 근거가 없으면 거의 검정(토큰 기본값). 잘 만든 앱의 주 버튼 색은 서비스마다 다르다 | `layout-principles` |
| 강조색을 주 버튼에만 쓰고 나머지는 전부 회색 | 채운 면은 주 버튼 한 곳. 같은 강조색을 선택 상태(탭 밑줄·선택 칩·라디오·체크·켜진 스위치)·링크·핵심 숫자에 약하게 이어 쓴다 | `layout-principles` |
| 상자를 걷어 낸 뒤 흰 바탕 하나에 얇은 선만 둔다 | 면을 두 단계로 — 흰 면과 옅은 회색 바탕. 구역 사이 8px 띠, 회색 채움 상자(입력칸·안내), 회색 바탕 위 흰 묶음(설정·대시보드) 중 하나 이상 | `layout-principles` |
| 연노랑·살구·연민트·연파랑 바탕을 배지·안내·선택·첨부에 깐다 | 면은 흰 면과 옅은 회색만. 잘 만든 앱 화면의 87%는 옅은 색 면이 없다. 선택 상태 하나만 강조색 옅은 바탕을 쓸 수 있다 | `layout-principles`, `layout-audit` |
| 상태마다 색을 하나씩(주의 주황·완료 초록·정보 파랑·표시 노랑) — 한 화면에 유채색 4~5계열 | 무채색 + 강조색 하나 + 오류 빨강. 잘 만든 서비스의 81%가 UI 체계 색 2종 이하다. 주의·정보는 글자와 아이콘 모양으로 | `layout-principles`, `layout-audit` |
| 시세의 오름·내림을 오류 빨강이나 레퍼런스의 밝은 빨강·파랑(`#e8383d`·`#2272eb`, 흰 면 4.1~4.5:1)으로, 색만으로 보인다 | `--color-rise`·`--color-fall`(국내 상승 빨강·하락 파랑, 4.5:1 이상) + 부호·▲▼. 칠하는 곳은 등락액·등락률·손익뿐. 강조색·오류 빨강과 따로 센다 | `layout-principles` |
| 보상을 이모지 메달·트로피·불꽃(🥇🏆🔥)과 그라데이션 포인트 카드로 꾸미고, 배지는 모두 같은 선 아이콘을 회색 상자에 넣는다 | 보상 그림만 금·은·동(`--color-reward`, 흰 면 3:1 이상), 아이콘은 한 벌의 `trophy`·`medal`·`flame`. 얻은 배지는 보상 색 그림, 못 얻은 배지는 같은 모양 회색 + 자물쇠 + 진행. 포인트 숫자는 강조색이나 주 글자색 | `layout-principles` |
| 사람·모델·서비스마다 색 원 아바타(주황 C, 초록 G) | 무채색 아바타나 실제 로고. 이름 글자로 구분한다 | `layout-principles` |
| 카드에 테두리와 그림자를 함께 둔다 | 테두리·그림자 없이 바탕 톤 차이로(잘 만든 앱 카드의 71%). 그림자는 시트·메뉴·토스트처럼 떠 있는 것에만 | `layout-principles`, `layout-audit` |
| 설명·본문까지 14px 이하 회색으로 써서 화면이 흐리다 | 가장 많은 글자는 본문 16px(앱 15~16). 보조 크기(14px 이하)는 메타·시각·라벨에만 | `layout-principles` |
| 회색을 그때그때 새로 고른다 | 글자 색 3단계(주·보조·옅은)만, 모두 4.5:1 이상. 옅게 하면 굵기를 올린다 | `layout-principles` |
| 핵심 숫자·가격을 본문 크기로 설명 뒤에 둔다 | 1순위 하나를 본문의 1.5배 이상 굵게, 이름 바로 아래·자기 줄에(가격 24px 안팎, 합계 24~32px) | `layout-principles` |
| 상태(할인·오류·영업 중)를 회색 글자나 색 알약으로, 오류를 분홍 상자로 | 상태 색 글자(오류·할인 빨강, 완료·영업 중 초록). 배경 알약·색 상자는 씌우지 않는다. 오류는 그 자리에 빨강 아이콘 + 글자 + 글자 버튼(다시 시도) | `layout-principles` |
| 소셜 로그인 버튼을 모두 같은 흰 윤곽선으로 | 서비스 고유 색과 로고(카카오 노랑, Apple 검정, Google·네이버 흰 바탕 + 로고), 같은 높이·폭 | `layout-principles` |
| 이모지를 아이콘·상품 사진 대신 쓰거나, 아이콘을 그때그때 손으로 그린다(설정 톱니가 해처럼 보인다) | `patterns/layout-principles/assets/icons.ts`의 선 아이콘 한 벌(24 격자·선 1.75, React는 `Icon.tsx`). 없는 아이콘은 같은 출처에서 더한다. 사진이 없으면 같은 비율의 옅은 바탕 칸 | `layout-principles`, `layout-audit` |
| 모바일 화면을 넓은 창에서 흰 바탕에 좁은 열로 둔다 | 옅은 바탕 위 흰 열(최대 480~560px) 하나를 가운데, 하단 고정 바도 그 폭에. 넓은 화면용이면 열을 늘린다 | `layout-principles` |

### 모션

| AI가 흔히 하는 것 | 대신 | 근거 패턴 |
|---|---|---|
| `transition: all` | 움직일 속성을 이름으로 나열한다 | `motion-audit` |
| `width`·`height`·`top`·`left`·`margin` 애니메이션 | `transform`·`opacity`만 움직인다. 높이는 `grid-template-rows: 0fr → 1fr`, 위치 변화는 FLIP | `accordion`, `flip-list` |
| 모든 것에 300ms `ease` | 크기에 맞는 시간(아래 "모션 값")과 들어올 때 ease-out | `motion-principles` |
| 퇴장에 ease-in, 진입과 같은 길이 | 퇴장도 ease-out, 시간은 진입의 3/4 | `motion-principles` |
| 이동에 `linear` | linear는 진행률·스피너처럼 시간에 비례하는 것에만 | `motion-principles` |
| 장식용 무한 반복 | 하루에 100번 보는 것은 움직이지 않는다. 모션은 "무슨 일이 일어났는지" 알릴 때만 쓴다 | `motion-principles` |
| 축하에 계속 떨어지는 색종이·튀는 트로피, 동작 줄이기에서도 터진다 | 조각은 한 번(0.9초) 퍼지고 끝, 그림은 한 번 튀고 멈춘다. 동작 줄이기면 조각 없이 짧은 페이드만 | `celebration` |
| 목록 20개를 하나씩 늦게 등장 | 30ms 간격, 처음 10개까지만 | `motion-principles` |
| `setInterval`로 스타일 갱신 | CSS transition, 필요하면 `requestAnimationFrame` | `motion-audit` |
| 드래그를 놓으면 정해진 시간으로 튕겨 돌아감 | 놓는 순간의 속도를 이어받는 스프링 | `spring-physics` |

### 상호작용·피드백

| AI가 흔히 하는 것 | 대신 | 근거 패턴 |
|---|---|---|
| 눌러도 아무 반응이 없음 | 누르는 순간 살짝 줄어들고 놓으면 돌아온다 | `press-feedback` |
| 로딩은 스피너 하나, 연타하면 두 번 제출 | 자리를 잡는 스켈레톤, 진행 중에는 버튼을 잠근다 | `skeleton`, `loading-button` |
| 끌어서 닫기가 손가락을 따라오지 않음 | 드래그 중에는 손가락을 따라가고, 거리·속도로 닫을지 판정한다 | `bottom-sheet`, `swipe-dismiss-viewer` |
| 늦게 온 검색 응답이 최신 결과를 덮음 | 입력이 멈춘 뒤 한 번만 요청하고, 옛 응답은 버린다 | `search-suggest` |
| 무한 스크롤의 중복 호출·연쇄 로딩 | 미리 불러오되 중복·연쇄·실패 폭주를 막고, "더 보기" 버튼을 함께 둔다 | `infinite-scroll` |
| 제스처와 페이지 스크롤이 충돌 | `touch-action`으로 제스처 방향을 지정한다 | `bottom-sheet`, `swipe-to-delete` |
| 화면을 옮겨도 앞 화면의 토스트가 남는다. 토스트에 "보러 가기" 같은 버튼을 단다 | 화면이 바뀌면 토스트를 비운다(`clearToasts`). 토스트는 알림만 — 장바구니로 가는 길은 머리의 장바구니 아이콘(개수 배지가 바뀐다)이 맡는다 | `toast-stack` |
| 키보드가 올라오면 하단 탭 바가 따라 올라와 입력칸·제안 목록을 가린다 | 입력칸에 초점이 있는 동안 탭 바를 숨긴다 | `bottom-nav` |

### 접근성

| AI가 흔히 하는 것 | 대신 | 근거 패턴 |
|---|---|---|
| `div`에 `onClick` | `button`·`a`·`input`·`dialog` 같은 기본 요소 — 키보드와 스크린 리더가 그냥 된다 | `switch`, `checkbox-radio`, `modal-dialog` |
| 포커스 표시를 지움 | `:focus-visible`로 키보드 사용자에게만 보인다 | `dropdown-menu`, `quantity-stepper` |
| 모달·시트를 열어도 포커스·Esc·스크롤이 그대로 | 열면 포커스를 옮기고, Esc로 닫고, 배경을 `inert`로 막고, 닫으면 원래 자리로 포커스를 돌려준다 | `modal-dialog`, `bottom-sheet` |
| 알림·로딩 결과를 눈으로만 알림 | `role="status"`·`aria-live`로 읽어 준다 | `toast-stack`, `infinite-scroll` |
| 매초 바뀌는 값(걸음 수·타이머)이나 카운트업을 `role="status"`·`aria-live` 안에 둔다 — 바뀔 때마다 읽힌다 | 낭독 영역에는 사건(받았어요·목표 달성)만. 카운트업은 굴러가는 숫자를 숨기고 최종값만 읽힌다 | `count-up`, `celebration` |
| 동작 줄이기 설정을 무시 | 모든 CSS에 `@media (prefers-reduced-motion: reduce)` — 이동·확대를 끄고 짧은 페이드만 남긴다 | 모든 패턴 |
| 버튼·행의 이름을 보이는 글자와 다른 문장의 `aria-label`로 덮는다(호가 행·목록 행) | 이름은 보이는 글자로 시작한다. 덧붙일 설명은 뒤에 붙이거나 `aria-describedby`로(WCAG 2.5.3) | `layout-principles` |
| 마우스 호버로만 열리는 기능 | 키보드 포커스와 터치로도 열린다(길게 누르기·포커스) | `tooltip`, `long-press-menu` |
| 입력칸 확대를 막으려고 viewport에 `user-scalable=no`·`maximum-scale=1`을 넣는다 | 확대는 막지 않는다. 입력칸 글자를 16px 이상으로 하면 iOS가 확대하지 않는다 | `layout-audit` |

### CSS 구조

| AI가 흔히 하는 것 | 대신 | 근거 |
|---|---|---|
| 애니메이션 라이브러리부터 설치 | CSS로 되면 CSS로, 제스처·물리만 TypeScript로(의존성 0) | 모든 패턴 |
| 값을 곳곳에 하드코딩 | 공개 변수 `--{패턴}-xxx` + 내부 폴백 `--_xxx` | 모든 패턴 |
| 상시 `will-change` | 움직이기 직전 상태에서만 | `motion-audit` |
| 한국어 문구가 단어 중간에서 줄바꿈 | `word-break: keep-all` | 한국어 조판 |

## 레이아웃 값

| 무엇 | 값 |
|---|---|
| 간격 척도 | 4·8·12·16·24·32·48·64px — 묶음 안 8, 묶음 사이 24, 구역 사이 32(넓은 화면 48), 구역 사이 띠 8 |
| 글자 크기 | 12(하한)·14(모바일 본문 하한)·16(본문)·20(섹션 제목)·24(화면 제목)·32(핵심 수치)·40px — 한 화면에 4~5종. 가장 많은 글자는 16(앱 15~16), 설명·본문에 보조 크기를 쓰지 않는다 |
| 줄 간격 | 본문 1.5, 제목·수치 1.3. 자간은 건드리지 않는다 |
| 글자 색 | 주 `#1b1e24` · 보조 `#4b5260` · 옅은 `#646b77` — 흰 면·옅은 바탕 모두에서 4.5:1 이상. 이 세 단계만 |
| 면 | 흰 면 `#fff` + 옅은 바탕 `#f2f3f5`. 구역 사이 띠·회색 채움 상자·회색 바탕 위 흰 묶음. 카드는 테두리·그림자 없이 |
| 강조색 | 서비스마다 하나(`--color-accent`, 기본값은 거의 검정 — 바꾼다). 채운 면은 주 버튼, 약한 표현은 선택 상태·링크·핵심 숫자 |
| 상태 색 | 오류·할인 `#c8341f` · 완료·영업 중 `#13795b` — 글자로, 알약·색 상자 없이. 주의·정보는 색을 따로 두지 않는다 |
| 등락 색 | 상승 `#d0262d` · 하락 `#1b64da`(국내 관례, 해외는 상승 초록·하락 빨강) — 시세·손익에만, 늘 부호·▲▼와 함께. 강조색·상태 색과 따로 센다 |
| 보상 색 | 금 `#b07d00` · 은 `#7b8088` · 동 `#a8662b` — 메달·트로피·코인·1~3위 그림에만. 글자·버튼·면에는 쓰지 않는다(흰 면·옅은 바탕 3:1 이상, 금색 면 위 글자는 주 글자색) |
| UI 색 수 | 무채색 + 강조색 하나 + 오류 빨강(시세 화면은 등락 색 짝, 게이미피케이션은 보상 그림의 금·은·동을 더한다). 옅은 색 면은 선택 상태 하나에만 |
| 시세·자산 표 | 숫자 오른쪽 정렬 + `tabular-nums`, 행 40~48, 글자 14, 머리글 12~13 옅은 글자, 1px 선이나 선 없음. 줄무늬·행 바탕 칠하기 없음 |
| 굵기 | 400·600·700 |
| 모서리 반경 | 8(입력칸·버튼)·12(카드)·24px(시트) + 완전 둥근 것 |
| 폭·크기 | 글 덩어리 최대 65ch, 누르는 영역 44px, 입력칸·주 버튼 높이 48px |
| 이미지 비율 | 1:1·4:3·16:9 중 2~3개만, 한 목록은 한 비율 |
| 화면 뼈대 | 좌우 여백은 화면 하나에 한 값(16~24). 주 버튼 높이 48(44~56). 하단 고정 바는 아래 여백에 `env(safe-area-inset-bottom)`을 더한다(웹앱·웹뷰에서 홈 표시줄을 피한다) |
| 하단 탭 바(GNB) | 4~5칸(5칸이 가장 흔하다), 높이 56 + 안전 영역, 아이콘 24 + 라벨 12, 현재 탭만 강조색 채운 아이콘 + 굵은 라벨, 배지는 빨강 원 18(99+)·점 8 |
| 모바일 웹뷰 | viewport `width=device-width, initial-scale=1, viewport-fit=cover` · 화면 높이 `100dvh` · 입력칸 글자 16 이상 · 하단 고정 요소는 `env(safe-area-inset-bottom)` |
| 넓은 화면 | 본문 16(긴 글 18), 문단 65ch 이하, 가장 큰 글자는 한 곳만 48~64, 콘텐츠 최대 폭 1120~1280 |

전체 토큰과 원칙 12개, 반대로 읽히는 조언의 판단 기준은 `patterns/layout-principles/PATTERN.md`에 있다. 화면 유형별 뼈대와 값은 `patterns/layout-principles/references/screen-conventions.md`, 글자·색·면 기준은 `patterns/layout-principles/references/tone.md`에 있다.

## 모션 값

| 무엇이 움직이는가 | 시간 | 이징 |
|---|---|---|
| 색·불투명도 상태 변화(hover·pressed·포커스 링) | 100ms | ease-out `cubic-bezier(0.22, 1, 0.36, 1)` |
| 작은 요소의 등장·퇴장(툴팁·토글·체크) | 150ms | ease-out |
| 컴포넌트 전환(탭·아코디언·드롭다운·토스트) | 250ms | ease-out |
| 화면 크기의 이동(시트·모달·사이드 패널) | 350ms | drawer `cubic-bezier(0.32, 0.72, 0, 1)` |
| 화면 전환·카드 확장 | 420ms | drawer |
| 한 자리에서 다른 자리로(재배치·스냅) | 거리 기준 | in-out `cubic-bezier(0.65, 0, 0.35, 1)` |
| 살짝 넘쳤다 돌아옴(좋아요·체크 팝) | 150~250ms | overshoot `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| 축하(목표 달성·배지) | 패널 320ms · 그림 튀기 480ms · 조각 900ms 한 번 | 그림은 overshoot, 조각은 ease-out. 자주 생기는 작은 적립은 축하 대신 토스트 |

퇴장은 진입 × 0.75, 스태거는 30ms. reduced-motion에서는 1ms·80ms·120ms로 줄인다(0ms로 두면 `transitionend`가 오지 않는다). 전체 토큰과 고르는 원칙은 `patterns/motion-principles/PATTERN.md`에 있다.

## 마무리 체크리스트

- [ ] 1순위 요소가 하나다 — 가장 큰 글자 하나, 채운 주 버튼 하나. 보조 버튼은 글자·아이콘이다.
- [ ] 같은 정보·같은 행동이 한 곳에만 있다. 위에 고정된 줄은 한 줄이다.
- [ ] UI의 유채색이 강조색 + 오류 빨강을 넘지 않고(시세 화면의 등락 색 짝, 보상 그림의 금·은·동은 따로), 옅은 색 면(연노랑·살구·연민트)과 색 알약·색 아바타가 없다.
- [ ] 시세 화면이면 등락에 부호·▲▼가 붙고 `--color-rise`·`--color-fall`을 썼다. 데스크톱 종목 상세의 주문 패널이 첫 화면 안에 있다.
- [ ] 게이미피케이션 화면이면 축하는 지금 화면 위 오버레이 한 번(버튼 하나)이고, 1~3위·얻은 배지는 보상 색 그림, 못 얻은 배지는 회색 + 자물쇠다. 홈의 받기 버튼은 늘 그 자리에 있고(받을 것이 없으면 비활성 + 남은 조건), 연속 출석일·걸음 수 같은 숫자가 화면끼리 맞는다. 낭독 영역에 매초 바뀌는 값이 없다.
- [ ] 화면 유형의 뼈대를 따랐다 — 상세·폼·시작 안내의 주 행동은 하단 고정 바에 있다.
- [ ] 앱 화면이면 하단 탭 바는 탭의 첫 화면에만 있고, 하단 고정 바와 겹쳐 쌓이지 않는다. 키보드가 올라오면 숨는다.
- [ ] 모바일 웹뷰면 `viewport-fit=cover`·안전 영역·`100dvh`·입력칸 16px을 지켰고, 화면마다 주소가 있어 기기의 뒤로 가기가 동작한다.
- [ ] 아이콘은 한 벌(같은 크기·선 굵기)이고 이모지가 없다.
- [ ] 예시 데이터는 지어낸 것이다 — 대화·git 설정에 보이는 실제 이름·이메일·전화번호를 화면에 넣지 않았다.
- [ ] 상자 안에 상자가 없고, 묶음은 간격(묶음 안 ≤ 묶음 사이의 1/2)으로 보인다.
- [ ] 강조색을 정했고(이유 한 줄, 근거 없는 기본 파랑이 아니다), 채운 면은 주 행동 하나, 같은 색이 선택 상태·링크에 이어진다.
- [ ] 면이 두 단계다(흰 면 + 옅은 바탕). 카드에 테두리와 그림자를 함께 쓰지 않았다.
- [ ] 가장 많은 글자가 본문 크기이고, 글자 색은 세 단계 안에서만 골랐다.
- [ ] 간격·글자 크기·반경은 토큰(척도)에서만 골랐고, 글자는 12px 이상이다.
- [ ] 가장 긴 값·빈 값·320px 폭에서 깨지지 않는다.
- [ ] 움직이는 속성이 `transform`·`opacity`뿐이다(예외는 근거를 주석으로 남겼다).
- [ ] 새로 쓴 CSS마다 reduced-motion 블록이 있다.
- [ ] 클릭할 수 있는 것은 모두 키보드로 닿고, 포커스가 보인다.
- [ ] 열리고 닫히는 것(모달·시트·메뉴)은 Esc로 닫히고 포커스가 돌아온다.
- [ ] 상태 변화(저장됨·오류·로딩 끝)는 스크린 리더에도 전달된다.
- [ ] 통합 검사(`scripts/audit.mjs`) error가 0이고, `hue-count`·`tinted-surface`·`emoji-icon` warn이 없다. 검사가 깨끗해도 위 구조 항목은 직접 확인했다.

## 패턴 카탈로그

요청에 맞는 패턴을 고른 뒤 그 `PATTERN.md`를 읽는다. 요약은 각 PATTERN.md의 description 첫 문장이다.

<!-- catalog:start -->
### 등장과 전환

| 패턴 | 무엇을 하나 |
|---|---|
| [`enter-exit`](patterns/enter-exit/PATTERN.md) | React 요소의 진입/퇴장(enter/exit) 애니메이션을 구현한다. |
| [`scroll-reveal`](patterns/scroll-reveal/PATTERN.md) | 스크롤로 뷰포트에 들어올 때 요소가 차례로 나타나는 스크롤 등장 애니메이션(scroll reveal, fade in on scroll)을 구현한다. |
| [`sticky-header`](patterns/sticky-header/PATTERN.md) | 스크롤하면 큰 제목이 밀려 나가고 상단 고정 헤더에 작은 컴팩트 제목이 나타나는 스티키 헤더(sticky header)를 구현한다. |
| [`flip-list`](patterns/flip-list/PATTERN.md) | 리스트 정렬·필터·추가·삭제로 순서를 바꿀 때 항목들이 순간이동하지 않고 미끄러져 자리를 잡는 FLIP 재배치 애니메이션(list reorder animation)을 구현한다. |
| [`zoom-lightbox`](patterns/zoom-lightbox/PATTERN.md) | 썸네일을 누르면 그 요소가 화면 가운데로 커지는 라이트박스(lightbox) 확대 전환을 구현한다. |
| [`modal-dialog`](patterns/modal-dialog/PATTERN.md) | 화면 가운데 창을 띄우고 뒤 배경을 어둡게 잠그는 모달 다이얼로그(modal dialog) 컴포넌트를 구현한다. |
| [`spring-physics`](patterns/spring-physics/PATTERN.md) | 스프링 물리 모션 유틸(spring physics)을 구현한다. |
| [`theme-toggle`](patterns/theme-toggle/PATTERN.md) | 다크모드 전환(dark mode toggle)을 구현한다 — 누른 지점에서 원이 퍼지며 테마가 바뀌고, 선택은 저장되며, 고르지 않았으면 기기 설정을 따른다. |
| [`card-expand`](patterns/card-expand/PATTERN.md) | 카드가 제자리에서 자라나 상세 화면이 되는 공유 요소 전환(shared element transition)을 구현한다. |
| [`card-stack`](patterns/card-stack/PATTERN.md) | Apple Wallet식 카드 묶음(card stack)을 구현한다. |
| [`stretchy-header`](patterns/stretchy-header/PATTERN.md) | 상세·프로필·앨범 상단의 큰 커버 이미지 헤더(stretchy header)를 구현한다. |

### 로딩과 진행

| 패턴 | 무엇을 하나 |
|---|---|
| [`skeleton`](patterns/skeleton/PATTERN.md) | 로딩 중 콘텐츠 자리를 잡아주는 스켈레톤 UI(skeleton loader)와 시머(반짝임) 애니메이션을 구현한다. |
| [`count-up`](patterns/count-up/PATTERN.md) | 숫자가 목표값까지 굴러 올라가는 카운트업(count up) 애니메이션을 구현한다 — 잔액·포인트·통계 숫자에 쓴다. |
| [`story-progress`](patterns/story-progress/PATTERN.md) | 스토리 화면 상단의 구간별 진행 막대(story progress)를 구현한다. |
| [`loading-button`](patterns/loading-button/PATTERN.md) | 제출(submit) 버튼의 진행 상태 표시(loading button)를 구현한다. |
| [`infinite-scroll`](patterns/infinite-scroll/PATTERN.md) | 목록 끝에 닿으면 다음 페이지를 자동으로 불러오는 무한 스크롤(infinite scroll)을 구현한다 — 미리 로드하고, 중복 호출·연쇄 로딩·실패 폭주를 막는다. |
| [`virtual-list`](patterns/virtual-list/PATTERN.md) | 항목이 수천·수만 개여도 화면에 보이는 구간만 그리는 가상 스크롤 목록(virtual list, virtualized/windowing)을 구현한다. |
| [`progress-ring`](patterns/progress-ring/PATTERN.md) | 원이 채워지는 원형 진행률 표시(progress ring, 애플워치 활동 링) 컴포넌트를 구현한다. |

### 피드백

| 패턴 | 무엇을 하나 |
|---|---|
| [`press-feedback`](patterns/press-feedback/PATTERN.md) | 버튼·카드를 탭하면 살짝 쪼그라들었다(움츠러들었다) 통 하고 튕겨 돌아오는 프레스 피드백(button press 눌림 효과)을 구현한다. |
| [`toast-stack`](patterns/toast-stack/PATTERN.md) | 화면 하단(또는 상단 배너 위치)에 토스트(toast) 알림이 쌓이고 몇 초 뒤 스스로 사라지는 시스템을 구현한다. |
| [`like-pop`](patterns/like-pop/PATTERN.md) | 좋아요 하트가 토글 시 튀어오르고 게시물을 더블탭(double tap like)하면 큰 하트가 팡 터지는 인스타그램식 반응 애니메이션을 구현한다. |
| [`celebration`](patterns/celebration/PATTERN.md) | 목표 달성·레벨 업·배지 획득 순간에 지금 화면 위로 뜨는 축하 오버레이(celebration)를 구현한다. |
| [`cart-fly`](patterns/cart-fly/PATTERN.md) | 담기 버튼을 누르면 상품 이미지가 장바구니 아이콘으로 포물선을 그리며 날아가 들어가는 애니메이션(add to cart fly)을 구현한다. |
| [`tooltip`](patterns/tooltip/PATTERN.md) | 호버·포커스 시 잠시 뒤 떠오르는 툴팁(tooltip) 말풍선을 구현한다. |
| [`form-shake-error`](patterns/form-shake-error/PATTERN.md) | 잘못된 입력을 좌우로 흔들고(shake) 에러 메시지가 아래에서 밀려 올라오는 폼 검증 에러 피드백(form validation error)을 구현한다. |

### 내비게이션

| 패턴 | 무엇을 하나 |
|---|---|
| [`tab-indicator`](patterns/tab-indicator/PATTERN.md) | 탭을 바꿀 때 활성 탭 밑줄(tab indicator)이 옆으로 미끄러져 따라가는 애니메이션을 구현한다. |
| [`carousel`](patterns/carousel/PATTERN.md) | 캐러셀(carousel) 컴포넌트 — 스와이프로 옆으로 넘기면 한 장씩 딱 걸리는 스냅 슬라이더, 아래 점(도트) 내비게이션, 자동 넘김(autoplay)을 구현한다. |
| [`hamburger-menu`](patterns/hamburger-menu/PATTERN.md) | 햄버거 버튼(≡, 삼선 아이콘)이 X로 모핑하며 옆에서 사이드 드로어가 밀려 나오는 모바일 내비게이션(hamburger menu)을 구현한다. |
| [`page-transition`](patterns/page-transition/PATTERN.md) | 화면(라우트) 전환 애니메이션(page transition)을 구현한다 — 다음 화면이 오른쪽에서 밀려 들어오고 뒤로 가면 반대로 재생되며, 돌아오면 스크롤 위치가 복원된다. |
| [`dropdown-menu`](patterns/dropdown-menu/PATTERN.md) | ⋯ 버튼을 누르면 열리는 액션 드롭다운 메뉴(dropdown menu, kebab)를 구현한다. |
| [`glass-nav`](patterns/glass-nav/PATTERN.md) | 스크롤에 반응하는 유리 GNB(상단 내비게이션 바)를 구현한다. |
| [`bottom-nav`](patterns/bottom-nav/PATTERN.md) | 모바일 앱·웹뷰의 하단 탭 바(GNB, bottom navigation bar)를 구현한다. |

### 제스처

| 패턴 | 무엇을 하나 |
|---|---|
| [`bottom-sheet`](patterns/bottom-sheet/PATTERN.md) | 바텀시트(bottom sheet) 컴포넌트 — 아래에서 올라오는 시트를 구현한다. |
| [`pull-to-refresh`](patterns/pull-to-refresh/PATTERN.md) | 목록·피드를 맨 위에서 아래로 당기면 새로고침하는 pull to refresh 제스처(당김 저항·스피너·복귀)를 구현한다. |
| [`swipe-to-delete`](patterns/swipe-to-delete/PATTERN.md) | 리스트 항목을 옆으로 밀어 삭제하는 제스처(swipe to delete)를 구현한다 — 왼쪽으로 밀면 삭제 버튼이 드러나고, 끝까지 밀면 바로 삭제되며 행이 접혀 사라진다. |
| [`pinch-zoom`](patterns/pinch-zoom/PATTERN.md) | 피드 이미지를 두 손가락으로 벌려 확대하는 핀치줌(pinch to zoom)을 구현한다. |
| [`swipe-dismiss-viewer`](patterns/swipe-dismiss-viewer/PATTERN.md) | 전체화면 이미지 뷰어를 끌어내려 닫는 제스처(swipe to dismiss)를 구현한다. |
| [`drag-to-reorder`](patterns/drag-to-reorder/PATTERN.md) | 목록 항목을 잡고 끌어서 순서를 바꾸는 드래그 정렬(drag and drop reorder) 리스트를 구현한다. |
| [`long-press-menu`](patterns/long-press-menu/PATTERN.md) | 길게 누르면(long press) 항목이 살짝 떠오르고 뒤가 흐려지며 옆에 액션 메뉴가 나타나는 iOS식 미리보기 메뉴를 구현한다 — 데스크톱은 우클릭으로 열린다. |
| [`edge-swipe-back`](patterns/edge-swipe-back/PATTERN.md) | iOS swipe back — 화면 왼쪽 가장자리를 오른쪽으로 끌어 뒤로가기 하는 인터랙티브 제스처를 구현한다. |

### 컨트롤

| 패턴 | 무엇을 하나 |
|---|---|
| [`select`](patterns/select/PATTERN.md) | 네이티브 select를 대체하는 커스텀 셀렉트 박스(custom select, 콤보박스)를 구현한다. |
| [`accordion`](patterns/accordion/PATTERN.md) | 아코디언(accordion) 컴포넌트 — 눌러서 펼치고 접는 목록을 구현한다. |
| [`switch`](patterns/switch/PATTERN.md) | iOS 스타일 토글 스위치(toggle switch)를 구현한다 — 썸이 미끄러지고 트랙 색이 바뀌는 온오프 입력, 네이티브 input 기반이라 키보드·폼 연동이 된다. |
| [`floating-label`](patterns/floating-label/PATTERN.md) | 라벨이 플레이스홀더 자리에 있다가 입력창을 누르거나 글자를 치면 위로 떠올라 작아지는 플로팅 라벨 입력 필드(floating label input)를 구현한다. |
| [`checkbox-radio`](patterns/checkbox-radio/PATTERN.md) | 체크박스(checkbox)·라디오(radio) 버튼 컴포넌트 구현 |
| [`otp-input`](patterns/otp-input/PATTERN.md) | 인증번호(OTP) 칸 입력을 구현한다 — 한 글자를 치면 다음 칸으로 넘어가고, 빈 칸에서 지우면 앞 칸으로 돌아가며, 복사한 코드를 붙여넣으면 칸마다 하나씩 나뉜다. |
| [`search-suggest`](patterns/search-suggest/PATTERN.md) | 검색창 자동완성 제안 목록(search autocomplete, suggest)을 구현한다. |
| [`range-slider`](patterns/range-slider/PATTERN.md) | 두 손잡이로 최소·최대 구간을 고르는 범위 슬라이더(range slider, 가격·기간 필터) 컴포넌트를 구현한다. |
| [`quantity-stepper`](patterns/quantity-stepper/PATTERN.md) | 수량 조절 스테퍼(quantity stepper, − / + 버튼) 컴포넌트를 구현한다. |
| [`file-upload`](patterns/file-upload/PATTERN.md) | 파일 끌어다 놓기 업로드(file upload, drop zone) 영역을 구현한다. |
| [`segmented-control`](patterns/segmented-control/PATTERN.md) | iOS 스타일 세그먼트 컨트롤(segmented control) 컴포넌트를 구현한다. |
| [`wheel-picker`](patterns/wheel-picker/PATTERN.md) | iOS 드럼 휠 피커(wheel picker)를 구현한다. |

### 표면과 스타일

| 패턴 | 무엇을 하나 |
|---|---|
| [`glass-surface`](patterns/glass-surface/PATTERN.md) | 뒤 배경이 흐릿하게 비치는 반투명 유리판 글라스모피즘(glassmorphism) 카드·헤더·내비게이션 바를 구현한다. |

### 원칙과 검토

| 패턴 | 무엇을 하나 |
|---|---|
| [`motion-principles`](patterns/motion-principles/PATTERN.md) | 앱 전체의 애니메이션 시간·이징·스태거·reduced-motion 기준을 한 벌의 토큰(motion tokens)으로 정하고, 어떤 움직임에 어느 값을 쓰는지 고르는 원칙을 제공한다. |
| [`motion-audit`](patterns/motion-audit/PATTERN.md) | 프로젝트의 CSS·JS를 훑어 애니메이션 문제(크기·위치 속성 transition, transition: all, reduced-motion 누락, 시간 범위 밖, 이동에 linear, 퇴장에 ease-in, 무한 반복, setInterval 애니메이션)를 file:line으로 찾아 고치는 방법까지 알려주는 검사 도구(motion audit)다. |
| [`layout-principles`](patterns/layout-principles/PATTERN.md) | 화면의 순서·위계·묶음·정렬·강조를 정하는 레이아웃 원칙 12개, 화면 유형별 관례 17종(홈·목록·폼·설정·대시보드·AI 채팅·쇼핑 앱·증권·게이미피케이션, 하단 탭 바·웹뷰), 간격·글자·색·반경 토큰(layout tokens)과 선 아이콘 한 벌을 제공한다. |
| [`layout-audit`](patterns/layout-audit/PATTERN.md) | CSS·JSX·HTML에서 AI가 흔히 만드는 레이아웃 문제를 file:line으로 찾는 정적 검사 도구(layout audit)다. |
<!-- catalog:end -->

## 쓰지 않는 경우·한계

- 화면이 없는 작업(API·데이터·문서·배포)에는 쓰지 않는다.
- 이 스킬은 레이아웃·글자·색·모션·상호작용·접근성을 다룬다. 프로젝트에 디자인 체계(간격·글자·색·글꼴)가 있으면 그 값을 쓰고, 순서·묶음·정렬·강조의 원칙만 이 스킬을 따른다. 체계가 없을 때만 이 스킬의 토큰(색 역할 포함)을 기본값으로 쓴다.
- 패턴 코드는 React와 순수 TypeScript로 쓰여 있다. 다른 프레임워크는 코어와 CSS를 가져가 연결 부분만 새로 쓴다.
- 검사는 소스 텍스트를 읽는 정적 검사다. 글자 대비·누르는 영역·좁은 폭 넘침과 실제 동작은 브라우저에서 확인한다.
