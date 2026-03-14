'use client'

import { useState, useEffect, useRef } from 'react'
import { CRITERION_CONFIG, COLUMNS } from '@/lib/constants'
import type { Initiative, StrategicLevel, Criterion, Column } from '@/types'

interface Props {
  initiative?: Initiative
  defaultColumn?: Column
  strategicLevels: StrategicLevel[]
  onSave: (data: {
    title: string
    subtitle: string
    strategic_level_id: string | null
    criterion: Criterion
    criterion_secondary: Criterion | null
    dep_note: string
    column?: Column
  }) => void
  onDelete?: () => void
  onClose: () => void
}

export default function InitiativeModal({ initiative, defaultColumn, strategicLevels, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState({
    title: initiative?.title ?? '',
    subtitle: initiative?.subtitle ?? '',
    strategic_level_id: initiative?.strategic_level_id ?? (strategicLevels[0]?.id ?? ''),
    criterion: initiative?.criterion ?? ('execution_ready' as Criterion),
    criterion_secondary: initiative?.criterion_secondary ?? ('' as string),
    dep_note: initiative?.dep_note ?? '',
    column: initiative?.column ?? defaultColumn ?? ('' as string),
  })

  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  function handleSubmit() {
    if (!form.title.trim()) return
    onSave({
      title: form.title,
      subtitle: form.subtitle,
      strategic_level_id: form.strategic_level_id || null,
      criterion: form.criterion,
      criterion_secondary: form.criterion_secondary ? (form.criterion_secondary as Criterion) : null,
      dep_note: form.dep_note,
      column: form.column ? (form.column as Column) : defaultColumn,
    })
  }

  const isNew = !initiative

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-neutral-800">
          {isNew ? 'Add initiative' : 'Edit initiative'}
        </h3>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Title</label>
          <input
            className="mt-1 w-full text-[13px] font-medium border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Initiative title"
            autoFocus
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Subtitle</label>
          <textarea
            className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500 resize-none"
            rows={2}
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Optional subtitle"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Strategic level</label>
            <select
              className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
              value={form.strategic_level_id}
              onChange={(e) => setForm({ ...form, strategic_level_id: e.target.value })}
            >
              <option value="">None</option>
              {strategicLevels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          {!isNew && (
            <div className="flex-1">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Column</label>
              <select
                className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                value={form.column}
                onChange={(e) => setForm({ ...form, column: e.target.value })}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Primary criterion</label>
            <select
              className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
              value={form.criterion}
              onChange={(e) => setForm({ ...form, criterion: e.target.value as Criterion })}
            >
              {(Object.entries(CRITERION_CONFIG) as [Criterion, { label: string }][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Secondary criterion</label>
            <select
              className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
              value={form.criterion_secondary}
              onChange={(e) => setForm({ ...form, criterion_secondary: e.target.value })}
            >
              <option value="">None</option>
              {(Object.entries(CRITERION_CONFIG) as [Criterion, { label: string }][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Dependency note</label>
          <input
            className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
            value={form.dep_note}
            onChange={(e) => setForm({ ...form, dep_note: e.target.value })}
            placeholder="e.g. needs X first"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-[12px] text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim()}
              className="text-[12px] font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isNew ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
