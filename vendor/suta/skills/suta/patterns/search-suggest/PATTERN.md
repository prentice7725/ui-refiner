---
name: search-suggest
description: 검색창 자동완성 제안 목록(search autocomplete, suggest)을 구현한다 — 입력이 멈춘 뒤 한 번만 서버를 부르고, 늦게 온 옛 응답이 최신 결과를 덮지 않게 막으며, 방향키로 골라 Enter로 선택한다. "자동완성, 검색 추천, 서제스트, 추천 검색어 목록, 글자 치면 목록 뜨게" 요청에 쓴다. 기존 적용분의 호출 간격(디바운스)·항목 수 수정에도 쓴다.
---

# search-suggest — 검색어 자동완성

라이브 데모: https://guksu.github.io/suta/#/search-suggest

## 언제 쓰는가

검색창에 글자를 치면 아래로 제안이 떠오르고, 방향키로 골라 Enter로 선택하는 패턴. 검색·주소 입력·태그 고르기·사람 찾기처럼 **후보가 서버에 있고 목록이 입력에 따라 바뀔 때** 쓴다.

후보가 고정되어 있고 개수가 적으면(면 종류 4가지) select 패턴이 맞다 — 이 패턴은 "칠 때마다 목록이 달라진다"는 전제 위에 있다.

**기술 선택:** 네이티브 `<input>` + ARIA 콤보박스 패턴. 라이브러리를 쓰지 않지만, **속성 하나만 빠져도 스크린 리더에는 그냥 입력창으로 읽힌다** — 그래서 훅이 `inputProps`·`listProps`·`getOptionProps`로 묶어 내보낸다. 직접 쓰지 말고 펼치라는 뜻이다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/createSuggestSearch.ts` | 코어 — 디바운스·늦은 응답 차단·요청 취소 | 모든 프로젝트 |
| `assets/useSearchSuggest.ts` | React 훅 — 키보드 조작·ARIA 속성 묶음 | React 프로젝트만 |
| `assets/search-suggest.css` | 입력창·패널 드롭·활성 항목 | 모든 프로젝트 |

## 진짜 어려운 부분은 타이밍이다

모양은 쉽고, 무너지는 곳은 요청 타이밍이다.

| 함정 | 증상 | 코어의 처리 |
|------|------|------------|
| 글자마다 요청 | "국수집"을 치면 요청 3번 | 입력이 멈추고 200ms 뒤 한 번만 |
| **늦은 응답이 최신 결과를 덮음** | "국"의 결과가 "국수"의 결과 뒤에 도착해 화면이 되돌아감 | 요청마다 순번을 매겨 마지막이 아닌 응답은 버린다 |
| 끊기지 않는 요청 | 이미 쓸모없어진 요청이 서버·네트워크를 계속 점유 | 새 검색이 시작되면 `AbortSignal`로 끊는다 |
| 한 글자에 전체 검색 | "ㄱ"에 수만 건이 걸린다 | `minLength` 미만이면 아예 부르지 않는다 |

## 사용 방법 — React

```tsx
import { useSearchSuggest } from './useSearchSuggest'

const MenuSearch = () => {
  const search = useSearchSuggest<Menu>({
    fetchSuggestions: ({ query, signal }) =>
      fetch(`/api/menus?q=${encodeURIComponent(query)}`, { signal }).then((res) => res.json()),
    toText: (menu) => menu.name,
    onSelect: (menu) => goToMenu(menu.id),
  })

  return (
    <div className="suggest-root">
      <input {...search.inputProps} className="suggest-input" placeholder="메뉴 검색" aria-label="메뉴 검색" />

      {search.isOpen && (
        <ul {...search.listProps} className="suggest-panel">
          {search.status === 'loading' && <li className="suggest-message">찾는 중…</li>}
          {search.status === 'error' && <li className="suggest-message">불러오지 못했습니다</li>}
          {search.items.map((menu, index) => (
            <li key={menu.id} {...search.getOptionProps(index)} className="suggest-option">
              {menu.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

`fetch`에 **`signal`을 그대로 넘겨야** 요청 취소가 실제로 동작한다 — 넘기지 않으면 응답을 버리기만 하고 통신은 계속된다.

### 검색어 강조

일치하는 부분을 굵게 보이려면 `<mark>`로 감싼다(CSS가 노란 배경을 지우고 굵기만 남긴다). 사용자 입력이 정규식에 들어가므로 **반드시 이스케이프한다**:

```tsx
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query) return text
  return text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi')).map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : part,
  )
}
```

## 사용 방법 — 순수 JS (React 없음)

코어만 쓰고 목록은 직접 그린다:

```js
import { createSuggestSearch } from './createSuggestSearch.js'

const search = createSuggestSearch({
  fetchSuggestions: ({ query, signal }) => fetch(`/api/menus?q=${query}`, { signal }).then((r) => r.json()),
  onStateChange: ({ items, status }) => renderPanel({ items, status }),
})

input.addEventListener('input', (event) => search.setQuery(event.target.value))
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 기다리는 시간 | `debounceMs` | 200ms |
| 검색 시작 길이 | `minLength` | 1글자 |
| 패널 최대 높이 | `--suggest-max-height` | 18rem |
| 활성 항목 배경 | `--suggest-active-bg` | 옅은 회색(`--color-canvas`와 같은 값) |
| 드롭 속도 | `--suggest-duration` | 160ms |

`debounceMs`는 200ms 안팎이 무난하다 — 120ms 아래로 내리면 타이핑 중에도 요청이 나가고, 350ms를 넘기면 멈췄는데 반응이 없는 느낌이 든다.

## 주의사항

- **`aria-activedescendant` 방식이다** — 포커스는 입력창에 그대로 두고 "지금 선택된 항목"만 알린다. 방향키를 눌러도 포커스가 목록으로 옮겨 가지 않으므로 계속 타이핑할 수 있다.
- **항목 선택은 `mousedown`에서 한다.** `click`을 기다리면 그전에 입력창의 `blur`가 목록을 닫아 버려 클릭이 사라진다.
- **결과 없음을 목록에 넣을지 결정하라.** 이 훅은 항목이 0개면 패널을 닫는다(로딩·실패 중에는 연다). 그래서 결과가 없는 검색어를 계속 치면 패널이 닫혔다 열리며 내려오는 연출이 반복된다 — 신경 쓰이면 `search.status === 'ready' && search.items.length === 0`일 때 "검색 결과 없음"을 직접 그려 패널을 계속 열어 둔다.
- **검색어 강조에 정규식을 쓸 때는 이스케이프가 필수다** — 사용자가 `(`를 치는 순간 예외로 화면이 깨진다.
- **`role="listbox"`의 자식은 `role="option"`만 허용된다.** 로딩·실패 문구를 `<li>`로 넣을 때 `role`을 주지 않는 이유이며, 엄격하게 가려면 그 문구들은 목록 바깥의 `role="status"` 영역에 두는 편이 낫다.
- **reduced-motion 대응 내장** — 패널이 내려오는 연출만 사라지고 목록은 그대로 나타난다.
- 서버 부하가 걱정되면 코어의 디바운스 위에 **캐시**를 얹는다(같은 검색어의 결과를 Map에 기억). 이 패턴은 캐시를 넣지 않았다 — 유효기간 정책이 서비스마다 다르기 때문이다.
