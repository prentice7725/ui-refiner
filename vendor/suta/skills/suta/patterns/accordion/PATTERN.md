---
name: accordion
description: 아코디언(accordion) 컴포넌트 — 눌러서 펼치고 접는 목록을 구현한다. 질문을 누르면 답이 아래로 펼쳐지고 화살표가 돌며, 하나만 열리거나 여러 개 열리게 할 수 있다. "아코디언, FAQ 접기 펼치기, 펼쳐지는 목록, 접이식 섹션, 토글 섹션" 요청과 질문 목록·상세 스펙·설정 그룹 UI에 쓴다. 기존 적용분의 속도·단일/다중 열림 수정에도 쓴다.
---

# accordion — 아코디언 펼침

라이브 데모: https://guksu.github.io/suta/#/accordion

## 언제 쓰는가

FAQ·상세 스펙·설정 그룹처럼 **제목만 훑다가 필요한 것만 펼쳐 보는** 콘텐츠. 전부 펼쳐두면 스크롤이 길어지고, 링크로 나누면 왕복이 생긴다 — 아코디언은 그 중간이다. 펼침이 애니메이션 없이 뚝 열리면 어디서 어디까지가 새 콘텐츠인지 눈이 따라가지 못한다.

**기술 선택:** CSS `grid-template-rows: 0fr ↔ 1fr` transition. `height: auto`는 애니메이션할 수 없어 보통 JS로 `scrollHeight`를 측정하지만, **fr 단위는 transition이 된다** — 측정 코드 없이 콘텐츠 높이만큼 열린다. 아코디언은 아래 콘텐츠를 밀어내는 것이 본질이라 레이아웃 전이를 피할 수 없고, 이 방식이 그 비용을 최소(JS 0줄)로 낸다. (`interpolate-size: allow-keywords`로 `height: auto` 직접 전이가 표준화 중이지만 아직 크로스 브라우저가 아니다.)

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/accordionCore.ts` | 코어 — 단일/다중 열림 목록 판정 (순수 함수) | 모든 프로젝트 |
| `assets/accordion.css` | 펼침 전이·화살표·구분선 | 모든 프로젝트 |
| `assets/Accordion.tsx` | React 컴포넌트 (ARIA 아코디언 패턴 포함) | React 프로젝트만 |

TS가 아닌 프로젝트에 복사할 때는 타입 표기를 벗겨 .js/.jsx로 저장한다 — 로직은 그대로다.

## 사용 방법 — React

```tsx
import { Accordion } from './Accordion'

const FAQS = [
  { id: 'takeout', title: '포장 되나요?', content: '네, 모든 메뉴 포장 가능합니다.' },
  { id: 'waiting', title: '웨이팅은 어떻게 하나요?', content: '매장 앞 태블릿에 등록해주세요.' },
]

const FaqSection = () => <Accordion items={FAQS} />
```

- `type="multiple"`로 여러 항목 동시 열림, `defaultOpenIds={['takeout']}`로 초기 열림 지정.
- 항목 `content`에는 어떤 ReactNode든 들어간다(이미지·목록 포함) — 높이 측정이 없으므로 내용이 동적으로 바뀌어도 다음 펼침에 자연히 반영된다.

## 사용 방법 — 순수 JS (React 없음)

트리거의 `aria-expanded`와 패널의 `data-open`만 토글하면 CSS가 나머지를 한다.

```html
<div class="accordion">
  <div class="accordion-item">
    <h3 class="accordion-header">
      <button class="accordion-trigger" aria-expanded="false" aria-controls="faq-1">
        포장 되나요? <svg class="accordion-chevron" …>…</svg>
      </button>
    </h3>
    <div class="accordion-panel" id="faq-1" data-open="false" role="region">
      <div class="accordion-panel-inner"><div class="accordion-panel-content">네, 가능합니다.</div></div>
    </div>
  </div>
</div>
```

```js
document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') !== 'true'
    trigger.setAttribute('aria-expanded', String(open))
    document.getElementById(trigger.getAttribute('aria-controls')).dataset.open = String(open)
  })
})
```

## 커스터마이즈 포인트

| 대상 | 방법 |
|------|------|
| 펼침 속도 | `--accordion-duration` (기본 300ms — 내용이 길수록 체감이 느려지므로 400ms를 넘기지 않는다) |
| 구분선 색 | `--accordion-border` (기본 #e2e8f0) |
| 열림 모드 | `Accordion`의 `type` — `single`(기본)·`multiple` |

## 주의사항

- **3층 구조(.accordion-panel > .accordion-panel-inner > .accordion-panel-content)를 유지하라** — grid 래퍼·`overflow: hidden`+`min-height: 0` 층·패딩 층이 각각 필요하다. 특히 패딩을 inner에 직접 주면 0fr로 줄어도 패딩 높이가 남아 완전히 닫히지 않는다.
- `min-height: 0`이 핵심이다 — grid 항목의 기본 `min-height: auto`가 0fr로 줄어드는 것을 막기 때문. 삭제하면 닫히지 않는다.
- 트리거는 헤딩(h3) 안의 버튼이다 — 문서 구조에 맞게 헤딩 레벨을 조정한다(WAI-ARIA 아코디언 패턴).
- single 모드에서 열린 항목을 바꾸면 닫힘과 열림이 동시에 진행된다 — 자연스러운 동작이며, 순차 진행이 필요하면 이 패턴 범위 밖이다.
- **reduced-motion 대응 내장** — 펼침·화살표를 즉시 전환한다. 블록 제거 금지.
