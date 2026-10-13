import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createDropZone } from './createDropZone'
import { formatBytes, validateFiles, type FileRejection } from './validateFiles'
import './file-upload.css'

export type UploadFile = {
  id: string
  file: File
  /** 0~100. 없으면 진행 막대를 그리지 않는다 */
  progress?: number
  /** 업로드 실패 사유 */
  error?: string
}

type FileDropZoneProps = {
  files: UploadFile[]
  /** 검증을 통과한 파일들 — 여기서 업로드를 시작한다 */
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  /** 거절된 파일들 — 이유와 함께 온다 */
  onReject?: (rejections: FileRejection[]) => void
  /** input의 accept와 같은 형식 */
  accept?: string
  maxSizeBytes?: number
  maxFiles?: number
  /** 영역 안에 그릴 안내 문구 — 기본 안내(한국어)를 바꿀 때도 여기에 넘긴다 */
  children?: ReactNode
  disabled?: boolean
  /** 화면 낭독 문구 — 진행 막대와 지우기 버튼의 이름. 기본은 한국어 */
  labels?: { uploading: (name: string) => string; remove: (name: string) => string }
}

const DEFAULT_LABELS = { uploading: (name: string) => `${name} 업로드`, remove: (name: string) => `${name} 지우기` }

const isImage = (file: File) => file.type.startsWith('image/')

/**
 * 파일 끌어다 놓기 영역 — 제스처는 createDropZone이, 검증은 validateFiles가 담당한다.
 *
 * **끌어다 놓기만으로는 부족하다.** 키보드만 쓰는 사람에게 드래그는 존재하지 않는 기능이라
 * 영역 전체가 파일 선택 버튼을 겸한다(라벨로 감싼 숨은 input). 그래서 Tab → Enter로도 열린다.
 *
 * 미리보기는 objectURL로 만든다 — 다 쓰면 반드시 되돌려 줘야 메모리에 남지 않는다.
 */
export const FileDropZone = ({
  files,
  onAdd,
  onRemove,
  onReject,
  accept,
  maxSizeBytes,
  maxFiles,
  children,
  disabled = false,
  labels = DEFAULT_LABELS,
}: FileDropZoneProps) => {
  const zoneRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handlersRef = useRef({ onAdd, onReject, accept, maxSizeBytes, maxFiles, count: files.length, disabled })
  handlersRef.current = { onAdd, onReject, accept, maxSizeBytes, maxFiles, count: files.length, disabled }

  useEffect(function bindDropZone() {
    const zone = zoneRef.current
    if (!zone) return
    const controller = createDropZone({
      zone,
      onDragStateChange: setDragging,
      onDrop: (dropped) => {
        const current = handlersRef.current
        if (current.disabled) return
        const { accepted, rejected } = validateFiles({
          files: dropped,
          accept: current.accept,
          maxSizeBytes: current.maxSizeBytes,
          maxFiles: current.maxFiles,
          currentCount: current.count,
        })
        if (accepted.length > 0) current.onAdd(accepted)
        if (rejected.length > 0) current.onReject?.(rejected)
      },
    })
    return controller.destroy
  }, [])

  // 미리보기 주소는 파일마다 하나씩 만들고, 목록에서 빠지면 되돌려 준다(안 그러면 메모리에 남는다)
  const previews = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of files) {
      if (isImage(item.file)) map.set(item.id, URL.createObjectURL(item.file))
    }
    return map
  }, [files])

  useEffect(
    function revokePreviews() {
      return () => previews.forEach((url) => URL.revokeObjectURL(url))
    },
    [previews],
  )

  const full = maxFiles !== undefined && files.length >= maxFiles

  return (
    <div className="upload-root">
      <div
        ref={zoneRef}
        className="upload-zone"
        data-dragging={dragging ? 'true' : 'false'}
        data-disabled={disabled || full ? 'true' : undefined}
      >
        {/* 라벨이 영역 전체를 덮어 클릭·키보드 모두 파일 선택으로 이어진다 */}
        <label className="upload-label">
          <input
            ref={inputRef}
            className="upload-input"
            type="file"
            multiple={maxFiles !== 1}
            accept={accept}
            disabled={disabled || full}
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? [])
              const { accepted, rejected } = validateFiles({ files: picked, accept, maxSizeBytes, maxFiles, currentCount: files.length })
              if (accepted.length > 0) onAdd(accepted)
              if (rejected.length > 0) onReject?.(rejected)
              // 같은 파일을 다시 고를 수 있게 비운다 — 안 그러면 두 번째 선택에서 change가 오지 않는다
              event.target.value = ''
            }}
          />
          <span className="upload-guide">
            {children ?? (
              <>
                <strong>파일을 끌어다 놓거나 눌러서 고르세요</strong>
                <span className="upload-limits">
                  {accept ? `${accept} · ` : ''}
                  {maxSizeBytes ? `${formatBytes(maxSizeBytes)} 이하 · ` : ''}
                  {maxFiles ? `최대 ${maxFiles}개` : ''}
                </span>
              </>
            )}
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <ul className="upload-list">
          {files.map((item) => (
            <li key={item.id} className="upload-item" data-error={item.error ? 'true' : undefined}>
              {previews.has(item.id) ? (
                <img className="upload-thumb" src={previews.get(item.id)} alt="" />
              ) : (
                <span className="upload-thumb upload-thumb-icon" aria-hidden="true">
                  {/* 미리보기가 없는 파일 — 이모지는 기기마다 모양이 달라 선 아이콘을 쓴다 */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5" />
                  </svg>
                </span>
              )}

              <span className="upload-meta">
                <span className="upload-name">{item.file.name}</span>
                <span className="upload-size">{item.error ?? formatBytes(item.file.size)}</span>
                {item.progress !== undefined && item.progress < 100 && !item.error && (
                  <span
                    className="upload-progress"
                    role="progressbar"
                    aria-label={labels.uploading(item.file.name)}
                    aria-valuenow={Math.round(item.progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span className="upload-progress-bar" style={{ transform: `scaleX(${item.progress / 100})` }} />
                  </span>
                )}
              </span>

              <button type="button" className="upload-remove" aria-label={labels.remove(item.file.name)} onClick={() => onRemove(item.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
