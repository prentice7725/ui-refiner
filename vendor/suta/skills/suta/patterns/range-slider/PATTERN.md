---
name: range-slider
description: 두 손잡이로 최소·최대 구간을 고르는 범위 슬라이더(range slider, 가격·기간 필터) 컴포넌트를 구현한다 — 손잡이가 서로를 지나치지 않고 고른 구간이 색으로 채워지며 방향키로도 조절된다. "가격 범위 슬라이더, 최소값 최대값 손잡이 두 개, 구간 필터, 두 개짜리 슬라이더" 요청에 쓴다. 기존 적용분의 손잡이·채움 색·단계 수정에도 쓴다.
---

# range-slider — 두 손잡이 범위 슬라이더

라이브 데모: https://guksu.github.io/suta/#/range-slider

## 언제 쓰는가

가격 필터, 기간 선택, 평점 범위처럼 **연속된 값에서 구간을 고를 때**. 값 하나만 고른다면 네이티브 `<input type="range">` 하나면 충분하다 — 이 패턴은 **손잡이가 둘**일 때를 위한 것이다.

정확한 숫자가 중요한 값(정확히 12,340원)에는 슬라이더가 나쁜 선택이다. 슬라이더는 "대충 이 정도"를 고르는 도구이므로 숫자 입력을 함께 두거나 아예 입력으로 바꾼다.

**기술 선택:** 네이티브 `<input type="range">` **두 개를 겹쳐** 놓았다. div로 직접 그리면 키보드 조작·스크린 리더·터치·고대비 모드를 전부 다시 만들어야 하는데, 네이티브를 쓰면 그것들이 공짜다. 보이는 트랙과 채움은 별도 요소이고, input 자신은 투명하게 만들어 손잡이만 남긴다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/rangeValues.ts` | 값 규칙 (순수 함수, DOM 없음) — 눈금·경계·교차·겹침 | 모든 프로젝트 |
| `assets/RangeSlider.tsx` | React 컴포넌트 | React 프로젝트만 |
| `assets/range-slider.css` | 트랙·채움·손잡이 | 모든 프로젝트 |

## 값의 규칙이 진짜 내용이다

드래그는 브라우저가 해 준다. 직접 만들면 무너지는 곳은 값이다.

| 상황 | 이 패턴의 처리 |
|------|---------------|
| 최저가를 최고가 너머로 끈다 | **움직인 쪽이 멈춘다.** 상대를 밀어내지 않는다 — 밀어내면 건드리지도 않은 값이 바뀐다 |
| 두 값이 붙어야 할 최소 간격이 있다 | `minDistance`만큼 떨어져 멈춘다 |
| 눈금이 0.1처럼 소수다 | 부동소수 오차를 눈금의 자릿수로 정리한다 |
| 두 손잡이가 정확히 겹쳤다 | 몰려 있는 쪽의 **반대로 끌 수 있게** 위아래를 정한다 (오른쪽 끝이면 아래쪽 손잡이가 위로) |
| 손잡이를 정확히 못 집었다 | 트랙을 누르면 가까운 손잡이가 그 자리로 온다 |

## 사용 방법 — React

```tsx
import { useState } from 'react'
import { RangeSlider, type RangeValue } from './RangeSlider'

const PriceFilter = () => {
  const [price, setPrice] = useState<RangeValue>({ lower: 8000, upper: 20000 })

  return (
    <>
      <p>
        {price.lower.toLocaleString('ko-KR')}원 ~ {price.upper.toLocaleString('ko-KR')}원
      </p>
      <RangeSlider
        min={0}
        max={50000}
        step={1000}
        value={price}
        onChange={setPrice}
        minDistance={1000}
        label={{ lower: '최저 가격', upper: '최고 가격' }}
        format={(value) => `${value.toLocaleString('ko-KR')}원`}
      />
    </>
  )
}
```

`format`은 스크린 리더용이다 — 없으면 "12000"으로 읽히고, 있으면 "12,000원"으로 읽힌다(`aria-valuetext`).

**값 표시는 컴포넌트 밖에 둔다.** 어디에 어떻게 보여줄지는 화면마다 다르고, 슬라이더가 정할 일이 아니다.

## 사용 방법 — 순수 JS (React 없음)

값 규칙만 가져다 쓰고 DOM은 직접 갱신한다:

```js
import { clampPair, snapValue, toPercent } from './rangeValues.js'

lowerInput.addEventListener('input', () => {
  const next = clampPair({
    lower: snapValue({ value: Number(lowerInput.value), min: 0, max: 50000, step: 1000 }),
    upper: state.upper,
    moved: 'lower',
  })
  state = next
  root.style.setProperty('--range-lower', `${toPercent({ value: next.lower, min: 0, max: 50000 })}%`)
  lowerInput.value = String(next.lower)
})
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 눈금 | `step` | 1 |
| 최소 간격 | `minDistance` | 0 (붙어도 된다) |
| 트랙 두께·손잡이 크기 | `--range-height`·`--range-thumb-size` | 6px / 24px |
| 색 | `--range-accent`(손잡이 테두리+채움)·`--range-track`·`--range-thumb` | 거의 검정(#1b1e24) / 회색 / 흰색 |

## 주의사항

- **손잡이는 44px 이상 잡히게 하라.** 기본 24px은 WCAG 2.2의 최소 누르는 영역이고, 손가락 터치 목표로는 작다. 모바일이 주 사용처면 `--range-thumb-size`를 키우거나 트랙 높이를 늘려 잡기 쉽게 만든다.
- **`touch-action: none`이 걸려 있다.** 손잡이를 끄는 동안 화면이 함께 스크롤되지 않게 하기 위한 것으로, 슬라이더 위에서는 세로 스크롤이 되지 않는다. 목록 한가운데 놓을 때는 위아래로 여백을 충분히 둔다.
- **`aria-valuetext`를 반드시 채워라**(`format`). 숫자만 읽히면 "12000"이 되어 단위를 알 수 없다.
- **트랙 클릭은 가까운 손잡이를 옮긴다.** 손잡이를 정확히 집지 않아도 조작되게 하려는 것이며, 정밀 조작은 방향키(한 눈금씩)와 PageUp/PageDown(브라우저 기본)이 맡는다.
- **세로 슬라이더는 범위 밖이다** — 가로 배치만 계산한다.
- **reduced-motion 대응 내장** — 손잡이가 커지는 연출만 사라지고 조작은 그대로다.
- 이 패턴은 값 두 개만 다룬다. 손잡이가 셋 이상이거나 구간마다 색이 달라야 한다면 직접 그리는 편이 낫고, 그때는 키보드·스크린 리더 대응을 처음부터 만들어야 한다.
