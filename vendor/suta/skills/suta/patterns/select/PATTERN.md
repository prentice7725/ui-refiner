---
name: select
description: 네이티브 select를 대체하는 커스텀 셀렉트 박스(custom select, 콤보박스)를 구현한다 — 누르면 옵션 목록 패널이 펼쳐지고 하나 고르면 닫히며, 화살표 회전·키보드 내비게이션·ARIA를 갖춘다. "셀렉트 박스, 드롭다운 선택, 옵션 선택 UI, 폼 셀렉트 디자인 커스텀" 요청과 폼의 선택 입력을 디자인에 맞게 만들 때 쓴다. 기존 적용분의 패널 속도·높이·색 수정에도 쓴다.
---

# select — 커스텀 셀렉트

라이브 데모: https://guksu.github.io/suta/#/select

## 언제 쓰는가

네이티브 `<select>`의 옵션 패널은 OS가 그려서 디자인·애니메이션을 입힐 수 없다. 옵션에 아이콘·설명을 넣거나 패널 모션을 브랜드에 맞추려면 커스텀이 필요하다. 단, **커스텀은 키보드·스크린 리더 동작을 전부 직접 책임진다는 뜻이다** — 그 비용을 낼 이유(디자인 요구)가 없으면 네이티브 `<select>`가 항상 낫다. 이 패턴은 그 비용을 selectCore + Select 래퍼로 대신 지불한다.

**기술 선택:** WAI-ARIA "select-only combobox" 패턴 + CSS transition. 포커스는 항상 트리거 버튼에 있고 활성 옵션은 `aria-activedescendant`로만 가리킨다(옵션으로 포커스를 옮기면 스크롤·블러 관리가 복잡해진다). 키보드 판정은 DOM 무관 순수 함수로 분리해 테스트를 붙였다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/selectCore.ts` | 코어 — 키보드 하이라이트 이동 판정 (순수 함수) | 모든 프로젝트 |
| `assets/select.css` | 트리거·패널 드롭 모션·하이라이트/선택 표시 | 모든 프로젝트 |
| `assets/Select.tsx` | React 컴포넌트 (ARIA·키보드·바깥 클릭 닫기 포함) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다. React가 아닌 프로젝트에서는 selectCore + select.css를 쓰고 Select.tsx의 이벤트 배선을 참고해 직접 연결한다.

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { Select } from './Select'

const NOODLES = [
  { value: 'somyeon', label: '소면' },
  { value: 'jungmyeon', label: '중면' },
  { value: 'kalguksu', label: '칼국수면' },
]

const OrderForm = () => {
  const [noodle, setNoodle] = useState<string | null>(null)

  return <Select options={NOODLES} value={noodle} onChange={setNoodle} placeholder="면 종류 선택" />
}
```

키보드: `↓`/`↑`/`Enter`/`Space` 열기 → `↓ ↑ Home End` 하이라이트 이동 → `Enter`/`Space` 선택 → `Esc` 취소. 바깥 클릭·Tab 이탈 시 닫힌다.

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 패널 드롭 속도 | `--select-duration` (기본 200ms) |
| 배경·테두리 | `--select-bg`(#fff)·`--select-border`(#d4d9e1) |
| 하이라이트·선택 색 | `--select-highlight`(#f1f5f9)·`--select-accent`(#1b1e24) |
| 패널 최대 높이 | `--select-panel-max-height` (기본 240px — 넘으면 패널 안 스크롤) |
| 최소 폭 | `--select-min-width` (기본 200px) |
| 이름 | `label` 또는 화면 라벨의 id `labelledBy` (없으면 `placeholder`가 이름이 된다 — 콤보박스는 안의 글자를 이름으로 쓰지 않는다) |

## 주의사항

- **폼 제출에 값이 실리지 않는다** — 네이티브 `<select name>`이 아니므로, `<form>` 안에서 쓰려면 `<input type="hidden" name=… value=…>`를 함께 두거나 제출 시 상태에서 읽는다.
- **하이라이트와 선택은 다른 상태다** — 하이라이트(`data-highlighted`)는 키보드/호버가 가리키는 곳, 선택(`aria-selected`)은 확정된 값. 스타일을 합치면 키보드 사용자가 "지금 어디를 보고 있는지"를 잃는다.
- 패널은 언마운트하지 않고 `data-open`으로 여닫는다 — 닫힘 애니메이션이 공짜다. 조건부 렌더링으로 바꾸면 퇴장 모션이 사라진다.
- 패널은 트리거 아래 고정 배치다 — 화면 하단 요소에서 위로 펼쳐야 하면 `.select-panel`의 `top`을 `bottom: calc(100% + 6px)`로 바꾸고 `transform-origin: bottom`으로 뒤집는다. 자동 플립이 필요하면 위치 라이브러리 영역이다.
- 옵션이 아주 많으면(수백 개) 검색 입력이 있는 콤보박스나 가상 스크롤 영역이다 — 이 패턴 범위 밖.
- **reduced-motion 대응 내장** — 이동·확대를 끄고 페이드만 남긴다. 블록 제거 금지.
