'use client'

import { useState, useEffect, useRef } from 'react'
import { CRITERION_CONFIG, COLUMNS, EFFORT_CONFIG, MONTHS_2026, PHASE_CONFIG, PARENT_COLORS, INITIATIVE_TEMPLATES } from '@/lib/constants'
import type { Initiative, StrategicLevel, Criterion, Column, Phase } from '@/types'
import type { InitiativeTemplate } from '@/lib/constants'

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
    effort?: string | null
    target_month?: string | null
    column?: Column
    is_parent?: boolean
    parent_color?: string | null
    phase?: string | null
  }) => void
  onDelete?: () => void
  onClose: () => void
}

export default function InitiativeModal({ initiative, defaultColumn, strategicLevels, onSave, onDelete, onClose }: Props) {
  const isNew = !initiative

  const [step, setStep] = useState<'template' | 'form'>(isNew ? 'template' : 'form')
  const [selectedTemplate, setSelectedTemplate] = useState<InitiativeTemplate | null>(null)

  const makeDefaultForm = (template?: InitiativeTemplate | null) => ({
    title: initiative?.title ?? '',
    subtitle: initiative?.subtitle ?? template?.defaults.subtitle ?? '',
    strategic_level_id: initiative?.strategic_level_id ?? (strategicLevels[0]?.id ?? ''),
    criterion: initiative?.criterion ?? template?.defaults.criterion ?? ('execution_ready' as Criterion),
    criterion_secondary: initiative?.criterion_secondary ?? template?.defaults.criterion_secondary ?? ('' as string),
    dep_note: initiative?.dep_note ?? template?.defaults.dep_note ?? '',
    effort: initiative?.effort ?? template?.defaults.effort ?? '',
    target_month: initiative?.target_month ?? '',
    column: initiative?.column ?? defaultColumn ?? ('' as string),
    is_parent: initiative?.is_parent ?? (template?.id === 'strategic_bet' ? true : false),
    parent_color: initiative?.parent_color ?? PARENT_COLORS[0],
    phase: initiative?.phase ?? '',
  })

  const [form, setForm] = useState(makeDefaultForm())

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

  function handleSelectTemplate(template: InitiativeTemplate) {
    setSelectedTemplate(template)
    setForm(makeDefaultForm(template))
    setStep('form')
  }

  function handleStartBlank() {
    setSelectedTemplate(null)
    setForm(makeDefaultForm())
    setStep('form')
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
      effort: form.effort || null,
      target_month: form.target_month || null,
      column: form.column ? (form.column as Column) : defaultColumn,
      is_parent: form.is_parent,
      parent_color: form.is_parent ? form.parent_color : null,
      phase: form.is_parent && form.phase ? form.phase : null,
    })
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        {/* Step 1 — Template picker */}
        {step === 'template' && (
          <>
            <h3 className="text-[14px] font-semibold text-neutral-800">Add initiative</h3>
            <p className="text-[13px] text-neutral-400">Start from a template</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {INITIATIVE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="text-left p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                >
                  <div className="text-[13px] font-medium text-neutral-800">{t.label}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{t.description}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleStartBlank}
                className="text-[12px] text-neutral-400 hover:text-neutral-600 underline"
              >
                Start blank
              </button>
              <button
                onClick={onClose}
                className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Form */}
        {step === 'form' && (
          <>
            <h3 className="text-[14px] font-semibold text-neutral-800">
              {isNew ? 'Add initiative' : 'Edit initiative'}
            </h3>

            {/* Template badge */}
            {isNew && selectedTemplate && (
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                  {selectedTemplate.label}
                </span>
                <button
                  onClick={() => setStep('template')}
                  className="hover:text-neutral-600 underline"
                >
                  Change
                </button>
              </div>
            )}

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

            {/* Strategic bet toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Strategic bet</span>
                <p className="text-[10px] text-neutral-400 mt-0.5">Parent initiative with child items and phase tracking.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_parent: !form.is_parent })}
                className={`relative w-9 h-5 rounded-full transition-colors ${form.is_parent ? 'bg-[#5E6AD2]' : 'bg-neutral-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_parent ? 'translate-x-4' : ''}`} />
              </button>
            </div>

            {/* Color picker + Phase (visible only for strategic bets) */}
            {form.is_parent && (
              <div className="space-y-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Color</label>
                  <div className="flex gap-1.5 mt-1.5">
                    {PARENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, parent_color: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${form.parent_color === c ? 'border-neutral-800 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Phase</label>
                  <select
                    className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                    value={form.phase}
                    onChange={(e) => setForm({ ...form, phase: e.target.value })}
                  >
                    <option value="">None</option>
                    {(Object.entries(PHASE_CONFIG) as [Phase, { label: string }][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Effort estimate</label>
              <select
                className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                value={form.effort}
                onChange={(e) => setForm({ ...form, effort: e.target.value })}
              >
                <option value="">None</option>
                {Object.entries(EFFORT_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-400 mt-0.5">XS = hours, S = days, M = 1-2 weeks, L = 3-4 weeks, XL = 4+ weeks.</p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Target month</label>
              <select
                className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                value={form.target_month}
                onChange={(e) => setForm({ ...form, target_month: e.target.value })}
              >
                <option value="">None</option>
                {MONTHS_2026.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
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
          </>
        )}
      </div>
    </div>
  )
}
