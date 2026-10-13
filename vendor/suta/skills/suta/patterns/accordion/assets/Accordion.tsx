import { useId, useState, type ReactNode } from 'react'
import { toggleOpen } from './accordionCore'
import './accordion.css'

export type AccordionItemData = {
  /** 항목 식별자 — defaultOpenIds에서 이 값을 쓴다 */
  id: string
  title: ReactNode
  content: ReactNode
}

type AccordionProps = {
  items: AccordionItemData[]
  /** 'single'(기본): 한 번에 하나만 열림, 'multiple': 여러 개 */
  type?: 'single' | 'multiple'
  /** 처음부터 열려 있을 항목 id 목록 */
  defaultOpenIds?: string[]
  className?: string
}

/**
 * toggleOpen 코어의 React 래퍼 — WAI-ARIA 아코디언 패턴.
 * 트리거는 헤딩 안의 버튼(aria-expanded/aria-controls), 패널은 role=region.
 * 패널은 언마운트하지 않고 data-open으로 여닫아 닫힘 애니메이션을 CSS에 맡긴다.
 */
export const Accordion = ({ items, type = 'single', defaultOpenIds = [], className }: AccordionProps) => {
  const [openIds, setOpenIds] = useState(defaultOpenIds)
  const baseId = useId()

  return (
    <div className={className ? `accordion ${className}` : 'accordion'}>
      {items.map((item) => {
        const open = openIds.includes(item.id)
        const triggerId = `${baseId}-${item.id}-trigger`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div className="accordion-item" key={item.id}>
            <h3 className="accordion-header">
              <button
                type="button"
                id={triggerId}
                className="accordion-trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() =>
                  setOpenIds((prev) => toggleOpen({ openIds: prev, id: item.id, single: type === 'single' }))
                }
              >
                {item.title}
                <svg className="accordion-chevron" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              className="accordion-panel"
              role="region"
              aria-labelledby={triggerId}
              data-open={open ? 'true' : 'false'}
              aria-hidden={!open}
            >
              <div className="accordion-panel-inner">
                <div className="accordion-panel-content">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
