import { createElement } from 'react'
import { CUTOUT_STYLE, drawOrder, type IconName } from './icons'

type IconProps = {
  name: IconName
  size?: number
  strokeWidth?: number
  /** 글자 없이 아이콘만 있는 버튼이면 뜻을 적는다(화면 낭독기가 읽는다). 옆에 글자가 있으면 비워서 숨긴다 */
  label?: string
  /** 닫힌 모양(home·heart·star·user·bell·bag)을 채운다 — 선택된 탭·눌린 찜. 안쪽 선은 `--icon-cutout`(기본 흰색)으로 남는다 */
  filled?: boolean
  className?: string
}

/** 선 아이콘 한 벌의 React 래퍼 — 색은 글자 색(currentColor)을 따른다 */
export const Icon = ({ name, size = 24, strokeWidth = 1.75, label, filled = false, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    {drawOrder({ name, filled }).map(({ node: [tag, attrs], index, cutout }) =>
      // 채운 모양의 안쪽 선(손잡이·문)은 바탕색으로, 외곽보다 나중에 그린다 — icons.ts FILL_CUTOUTS
      createElement(tag, { key: index, ...attrs, style: cutout ? { stroke: CUTOUT_STYLE, fill: 'none' } : undefined }),
    )}
  </svg>
)
