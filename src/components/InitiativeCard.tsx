'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CRITERION_CONFIG, EFFORT_CONFIG, MONTH_SHORT } from '@/lib/constants'
import type { Initiative, Criterion } from '@/types'

interface Props {
  initiative: Initiative
  dimmed: boolean
  onEdit: (initiative: Initiative) => void
  onDelete: (id: string) => void
  onClick: (initiative: Initiative) => void
}

function CardDropdown({
  triggerRect,
  onEdit,
  onDelete,
  onClose,
}: {
  triggerRect: DOMRect
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      className="py-1"
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: triggerRect.bottom + 4,
        right: window.innerWidth - triggerRect.right,
        minWidth: 120,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); onEdit() }}
        className="w-full text-left text-[13px] px-3 hover:bg-[#f5f5f5] text-neutral-700"
        style={{ height: 36 }}
      >
        Edit
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
          if (confirm('Delete this initiative?')) onDelete()
        }}
        className="w-full text-left text-[13px] px-3 hover:bg-[#f5f5f5]"
        style={{ height: 36, color: '#dc2626' }}
      >
        Delete
      </button>
    </div>,
    document.body
  )
}

export default function InitiativeCard({ initiative, dimmed, onEdit, onDelete, onClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: initiative.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : dimmed ? 0.25 : 1,
  }

  const config = CRITERION_CONFIG[initiative.criterion]
  const secondaryConfig = initiative.criterion_secondary
    ? CRITERION_CONFIG[initiative.criterion_secondary as Criterion]
    : null

  const handleToggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!menuOpen && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
    setMenuOpen(!menuOpen)
  }, [menuOpen])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border border-neutral-200 bg-white overflow-hidden cursor-pointer"
      onClick={() => onClick(initiative)}
      {...attributes}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: config.border }} />
      <div className="p-3 pl-4">
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing px-0.5 text-neutral-400 text-[12px]"
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </div>

        {/* Three-dot trigger */}
        <div className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100">
          <button
            ref={triggerRef}
            onClick={handleToggleMenu}
            className="text-neutral-400 hover:text-neutral-600 text-[14px] leading-none px-1"
          >
            ···
          </button>
        </div>

        {/* Fixed dropdown via portal */}
        {menuOpen && triggerRect && (
          <CardDropdown
            triggerRect={triggerRect}
            onEdit={() => onEdit(initiative)}
            onDelete={() => onDelete(initiative.id)}
            onClose={() => setMenuOpen(false)}
          />
        )}

        {/* Strategic level pill top-right */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-tight text-neutral-800">
            {initiative.title}
          </span>
          {initiative.strategic_level_name && (
            <span
              className="shrink-0 text-[9px] font-medium rounded-full px-1.5 py-0.5 mt-0.5 border"
              style={{
                color: initiative.strategic_level_color,
                borderColor: initiative.strategic_level_color + '40',
              }}
            >
              {initiative.strategic_level_name}
            </span>
          )}
        </div>

        {initiative.subtitle && (
          <p className="text-[12px] text-neutral-500 mt-0.5">{initiative.subtitle}</p>
        )}

        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: config.badge, color: config.color }}
          >
            {config.label}
          </span>
          {secondaryConfig && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded opacity-80"
              style={{ backgroundColor: secondaryConfig.badge, color: secondaryConfig.color }}
            >
              {secondaryConfig.label}
            </span>
          )}
        </div>

        {initiative.dep_note && (
          <p className="text-[11px] italic text-neutral-400 mt-1">
            <span className="not-italic">→</span> {initiative.dep_note}
          </p>
        )}

        <div className="absolute left-2 bottom-2 flex items-center gap-1.5">
          {initiative.is_public && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          )}
          {initiative.target_month && MONTH_SHORT[initiative.target_month] && (
            <span className="text-[9px] font-medium text-neutral-400 bg-neutral-100 rounded px-1 py-0.5">
              {MONTH_SHORT[initiative.target_month]}
            </span>
          )}
        </div>

        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {initiative.effort && EFFORT_CONFIG[initiative.effort] && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: EFFORT_CONFIG[initiative.effort].color + '1a',
                color: EFFORT_CONFIG[initiative.effort].color,
              }}
            >
              {EFFORT_CONFIG[initiative.effort].label}
            </span>
          )}
          {initiative.linear_project_id && (
            <span
              className="text-[10px] font-semibold rounded px-[5px] py-[2px]"
              style={{ backgroundColor: '#5E6AD226', color: '#5E6AD2' }}
              title={`Linked to Linear${initiative.linear_synced_at ? ` — last synced ${new Date(initiative.linear_synced_at).toLocaleString()}` : ''}`}
            >
              L
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
