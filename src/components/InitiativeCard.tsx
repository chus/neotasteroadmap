'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CRITERION_CONFIG, EFFORT_CONFIG, MONTH_SHORT, isMonthInColumnRange } from '@/lib/constants'
import ReactionBar from './ReactionBar'
import type { Initiative, Criterion, ReactionCount } from '@/types'

interface Props {
  initiative: Initiative
  dimmed: boolean
  onEdit: (initiative: Initiative) => void
  onDelete: (id: string) => void
  onClick: (initiative: Initiative) => void
  reactions?: ReactionCount[]
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

export default function InitiativeCard({ initiative, dimmed, onEdit, onDelete, onClick, reactions }: Props) {
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

  const hasBottomRow = initiative.is_public || initiative.linear_project_id || initiative.target_month || initiative.effort

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg bg-white cursor-pointer"
      onClick={() => onClick(initiative)}
      {...attributes}
    >
      {/* Drag handle — full-height left edge grab zone */}
      <div
        className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-400 z-10 rounded-l-lg"
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" /><circle cx="6" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" /><circle cx="6" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" /><circle cx="6" cy="12" r="1.2" />
        </svg>
      </div>

      {/* Card body with left criterion border */}
      <div
        className="flex flex-col gap-1.5 p-3 pl-4 rounded-lg border border-neutral-200"
        style={{ borderLeft: `3px solid ${config.border}` }}
      >
        {/* Top row: title + track pill + three-dot menu */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-tight text-neutral-800 flex-1">
            {initiative.title}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {initiative.strategic_level_name && (
              <span
                className="text-[9px] font-medium rounded-full px-1.5 py-0.5 border"
                style={{
                  color: initiative.strategic_level_color,
                  borderColor: initiative.strategic_level_color + '40',
                }}
              >
                {initiative.strategic_level_name}
              </span>
            )}
            <button
              ref={triggerRef}
              onClick={handleToggleMenu}
              className="text-neutral-400 hover:text-neutral-600 text-[14px] leading-none px-1 opacity-0 group-hover:opacity-100"
            >
              ···
            </button>
          </div>
        </div>

        {/* Dropdown via portal */}
        {menuOpen && triggerRect && (
          <CardDropdown
            triggerRect={triggerRect}
            onEdit={() => onEdit(initiative)}
            onDelete={() => onDelete(initiative.id)}
            onClose={() => setMenuOpen(false)}
          />
        )}

        {/* Criteria badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: config.badge, color: config.color }}
          >
            {config.label}
          </span>
          {secondaryConfig && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded opacity-75"
              style={{ backgroundColor: secondaryConfig.badge, color: secondaryConfig.color }}
            >
              {secondaryConfig.label}
            </span>
          )}
        </div>

        {/* Confidence indicator */}
        {initiative.confidence_problem != null && initiative.confidence_solution != null && (
          <div className="flex items-center gap-1" title={`Problem confidence: ${initiative.confidence_problem}/5 · Solution confidence: ${initiative.confidence_solution}/5`}>
            <span
              className="w-1.5 h-1.5 rounded-sm"
              style={{ backgroundColor: initiative.confidence_problem <= 2 ? '#E24B4A' : initiative.confidence_problem === 3 ? '#EF9F27' : '#1D9E75' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-sm"
              style={{ backgroundColor: initiative.confidence_solution <= 2 ? '#E24B4A' : initiative.confidence_solution === 3 ? '#EF9F27' : '#1D9E75' }}
            />
          </div>
        )}

        {/* Parent badge (for child initiatives) */}
        {initiative.parent_initiative_id && initiative.parent_title && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: initiative.parent_color ?? '#5E6AD2' }}
            />
            <span className="text-[10px] text-neutral-400 truncate">
              {initiative.parent_title}
            </span>
          </div>
        )}

        {/* Dep note row (conditional) */}
        {initiative.dep_note && (
          <p className="text-[11px] italic text-neutral-400 truncate">
            <span className="not-italic">→</span> {initiative.dep_note}
          </p>
        )}

        {/* Bottom row: metadata badges */}
        {hasBottomRow && (
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-1.5">
              {initiative.is_public && (
                <span title="Visible on public roadmap">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
              )}
              {initiative.linear_project_id && (() => {
                const isDrift = initiative.sync_status === 'drift'
                const isSync = initiative.sync_status === 'in_sync'
                const bg = isDrift ? '#FAEEDA' : isSync ? '#E1F5EE' : '#5E6AD226'
                const color = isDrift ? '#633806' : isSync ? '#085041' : '#5E6AD2'
                const label = isDrift ? 'L !' : 'L'
                const title = isDrift
                  ? 'Linear drift detected — click to review'
                  : `Linked to Linear${initiative.linear_synced_at ? ` — last synced ${new Date(initiative.linear_synced_at).toLocaleString()}` : ''}`
                return (
                  <span
                    className="text-[10px] font-semibold rounded px-1.5 py-0.5"
                    style={{ backgroundColor: bg, color }}
                    title={title}
                  >
                    {label}
                  </span>
                )
              })()}
              {initiative.target_month && MONTH_SHORT[initiative.target_month] && (() => {
                const outOfRange = !isMonthInColumnRange(initiative.target_month!, initiative.column)
                return (
                  <span
                    className="text-[10px] font-medium rounded px-1.5 py-0.5"
                    style={outOfRange
                      ? { backgroundColor: '#FAEEDA', color: '#633806' }
                      : { backgroundColor: '#f5f5f5', color: '#999' }}
                    title={outOfRange ? `${MONTH_SHORT[initiative.target_month!]} is outside the typical range for this column` : undefined}
                  >
                    {MONTH_SHORT[initiative.target_month!]}{outOfRange ? ' ⚠' : ''}
                  </span>
                )
              })()}
            </div>
            <div>
              {initiative.effort && EFFORT_CONFIG[initiative.effort] && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: EFFORT_CONFIG[initiative.effort].color + '1a',
                    color: EFFORT_CONFIG[initiative.effort].color,
                  }}
                >
                  {EFFORT_CONFIG[initiative.effort].label}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reactions — show on hover, or always if any have count > 0 */}
        {reactions && (
          <div className={`mt-1 ${reactions.some((r) => r.count > 0) ? '' : 'hidden group-hover:block'}`}>
            <ReactionBar initiativeId={initiative.id} initialReactions={reactions} compact />
          </div>
        )}
      </div>
    </div>
  )
}
