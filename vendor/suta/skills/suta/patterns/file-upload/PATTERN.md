---
name: file-upload
description: 파일 끌어다 놓기 업로드(file upload, drop zone) 영역을 구현한다 — 파일을 끌어오면 테두리가 살아나고, 놓으면 미리보기와 진행률이 보이며, 형식·용량·개수에 안 맞는 파일은 이유와 함께 거절한다. "파일 업로드, 드래그 앤 드롭 업로드, 이미지 첨부, 사진 올리는 기능, 드롭존" 요청에 쓴다. 기존 적용분의 용량 제한·허용 형식·개수 수정에도 쓴다.
---

# file-upload — 끌어다 놓는 파일 업로드

라이브 데모: https://guksu.github.io/suta/#/file-upload

## 언제 쓰는가

리뷰 사진 첨부, 프로필 이미지, 서류 제출처럼 **사용자가 파일을 올리는 모든 곳**에. 파일이 하나뿐이고 이미지도 아니라면 그냥 `<input type="file">` 하나로 충분하다 — 이 패턴은 **여러 개를 올리거나, 미리보기·진행률을 보여줘야 할 때** 값을 한다.

**기술 선택:** 네이티브 `<input type="file">` + HTML5 드래그 앤 드롭. 라이브러리 불필요. 업로드 자체(fetch·XHR)는 이 패턴 밖이다 — 인증·재시도·저장소가 프로젝트마다 다르기 때문이다. 이 패턴은 **파일을 받아 내는 데까지**를 담당하고 진행률은 값으로 받아 그린다.

| 파일 | 층 | 복사 대상 |
|------|-----|----------|
| `assets/validateFiles.ts` | 검증 (순수 함수, DOM 없음) — 형식·용량·개수와 거절 사유 | 모든 프로젝트 |
| `assets/createDropZone.ts` | 코어 — 끌기 판정·기본 동작 차단 | 모든 프로젝트 |
| `assets/FileDropZone.tsx` | React 컴포넌트 — 미리보기·진행률·지우기 | React 프로젝트만 |
| `assets/file-upload.css` | 영역·목록·진행 막대 | 모든 프로젝트 |

## 브라우저 기본 동작이 방해가 되는 드문 경우다

| 함정 | 증상 | 처리 |
|------|------|------|
| `dragover`에서 `preventDefault`를 안 한다 | **`drop`이 아예 오지 않는다** — 가장 흔한 원인 | 코어가 막는다 |
| 영역 밖에 파일을 놓는다 | 브라우저가 그 파일을 탭에 열어 **작성 중이던 화면이 사라진다** | 창 전체의 드롭을 삼킨다(`blockWindowDrop`) |
| `dragenter`/`dragleave`를 그대로 쓴다 | 자식 위를 지날 때마다 테두리가 깜빡인다 | 들어온 횟수를 세어 0일 때만 벗어난 것으로 본다 |
| 같은 파일을 다시 고른다 | 두 번째 선택에서 `change`가 오지 않는다 | 고른 뒤 input 값을 비운다 |
| 미리보기를 objectURL로 만든다 | 되돌려 주지 않으면 메모리에 남는다 | 목록에서 빠질 때 `revokeObjectURL` |

## 사용 방법 — React

컴포넌트는 **파일 목록을 받아 그리기만 한다.** 업로드와 진행률은 화면 쪽이 소유한다.

```tsx
import { useState } from 'react'
import { FileDropZone, type UploadFile } from './FileDropZone'

const ReviewPhotos = () => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [message, setMessage] = useState('')

  const add = (accepted: File[]) => {
    const added = accepted.map((file) => ({ id: crypto.randomUUID(), file, progress: 0 }))
    setFiles((prev) => [...prev, ...added])
    added.forEach(({ id, file }) => upload({ id, file }))
  }

  return (
    <>
      <FileDropZone
        files={files}
        onAdd={add}
        onRemove={(id) => setFiles((prev) => prev.filter((item) => item.id !== id))}
        onReject={(rejections) => setMessage(describeRejections(rejections))}
        accept="image/*"
        maxSizeBytes={5 * 1024 * 1024}
        maxFiles={5}
      />
      <p role="alert">{message}</p>
    </>
  )
}
```

### 진행률 잇기 — `fetch`가 아니라 `XMLHttpRequest`

업로드 진행률은 `fetch`로는 알 수 없다(요청 본문의 진행 이벤트가 없다). 진행 막대가 필요하면 XHR을 쓴다:

```ts
const upload = ({ id, file }: { id: string; file: File }) => {
  const body = new FormData()
  body.append('photo', file)

  const request = new XMLHttpRequest()
  request.upload.addEventListener('progress', (event) => {
    if (!event.lengthComputable) return
    const progress = (event.loaded / event.total) * 100
    setFiles((prev) => prev.map((item) => (item.id === id ? { ...item, progress } : item)))
  })
  request.addEventListener('load', () => {
    const failed = request.status >= 400
    setFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, progress: 100, error: failed ? '업로드 실패' : undefined } : item)),
    )
  })
  request.open('POST', '/api/photos')
  request.send(body)
}
```

### 거절 사유를 사람 말로

`onReject`는 이유(`type`·`size`·`count`)를 파일과 함께 준다. **"업로드 실패"만 띄우면 무엇을 고쳐야 할지 알 수 없다.**

```ts
const describeRejections = (rejections: FileRejection[]) =>
  rejections
    .map(({ file, reason }) =>
      reason === 'type' ? `${file.name}: 이미지만 올릴 수 있어요`
      : reason === 'size' ? `${file.name}: 5MB를 넘습니다`
      : `${file.name}: 최대 5장까지만 올릴 수 있어요`,
    )
    .join('\n')
```

## 사용 방법 — 순수 JS (React 없음)

```js
import { createDropZone } from './createDropZone.js'
import { validateFiles } from './validateFiles.js'

createDropZone({
  zone: document.querySelector('.upload-zone'),
  onDrop: (files) => {
    const { accepted, rejected } = validateFiles({ files, accept: 'image/*', maxSizeBytes: 5e6, maxFiles: 5 })
    accepted.forEach(upload)
    rejected.forEach(showReason)
  },
})
```

## 커스터마이즈 포인트

| 대상 | 방법 | 기본값 |
|------|------|--------|
| 받을 형식 | `accept` — `"image/*"`·`".pdf"`·`"image/png,.heic"` | 제한 없음 |
| 용량·개수 | `maxSizeBytes`·`maxFiles` | 제한 없음 |
| 안내 문구 | `children`으로 직접 그린다 | 기본 문구 + 제한 요약 |
| 색 | `--upload-accent`·`--upload-border`·`--upload-error` | 거의 검정(#1b1e24) / 회색 / 빨강 |
| 창 전체 드롭 차단 | `blockWindowDrop` (코어) | 켜짐 |
| 안내·낭독 문구 | 안내는 `children`, 진행 막대·지우기 버튼 이름은 `labels` — `{ uploading(name), remove(name) }` | 한국어 |

## 주의사항

- **끌어다 놓기만으로는 부족하다.** 키보드만 쓰는 사람에게 드래그는 존재하지 않는 기능이다 — 영역 전체가 파일 선택 버튼을 겸하도록 라벨로 감쌌고, Tab → Enter로 열린다. 숨긴 input에 `display: none`을 쓰면 포커스가 닿지 않으니 그렇게 감추지 말라.
- **클라이언트 검증은 UX이지 보안이 아니다.** `accept`도 용량 제한도 사용자가 우회할 수 있다 — **서버에서 다시 검사한다.**
- **이미지 미리보기는 원본을 그대로 그린다.** 10MB짜리 사진 다섯 장이면 브라우저가 무거워지므로, 목록이 길어질 수 있는 화면에서는 캔버스로 축소한 뒤 보여주는 편이 낫다.
- **모바일 카메라로 바로 찍게 하려면** `<input>`에 `capture` 속성이 따로 필요하다(이 컴포넌트는 넘기지 않는다).
- **폴더 끌어다 놓기는 범위 밖이다** — 폴더는 `dataTransfer.items`의 별도 API로 훑어야 하고, 그 안에서 다시 재귀 탐색이 필요하다.
- **진행률은 `fetch`로 알 수 없다** — 위의 XHR 예시를 쓴다.
- **reduced-motion 대응 내장** — 목록 등장 연출은 사라지지만 진행 막대의 전이는 남는다. 그것은 연출이 아니라 "얼마나 왔는지"를 잇는 정보다.
